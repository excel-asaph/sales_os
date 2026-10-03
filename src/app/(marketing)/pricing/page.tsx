import type { Metadata } from "next";
import { WhatsAppButton } from "@/components/marketing/whatsapp-button";

export const metadata: Metadata = {
  title: "Antflow pricing",
  description: "₦300,000 a month, with WhatsApp setup done with you, and a free start.",
};

// docs/V2_REVAMP.md (price) and docs/V2_ONBOARDING.md (free plan, decided
// 2026-10-03). Lists only what exists today.

const INCLUDED = [
  "WhatsApp setup with you on a call, through your own Meta account",
  "The AI sales rep on your number, day and night",
  "Payment receipts checked: amount, account and signs of editing",
  "Books delivered on WhatsApp as soon as payment is confirmed",
  "Follow-ups for customers who go quiet, which you can adjust or switch off",
  "As many ebooks as you sell, each with its own description, answers and pitch",
  "Your dashboard: every conversation, sales and which ads bring customers",
  "Logins for your team",
  "A test chat to try your AI before customers see it",
];

const NOT_INCLUDED = ["Meta's own charges for template messages, billed by Meta to your account", "Your advertising spend"];

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 pt-14 sm:px-6">
      <div className="flex flex-col gap-4">
        <h1 className="font-(family-name:--font-sora) text-4xl font-bold tracking-tight sm:text-5xl">₦300,000 a month</h1>
        <p className="text-lg leading-relaxed text-(--mk-muted)">
          One plan with everything in it. It starts free: once your WhatsApp is connected, you get 14 days or your first
          20 sales, whichever comes first, before you pay anything. The 14 days start from your first real customer, not
          from sign-up.
        </p>
      </div>
      <section className="rounded-3xl border border-(--mk-line) bg-white p-8">
        <h2 className="font-(family-name:--font-sora) text-xl font-semibold">Included</h2>
        <ul className="mt-5 flex flex-col gap-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-3 leading-relaxed">
              <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-(--mk-coral)" />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-(family-name:--font-sora) text-xl font-semibold">Paid separately, to Meta</h2>
        <ul className="mt-4 flex flex-col gap-2 text-(--mk-muted)">
          {NOT_INCLUDED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-(family-name:--font-sora) text-xl font-semibold">If you stop paying</h2>
        <p className="leading-relaxed text-(--mk-muted)">
          The AI stops selling, but no customer is left without a reply: new messages go to your team in the dashboard.
          Nothing is deleted, and paying switches the AI straight back on.
        </p>
      </section>
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-(--mk-blush) p-8">
        <h2 className="font-(family-name:--font-sora) text-2xl font-semibold">Talk to us first</h2>
        <p className="leading-relaxed text-(--mk-muted)">
          Ask anything on WhatsApp. You&apos;ll be talking to Antflow&apos;s own AI, which is the best demo we can give
          you.
        </p>
        <WhatsAppButton />
      </div>
    </div>
  );
}
