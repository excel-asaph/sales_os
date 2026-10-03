import { ANTFLOW_EMAIL, whatsappLink } from "@/app/(marketing)/site-config";

// The site's one call to action: a WhatsApp chat with Antflow, answered by
// Antflow's own AI (docs/V2_WEBSITE.md, "Use Antflow to sell Antflow").
// Until Antflow's number is set it falls back to email, so the button never
// goes nowhere.
export function WhatsAppButton({ label = "Chat with Antflow on WhatsApp", variant = "coral" }: { label?: string; variant?: "coral" | "ink" }) {
  const href = whatsappLink() ?? (ANTFLOW_EMAIL ? `mailto:${ANTFLOW_EMAIL}` : "/pricing");
  const style =
    variant === "coral"
      ? "bg-(--mk-coral) text-(--mk-ink) hover:brightness-95"
      : "bg-(--mk-ink) text-(--mk-chalk) hover:bg-black";
  return (
    <a
      href={href}
      {...(href.startsWith("https://") ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-base font-bold transition ${style}`}
    >
      {label}
    </a>
  );
}
