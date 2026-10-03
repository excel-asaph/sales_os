import Link from "next/link";
import { Sora, Manrope } from "next/font/google";
import { AntflowLogo } from "@/components/marketing/logo";
import { WhatsAppButton } from "@/components/marketing/whatsapp-button";
import { ANTFLOW_EMAIL, RESULTS } from "./site-config";

// The public website (docs/V2_WEBSITE.md), in brand direction B "Colony":
// ink and coral on chalk, Sora headings and Manrope text. Its colours and
// fonts are scoped to this layout, so the app's own look is untouched.

const sora = Sora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-sora" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope" });

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  ...(RESULTS ? [{ href: "/results", label: "Results" }] : []),
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${sora.variable} ${manrope.variable} min-h-svh bg-(--mk-chalk) font-(family-name:--font-manrope) text-(--mk-ink)`}
      style={
        {
          "--mk-ink": "#121614",
          "--mk-coral": "#FF6A4D",
          "--mk-coral-text": "#C2381F",
          "--mk-chalk": "#F5F6F4",
          "--mk-blush": "#FFE5DE",
          "--mk-muted": "#4A524E",
          "--mk-line": "#DDE1DE",
        } as React.CSSProperties
      }
    >
      <header className="border-b border-(--mk-line)">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Antflow home">
            <AntflowLogo size={30} />
          </Link>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-(--mk-muted) hover:text-(--mk-ink)">
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="text-(--mk-muted) hover:text-(--mk-ink)">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-24 border-t border-(--mk-line)">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <AntflowLogo size={26} />
            <p className="text-sm text-(--mk-muted)">
              A WhatsApp sales rep for ebook and digital product sellers. Works with WhatsApp; not affiliated with
              WhatsApp or Meta.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <WhatsAppButton variant="ink" />
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-(--mk-muted)">
              <Link href="/legal/privacy" className="hover:text-(--mk-ink)">
                Privacy policy
              </Link>
              <Link href="/legal/terms" className="hover:text-(--mk-ink)">
                Terms
              </Link>
              {ANTFLOW_EMAIL && (
                <a href={`mailto:${ANTFLOW_EMAIL}`} className="hover:text-(--mk-ink)">
                  {ANTFLOW_EMAIL}
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
