import type { Metadata } from "next";
import { WhatsAppButton } from "@/components/marketing/whatsapp-button";

export const metadata: Metadata = {
  title: "How Antflow works",
  description: "From the first WhatsApp message to the book delivered and the quiet customers followed up.",
};

// The full flow (docs/V2_WEBSITE.md). Describes only what the product does
// today; screenshots can replace the descriptions once there are real ones.

const STAGES = [
  {
    title: "1. Setting up, with us",
    points: [
      "On a setup call we connect your WhatsApp number through your own Meta business account. The number stays yours.",
      "You add your ebook. Antflow reads it, then drafts a description, the questions customers are likely to ask with answers from the book, and a pitch. You edit and approve every word.",
      "You add the bank account customers pay into, and load the starter sales scripts, already filled in with your details.",
      "You chat with your own AI in a test chat, as a customer would, before anyone real does.",
    ],
  },
  {
    title: "2. A customer messages you",
    points: [
      "They come from your Click-to-WhatsApp ad, your Status, your bio or a link. If you sell several books on one number, Antflow works out which one they came for from the ad or the link they used, or asks them.",
      "The AI replies in seconds, day and night, in your voice and with your scripts.",
      "Questions about the book are answered from your approved answers and the book itself. Anything it isn't sure about comes to you.",
    ],
  },
  {
    title: "3. They pay",
    points: [
      "The AI sends your account details using your own payment script.",
      "When the customer sends the receipt, it's checked: the amount, the account it went into, and signs the screenshot was edited.",
      "A clean receipt means the book goes out straight away. Anything doubtful goes to you to check, and the AI never confirms a payment by itself.",
    ],
  },
  {
    title: "4. The ones who go quiet",
    points: [
      "Someone who stops replying gets a short, polite follow-up later, then a few more spread over the next days. You choose how many, or switch them off.",
      "A customer who says stop is never messaged again.",
    ],
  },
  {
    title: "5. You see everything",
    points: [
      "Every conversation is in your dashboard, live. You can take over any chat and the AI steps back.",
      "Sales, revenue and which ads brought customers are on your home page, and the sales an ad made can be reported back to Meta to help your ads find buyers.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 pt-14 sm:px-6">
      <div className="flex flex-col gap-4">
        <h1 className="font-(family-name:--font-sora) text-4xl font-bold tracking-tight sm:text-5xl">How it works</h1>
        <p className="text-lg leading-relaxed text-(--mk-muted)">
          From the first message to the book delivered, and what happens to the people who don&apos;t pay straight away.
        </p>
      </div>
      {STAGES.map((stage) => (
        <section key={stage.title} className="flex flex-col gap-4">
          <h2 className="font-(family-name:--font-sora) text-2xl font-semibold">{stage.title}</h2>
          <ul className="flex flex-col gap-3">
            {stage.points.map((point) => (
              <li key={point} className="flex gap-3 leading-relaxed">
                <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-(--mk-coral)" />
                {point}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-white p-8">
        <h2 className="font-(family-name:--font-sora) text-2xl font-semibold">Try it on yourself</h2>
        <p className="leading-relaxed text-(--mk-muted)">The button opens a chat answered by Antflow&apos;s own AI.</p>
        <WhatsAppButton />
      </div>
    </div>
  );
}
