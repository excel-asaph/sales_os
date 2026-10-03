import type { Metadata } from "next";
import { ANTFLOW_EMAIL } from "../../site-config";

export const metadata: Metadata = {
  title: "Antflow privacy policy",
  description: "How Antflow handles information for the businesses that use it and their customers.",
};

// Antflow's own privacy policy, and the policy each client business's Meta
// App can point to (docs/V2_WEBSITE.md). VitalFix's own policy stays at
// /privacy, where its Meta App already points. Describes the system as it
// is built: change it when what the system does changes.

export default function AntflowPrivacyPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-14 leading-relaxed sm:px-6 [&_h2]:mt-4 [&_h2]:font-(family-name:--font-sora) [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
      <div className="flex flex-col gap-2">
        <h1 className="font-(family-name:--font-sora) text-4xl font-bold tracking-tight">Privacy policy</h1>
        <p className="text-(--mk-muted)">Last updated: 4 October 2026</p>
      </div>

      <p>
        Antflow is software that helps businesses sell on WhatsApp. This policy explains what information Antflow
        handles, for the businesses that use it and for the people who message those businesses, and what we do with
        it.
      </p>

      <h2>Two kinds of people, two roles</h2>
      <ul>
        <li>
          <strong>Businesses that use Antflow</strong> (and their team members): we decide how your account information
          is used, so for that information we are responsible for it.
        </li>
        <li>
          <strong>Customers who message a business</strong> through WhatsApp: the business decides why your messages are
          collected and what they are used for, and Antflow handles them on the business&apos;s behalf. Questions or
          requests about your messages are best sent to the business first; we will help them answer.
        </li>
      </ul>

      <h2>What we handle</h2>
      <ul>
        <li>For businesses: names and email addresses of the people who log in, the business&apos;s products, scripts and settings, its bank account details for receiving payment, and the WhatsApp connection details it gives us.</li>
        <li>For customers of a business: WhatsApp phone number and profile name, the messages exchanged with the business (including payment receipts and other images or documents), orders and payments, and, if they came from a Facebook or Instagram ad, which ad that was.</li>
      </ul>

      <h2>What it is used for</h2>
      <ul>
        <li>To reply to customers for the business, check payment receipts, deliver products and follow up on unfinished orders, as the business has set up.</li>
        <li>To show the business its conversations, sales and results.</li>
        <li>Where the business turns it on, to tell Meta that a sale came from one of its ads, so its ads can find buyers.</li>
        <li>To keep the service working and secure, and to support businesses when they ask for help.</li>
      </ul>
      <p>We do not sell anyone&apos;s information, and we do not use one business&apos;s customers for any other business.</p>

      <h2>Who else is involved</h2>
      <ul>
        <li>Meta (WhatsApp), which carries the messages between the business and its customers.</li>
        <li>Anthropic, whose AI writes replies and reads payment receipts. It receives the parts of a conversation needed to do that.</li>
        <li>Railway, which hosts the service and its database, and Cloudflare, which stores files such as receipts and products.</li>
      </ul>

      <h2>How it is protected</h2>
      <ul>
        <li>Each business&apos;s information is kept separate, and only its own team can see it.</li>
        <li>WhatsApp access details and secrets are stored encrypted.</li>
        <li>When Antflow staff open a business&apos;s account to help with setup or support, every visit is recorded and shown to that business.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        For as long as the business uses Antflow and needs its records, such as orders and payments. When a business
        leaves, its information is deleted on request, apart from anything the law requires us to keep.
      </p>

      <h2>Your rights</h2>
      <p>
        Under Nigeria&apos;s data protection law you can ask what information is held about you, ask for it to be
        corrected or deleted, and object to how it is used. Customers can also reply &quot;stop&quot; in a chat to stop
        follow-up messages from that business.
      </p>

      <h2>Contact</h2>
      <p>
        {ANTFLOW_EMAIL ? (
          <>
            Email <a className="font-semibold text-(--mk-coral-text) underline" href={`mailto:${ANTFLOW_EMAIL}`}>{ANTFLOW_EMAIL}</a>.
          </>
        ) : (
          "Message us on WhatsApp from the button on this site."
        )}
      </p>
    </article>
  );
}
