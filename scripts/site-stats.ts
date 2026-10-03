import "dotenv/config";
import { prisma } from "@/lib/prisma";

// Read-only totals for the public website's results section
// (docs/V2_WEBSITE.md: "only real numbers"). Prints counts and medians and
// nothing about any customer: no names, numbers or messages. Run against
// production the same way as create-admin, via `railway run`:
//
//   railway run npx tsx scripts/site-stats.ts                  every business
//   railway run npx tsx scripts/site-stats.ts --business-id <id>
//
// Test-chat customers are always left out.

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const businessId = getArg("--business-id");
  const customer = { isTest: false, ...(businessId ? { businessId } : {}) };
  const businessFilter = businessId ?? null;

  const [first, conversations, verified, revenue, afterFollowup, firstReply, night] = await Promise.all([
    prisma.conversation.findFirst({ where: { customer }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.conversation.count({ where: { customer } }),
    prisma.order.count({ where: { status: "VERIFIED", conversation: { customer } } }),
    prisma.order.aggregate({ where: { status: "VERIFIED", conversation: { customer } }, _sum: { expectedAmount: true } }),
    // Verified sales where at least one follow-up had been sent before the
    // payment was verified: sales the follow-ups plausibly recovered.
    prisma.$queryRaw<[{ n: bigint }]>`
      SELECT COUNT(*) AS n FROM orders o
      JOIN conversations v ON v.id = o.conversation_id
      JOIN customers c ON c.id = v.customer_id
      WHERE o.status = 'VERIFIED' AND NOT c.is_test
        AND (${businessFilter}::text IS NULL OR c.business_id = ${businessFilter})
        AND EXISTS (SELECT 1 FROM events e WHERE e.conversation_id = v.id AND e.type = 'FOLLOWUP_SENT' AND e.created_at < o.verified_at)`,
    // Median seconds from a conversation's first customer message to the
    // first reply, AI or human.
    prisma.$queryRaw<[{ median: number | null; n: bigint }]>`
      WITH firsts AS (
        SELECT v.id,
          MIN(m.created_at) FILTER (WHERE m.direction = 'INBOUND') AS first_in,
          MIN(m.created_at) FILTER (WHERE m.direction = 'OUTBOUND') AS first_out
        FROM conversations v JOIN customers c ON c.id = v.customer_id JOIN messages m ON m.conversation_id = v.id
        WHERE NOT c.is_test AND (${businessFilter}::text IS NULL OR c.business_id = ${businessFilter})
        GROUP BY v.id)
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM first_out - first_in)) AS median, COUNT(*) AS n
      FROM firsts WHERE first_in IS NOT NULL AND first_out > first_in`,
    // Customer messages that arrived between 9pm and 7am, Lagos time.
    prisma.$queryRaw<[{ night: bigint; total: bigint }]>`
      SELECT COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Lagos') >= 21
                               OR EXTRACT(HOUR FROM m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Lagos') < 7) AS night,
             COUNT(*) AS total
      FROM messages m JOIN conversations v ON v.id = m.conversation_id JOIN customers c ON c.id = v.customer_id
      WHERE m.direction = 'INBOUND' AND NOT c.is_test AND (${businessFilter}::text IS NULL OR c.business_id = ${businessFilter})`,
  ]);

  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "n/a");
  const sales = Number(verified);
  const recovered = Number(afterFollowup[0].n);
  console.log(`Since:                          ${first?.createdAt.toISOString().slice(0, 10) ?? "no conversations"}`);
  console.log(`Conversations handled:          ${conversations}`);
  console.log(`Verified sales:                 ${sales}`);
  console.log(`Revenue from verified sales:    NGN ${Number(revenue._sum.expectedAmount ?? 0).toLocaleString("en-NG")}`);
  console.log(`Sales after a follow-up:        ${recovered} (${pct(recovered, sales)} of verified sales)`);
  console.log(`Median time to first reply:     ${firstReply[0].median === null ? "n/a" : `${Math.round(firstReply[0].median)} seconds`} (over ${firstReply[0].n} conversations)`);
  console.log(`Customer messages 9pm to 7am:   ${pct(Number(night[0].night), Number(night[0].total))} of ${night[0].total}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
