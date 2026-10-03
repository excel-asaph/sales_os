// Everything on the public website (docs/V2_WEBSITE.md) that isn't copy:
// contact details and the real figures for the results section. Contact
// details come from the environment so they can be set on Railway without a
// code change.

/** Antflow's own WhatsApp number, digits only with country code (e.g. 2348012345678). Its chat is answered by Antflow's own AI. */
export const ANTFLOW_WHATSAPP = process.env.NEXT_PUBLIC_ANTFLOW_WHATSAPP?.replace(/\D/g, "") || null;
export const ANTFLOW_EMAIL = process.env.NEXT_PUBLIC_ANTFLOW_EMAIL || null;
/** For later: the Meta Pixel on the WhatsApp button, so the site can be advertised. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || null;

/** What a visitor's WhatsApp opens with, so Antflow's AI knows where they came from. */
export const WHATSAPP_OPENING = "Hi Antflow, I sell ebooks on WhatsApp and I'd like to know more.";

export function whatsappLink(): string | null {
  return ANTFLOW_WHATSAPP ? `https://wa.me/${ANTFLOW_WHATSAPP}?text=${encodeURIComponent(WHATSAPP_OPENING)}` : null;
}

/**
 * VitalFix's real figures, from scripts/site-stats.ts run against
 * production. Only real numbers ever go here (docs/V2_WEBSITE.md); while
 * this is null, the results section and page don't show at all.
 */
export const RESULTS: null | {
  /** e.g. "August 2026" */
  since: string;
  conversations: number;
  verifiedSales: number;
  /** Share of verified sales that came after at least one follow-up, 0–100. */
  salesAfterFollowupPct: number;
  /** Median seconds to the first reply. */
  medianFirstReplySeconds: number;
  /** Share of customer messages sent between 9pm and 7am, 0–100. */
  nightMessagesPct: number;
} = null;
