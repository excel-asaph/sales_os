import type { Metadata } from "next";
import { ANTFLOW_EMAIL } from "../../site-config";

export const metadata: Metadata = {
  title: "Antflow terms",
  description: "The terms for businesses that use Antflow.",
};

// The terms for businesses using Antflow. Plan details match
// docs/V2_ONBOARDING.md (decided 2026-10-03) and src/lib/workspace-plan.ts.

export default function TermsPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-14 leading-relaxed sm:px-6 [&_h2]:mt-4 [&_h2]:font-(family-name:--font-sora) [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
      <div className="flex flex-col gap-2">
        <h1 className="font-(family-name:--font-sora) text-4xl font-bold tracking-tight">Terms</h1>
        <p className="text-(--mk-muted)">Last updated: 4 October 2026</p>
      </div>

      <p>
        These terms are between Antflow and the business that uses it. Using Antflow means the business accepts them.
      </p>

      <h2>What Antflow does</h2>
      <p>
        Antflow connects to the business&apos;s own WhatsApp number and uses AI to reply to its customers, check payment
        receipts, deliver its digital products and follow up unfinished orders, as the business sets it up. The business
        can see every conversation and take over at any time.
      </p>

      <h2>Plans and payment</h2>
      <ul>
        <li>The plan is ₦300,000 a month. Setup of the WhatsApp connection is included.</li>
        <li>A new business starts free, for 14 days from its first real customer conversation or its first 20 verified sales, whichever comes first.</li>
        <li>When a plan isn&apos;t paid, the AI stops selling and new conversations go to the business&apos;s team instead. Nothing is deleted, and paying switches the AI back on.</li>
        <li>Meta&apos;s own charges for WhatsApp template messages, and advertising, are paid by the business to Meta.</li>
      </ul>

      <h2>The business&apos;s responsibilities</h2>
      <ul>
        <li>Sell only lawful products that it has the right to sell, and describe them honestly.</li>
        <li>Follow WhatsApp&apos;s and Meta&apos;s policies, including their rules on health products: no promises to cure or reverse a condition, and no guaranteed results.</li>
        <li>Message only people who have contacted it or agreed to hear from it, and respect anyone who asks it to stop.</li>
        <li>Keep its logins and its Meta account secure, and check the scripts, answers and product descriptions it gives the AI.</li>
      </ul>

      <h2>The AI</h2>
      <p>
        The AI works from the business&apos;s own scripts, answers and products, and hands conversations to the business
        when it is not sure. It can still make mistakes, so the business remains responsible for what is sold and said in
        its name, and should keep an eye on its conversations. The AI never confirms a payment by itself, but no receipt
        check is perfect: the business confirms anything it is unsure about.
      </p>

      <h2>Information</h2>
      <p>
        The business owns its information and its customers&apos; information. Antflow handles it only to provide the
        service, as described in the <a className="font-semibold text-(--mk-coral-text) underline" href="/legal/privacy">privacy policy</a>.
      </p>

      <h2>Suspension and leaving</h2>
      <ul>
        <li>We may suspend a business that breaks these terms or Meta&apos;s policies, or doesn&apos;t pay, and will say why.</li>
        <li>A business can stop at any time. Its WhatsApp number stays in its own Meta account. Its information is deleted on request.</li>
      </ul>

      <h2>Limits</h2>
      <p>
        Antflow is provided as it is. We work to keep it running and accurate, but we don&apos;t promise any level of
        sales, and we are not responsible for outages or decisions by WhatsApp or Meta. As far as the law allows, our
        responsibility to a business is limited to what it paid us in the three months before the problem.
      </p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms, and will tell businesses about important changes before they apply. These terms are
        governed by the laws of the Federal Republic of Nigeria.
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
