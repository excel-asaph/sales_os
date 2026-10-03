import "dotenv/config";
import { Client } from "pg";

// Read-only totals for the public website's results section
// (docs/V2_WEBSITE.md: "only real numbers"). Prints counts and medians and
// nothing about any customer: no names, numbers or messages.
//
// Safe against production by construction: one connection, switched to
// read-only before any query, so nothing here could write even by mistake.
// Works on both database layouts: before v2 (no test-chat customers exist)
// and after (Customer.isTest, left out).
//
//   npx tsx scripts/site-stats.ts                       DATABASE_URL from .env
//   npx tsx scripts/site-stats.ts --business-id <id>    one business only
//
// Against production, set DATABASE_URL to the database's public URL for the
// one command (Railway: the Postgres service's DATABASE_PUBLIC_URL).

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const businessId = getArg("--business-id") ?? null;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY");

    const { rows: col } = await client.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_test'"
    );
    // Real customers of the chosen business (or all), whatever the layout.
    const real = `${col.length ? "NOT c.is_test" : "TRUE"} AND ($1::text IS NULL OR c.business_id = $1)`;
    const one = async (sql: string) => (await client.query(sql, [businessId])).rows[0];

    const first = await one(`SELECT MIN(v.created_at) AS at FROM conversations v JOIN customers c ON c.id = v.customer_id WHERE ${real}`);
    const conversations = await one(`SELECT COUNT(*)::int AS n FROM conversations v JOIN customers c ON c.id = v.customer_id WHERE ${real}`);
    const sales = await one(`
      SELECT COUNT(*)::int AS n, COALESCE(SUM(o.expected_amount), 0)::float AS revenue
      FROM orders o JOIN conversations v ON v.id = o.conversation_id JOIN customers c ON c.id = v.customer_id
      WHERE o.status = 'VERIFIED' AND ${real}`);
    // Verified sales where at least one follow-up had been sent before the
    // payment was verified: sales the follow-ups plausibly recovered.
    const afterFollowup = await one(`
      SELECT COUNT(*)::int AS n FROM orders o
      JOIN conversations v ON v.id = o.conversation_id JOIN customers c ON c.id = v.customer_id
      WHERE o.status = 'VERIFIED' AND ${real}
        AND EXISTS (SELECT 1 FROM events e WHERE e.conversation_id = v.id AND e.type = 'FOLLOWUP_SENT' AND e.created_at < o.verified_at)`);
    // Median seconds from a conversation's first customer message to the
    // first reply after it, AI or human.
    const reply = await one(`
      WITH firsts AS (
        SELECT v.id,
          MIN(m.created_at) FILTER (WHERE m.direction = 'INBOUND') AS first_in,
          MIN(m.created_at) FILTER (WHERE m.direction = 'OUTBOUND') AS first_out
        FROM conversations v JOIN customers c ON c.id = v.customer_id JOIN messages m ON m.conversation_id = v.id
        WHERE ${real} GROUP BY v.id)
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM first_out - first_in))::float AS median,
             percentile_cont(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM first_out - first_in))::float AS p90,
             COUNT(*)::int AS n
      FROM firsts WHERE first_in IS NOT NULL AND first_out > first_in`);
    // Customer messages that arrived between 9pm and 7am, Lagos time.
    const night = await one(`
      SELECT COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Lagos') >= 21
                               OR EXTRACT(HOUR FROM m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Lagos') < 7)::int AS night,
             COUNT(*)::int AS total
      FROM messages m JOIN conversations v ON v.id = m.conversation_id JOIN customers c ON c.id = v.customer_id
      WHERE m.direction = 'INBOUND' AND ${real}`);

    const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "n/a");
    const secs = (s: number | null) => (s === null ? "n/a" : s < 120 ? `${Math.round(s)} seconds` : `${Math.round(s / 60)} minutes`);
    console.log(`Layout:                         ${col.length ? "v2" : "v1 (before v2)"}`);
    console.log(`Since:                          ${first.at ? new Date(first.at).toISOString().slice(0, 10) : "no conversations"}`);
    console.log(`Conversations handled:          ${conversations.n}`);
    console.log(`Verified sales:                 ${sales.n}`);
    console.log(`Revenue from verified sales:    NGN ${Number(sales.revenue).toLocaleString("en-NG")}`);
    console.log(`Sales after a follow-up:        ${afterFollowup.n} (${pct(afterFollowup.n, sales.n)} of verified sales)`);
    console.log(`Time to first reply:            median ${secs(reply.median)}, 9 in 10 within ${secs(reply.p90)} (over ${reply.n} conversations)`);
    console.log(`Customer messages 9pm to 7am:   ${pct(night.night, night.total)} of ${night.total}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
