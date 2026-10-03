import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhatsAppButton } from "@/components/marketing/whatsapp-button";
import { RESULTS } from "../site-config";

export const metadata: Metadata = {
  title: "Antflow results",
  description: "Real figures from VitalFix, a Nigerian health ebook seller on Antflow.",
};

// VitalFix's real figures (owner's permission, docs/V2_REVAMP.md). Shown
// only once they're filled in from production (site-config.ts): there is no
// version of this page with made-up numbers.
export default function ResultsPage() {
  if (!RESULTS) notFound();
  const r = RESULTS;
  const items = [
    { value: r.conversations.toLocaleString("en-NG"), label: "conversations handled" },
    { value: r.verifiedSales.toLocaleString("en-NG"), label: "payments checked and books delivered" },
    { value: `${r.salesAfterFollowupPct}%`, label: "of sales came after a follow-up" },
    {
      value: r.medianFirstReplySeconds < 60 ? `${r.medianFirstReplySeconds} seconds` : `${Math.round(r.medianFirstReplySeconds / 60)} minutes`,
      label: "typical time to the first reply",
    },
    { value: `${r.nightMessagesPct}%`, label: "of customer messages sent between 9pm and 7am" },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 pt-14 sm:px-6">
      <div className="flex flex-col gap-4">
        <h1 className="font-(family-name:--font-sora) text-4xl font-bold tracking-tight sm:text-5xl">Results</h1>
        <p className="text-lg leading-relaxed text-(--mk-muted)">
          VitalFix sells health ebooks to Nigerian customers on WhatsApp, and has used Antflow since {r.since}. These are
          its real figures, counted from its own records.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-3xl border border-(--mk-line) bg-white p-6">
            <div className="font-(family-name:--font-sora) text-4xl font-bold">{item.value}</div>
            <div className="mt-1 text-(--mk-muted)">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-(--mk-blush) p-8">
        <h2 className="font-(family-name:--font-sora) text-2xl font-semibold">Want this for your ebook?</h2>
        <WhatsAppButton />
      </div>
    </div>
  );
}
