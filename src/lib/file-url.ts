// Google Drive's "share" links (drive.google.com/file/d/<id>/view,
// drive.google.com/open?id=<id>) serve an HTML viewer page when fetched
// without a browser session — which is exactly what happens when WhatsApp's
// Graph API re-hosts a document link (src/lib/whatsapp-send.ts's
// sendWhatsAppDocument fetches `link` server-side once). The customer ends
// up with an HTML page mislabeled as a PDF that never finishes loading,
// instead of the actual file. This rewrites recognized share-link forms to
// Drive's direct-download endpoint, which returns the raw bytes instead.
export function normalizeFileUrl(url: string): string {
  const trimmed = url.trim();
  const fileId =
    trimmed.match(/drive\.google\.com\/file\/d\/([^/?]+)/)?.[1] ??
    trimmed.match(/drive\.google\.com\/open\?[^#]*\bid=([^&]+)/)?.[1] ??
    trimmed.match(/drive\.google\.com\/uc\?[^#]*\bid=([^&]+)/)?.[1];

  if (!fileId) return trimmed;
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
}
