import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppButton } from "@/components/marketing/whatsapp-button";
import { RESULTS } from "./site-config";

// The home page (docs/V2_WEBSITE.md, "The home page, top to bottom"). Copy
// rules: only real numbers, no "WhatsApp partner" claims, plain Nigerian
// English (docs/BOOK_VOICE.md). Every answer here describes what the
// product does today.

export const metadata: Metadata = {
  title: "Antflow: a WhatsApp sales rep for your ebook",
  description:
    "Antflow replies to your WhatsApp customers in seconds, checks payment receipts, sends the book and follows up, day and night.",
};

const PROBLEMS = [
  {
    title: "The DMs you miss at night",
    body: "Your ad runs all day, so people message at 11pm and 6am. By the time you reply, some of them have moved on.",
  },
  {
    title: "Receipts, one by one",
    body: "Every \"I've paid\" means opening your bank app to check the amount, the account and whether the screenshot is real.",
  },
  {
    title: "\"I'll pay tomorrow\"",
    body: "Then silence. Following up every quiet customer by hand is the job that never gets done.",
  },
];

const STEPS = [
  { title: "Your ad brings them", body: "A customer taps your Click-to-WhatsApp ad, your Status link or your bio, and messages your business number." },
  { title: "The AI sells", body: "It answers in your voice, using your own sales scripts and the answers you wrote, and it knows what's inside your book." },
  { title: "The receipt is checked", body: "It reads the transfer screenshot: the amount, the account it went to, and any sign it was edited." },
  { title: "The book is delivered", body: "The file goes out on WhatsApp straight away. People who go quiet get a polite follow-up on their own." },
];

const CONTROLS = [
  "See every conversation, live, and take over any chat. The AI steps back while you talk.",
  "Write the sales scripts the AI uses for your pitch, payment details and thank-you messages.",
  "Pause follow-ups, or change how many are sent, for the whole business or one product.",
  "Try your AI in a test chat before any real customer sees it.",
];

const QUESTIONS = [
  {
    q: "Is my number safe?",
    a: "Your number stays in your own Meta business account, connected through your own Meta App, and we never become admins on it. If you stop using Antflow, the number is still yours. One thing to know: while it's connected, the number can't also be used in the normal WhatsApp Business app, so most sellers use a number just for sales.",
  },
  {
    q: "What does Meta charge?",
    a: "Replying to customers within 24 hours of their last message doesn't cost anything on Meta's side. Meta charges for template messages, which is what a follow-up has to be once those 24 hours have passed, at Meta's own rates, billed to your Meta account. Your ads are separate, paid to Meta as usual.",
  },
  {
    q: "Can I take over a chat?",
    a: "Yes, any chat, any time, from your dashboard. The AI pauses on that conversation while you're in it, and conversations it isn't sure about are handed to you automatically.",
  },
  {
    q: "What if the AI gets something wrong?",
    a: "It works from your scripts and your answers, and it hands the chat to you when it isn't confident, or when there's a complaint or refund request. It never confirms a payment by itself: every receipt goes through the platform's check. You can read every message it sends.",
  },
  {
    q: "What if a customer sends a fake receipt?",
    a: "Each receipt is checked for the amount, the account it was paid into, and signs that the screenshot was edited. If anything doesn't add up, the AI doesn't send the book: either it asks the customer to resend, or the chat comes to you to check.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24">
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div className="flex flex-col gap-7">
          <span className="self-start rounded-full border border-(--mk-line) bg-white px-3.5 py-1.5 text-sm font-semibold text-(--mk-muted)">
            For ebook and digital product sellers
          </span>
          <h1 className="font-(family-name:--font-sora) text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-[3.5rem]">
            A WhatsApp sales rep for your ebook, working day and night.
          </h1>
          <p className="text-lg leading-relaxed text-(--mk-muted) sm:text-xl">
            It replies in seconds, checks the payment receipt, sends the book and follows up the people who go quiet.
            You see every chat, and you can step in any time.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <WhatsAppButton />
            <span className="text-(--mk-muted)">₦300,000 a month, setup included</span>
          </div>
        </div>
        <ChatSample />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight">Sound familiar?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="rounded-3xl border border-(--mk-line) bg-white p-6">
              <h3 className="font-(family-name:--font-sora) text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-(--mk-muted)">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight">How it works</h2>
          <Link href="/how-it-works" className="font-semibold text-(--mk-coral-text) hover:underline">
            The full walk-through
          </Link>
        </div>
        <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 rounded-3xl bg-white p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-(--mk-coral) font-bold">{i + 1}</span>
              <h3 className="font-(family-name:--font-sora) text-lg font-semibold">{s.title}</h3>
              <p className="leading-relaxed text-(--mk-muted)">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {RESULTS && (
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl bg-(--mk-ink) p-8 text-(--mk-chalk) sm:p-10">
            <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight">Real numbers from a real seller</h2>
            <p className="mt-2 text-(--mk-line)">VitalFix, a Nigerian health ebook seller, on Antflow since {RESULTS.since}.</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <Stat value={RESULTS.conversations.toLocaleString("en-NG")} label="conversations handled" />
              <Stat value={RESULTS.verifiedSales.toLocaleString("en-NG")} label="payments checked and books delivered" />
              <Stat value={`${RESULTS.nightMessagesPct}%`} label="of customer messages sent between 9pm and 7am" />
            </div>
            <Link href="/results" className="mt-8 inline-block font-semibold text-(--mk-coral) hover:underline">
              See the full results
            </Link>
          </div>
        </section>
      )}

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight">You stay in charge</h2>
          <p className="mt-3 text-lg leading-relaxed text-(--mk-muted)">
            The AI does the repetitive work. You decide how it sells, and you can see and change everything.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {CONTROLS.map((c) => (
            <li key={c} className="flex gap-3 rounded-2xl border border-(--mk-line) bg-white p-4 leading-relaxed">
              <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-(--mk-coral)" />
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 rounded-3xl bg-(--mk-blush) p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight">₦300,000 a month</h2>
            <p className="max-w-xl text-lg leading-relaxed text-(--mk-muted)">
              Setup included: we connect your WhatsApp with you on a call. Then a free start, for 14 days or your first
              20 sales, whichever comes first.
            </p>
          </div>
          <Link href="/pricing" className="font-semibold text-(--mk-coral-text) hover:underline">
            What&apos;s included
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight">Questions sellers ask</h2>
        <div className="mt-8 flex flex-col gap-3">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-(--mk-line) bg-white p-5">
              <summary className="cursor-pointer list-none font-(family-name:--font-sora) text-lg font-semibold">
                {item.q}
              </summary>
              <p className="mt-3 leading-relaxed text-(--mk-muted)">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 text-center sm:px-6">
        <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight sm:text-4xl">
          See it work before you pay for it.
        </h2>
        <p className="text-lg text-(--mk-muted)">
          The chat button is answered by Antflow&apos;s own AI, the same one your customers would talk to.
        </p>
        <WhatsAppButton />
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-(family-name:--font-sora) text-4xl font-bold text-(--mk-coral)">{value}</span>
      <span className="text-(--mk-line)">{label}</span>
    </div>
  );
}

/** A sample conversation, not a screenshot: the real book and price, written as the AI writes. */
function ChatSample() {
  return (
    <div className="flex flex-col gap-3.5 rounded-3xl border border-(--mk-line) bg-white p-6" aria-label="A sample conversation">
      <div className="flex justify-between text-sm text-(--mk-muted)">
        <span className="font-semibold text-(--mk-ink)">Ada · new customer</span>
        <span>11:42 pm</span>
      </div>
      <p className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-(--mk-chalk) px-4 py-3">Good evening. How much is the BP book?</p>
      <p className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-(--mk-ink) px-4 py-3 leading-relaxed text-(--mk-chalk)">
        Good evening! Pressure Down is ₦10,000. It explains your BP numbers in plain words and gives a 10-day meal plan
        with food from your own market. Would you like a copy?
      </p>
      <p className="self-start rounded-2xl rounded-bl-sm bg-(--mk-chalk) px-4 py-3">I&apos;ve paid. Here is the receipt.</p>
      <p className="rounded-xl bg-(--mk-blush) px-4 py-2.5 text-sm font-semibold">
        Receipt checked: ₦10,000 into your account. Book sent.
      </p>
    </div>
  );
}
