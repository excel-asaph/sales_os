export interface BusinessNumber {
  id: string;
  label: string;
}

interface BusinessNumberSource {
  whatsappPhoneNumberId: string | null;
  additionalWhatsappPhoneNumberIds: string[];
  whatsappPhoneNumberLabels: unknown;
}

// Every registered WhatsApp number for a business, primary first, with a
// human-readable label (Business.whatsappPhoneNumberLabels maps Meta's
// opaque phone_number_id to the actual number) — falls back to the raw id
// if a label was never set for it.
export function getBusinessNumbers(business: BusinessNumberSource): BusinessNumber[] {
  const labels = (business.whatsappPhoneNumberLabels as Record<string, string> | null) ?? {};
  const ids = [
    ...(business.whatsappPhoneNumberId ? [business.whatsappPhoneNumberId] : []),
    ...business.additionalWhatsappPhoneNumberIds,
  ];
  return ids.map((id) => ({ id, label: labels[id] ?? id }));
}
