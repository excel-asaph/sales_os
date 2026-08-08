import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// One-time backfill: conversations created before the multi-number
// migration (Business.whatsappPhoneNumberId / ingest-message.ts stamping)
// have Conversation.whatsappPhoneNumberId = null. The per-branch filter on
// Dashboard/Customers/Home defaults to the business's primary number (not
// "All numbers"), and `{ whatsappPhoneNumberId: effectiveNumber }` doesn't
// match null — so these conversations silently disappear from the default
// view. Every conversation that predates multi-number support belongs to
// what was, at the time, the only number: the business's current primary.
async function main() {
  const businesses = await prisma.business.findMany({
    select: { id: true, whatsappPhoneNumberId: true },
  });

  for (const business of businesses) {
    if (!business.whatsappPhoneNumberId) continue;
    const result = await prisma.conversation.updateMany({
      where: { customer: { businessId: business.id }, whatsappPhoneNumberId: null },
      data: { whatsappPhoneNumberId: business.whatsappPhoneNumberId },
    });
    console.log(`Business ${business.id}: backfilled ${result.count} conversation(s)`);
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
