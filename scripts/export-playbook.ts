import "dotenv/config";
import { prisma } from "@/lib/prisma";

// Prints a business's playbook scripts, read-only, for copying a proven
// business's wording into the Ebook seller starter template
// (src/lib/starter-scripts.ts). Payment scripts are left out: they hold
// that business's bank details, and the template builds its own from each
// new business's accounts.
//
//   npm run export-playbook                      list businesses
//   npm run export-playbook -- --business-id <id>
//
// Against production, run it the same way as create-admin: with the
// production DATABASE_URL, or via `railway run`.

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const businessId = getArg("--business-id");
  if (!businessId) {
    const businesses = await prisma.business.findMany({ select: { id: true, name: true } });
    for (const b of businesses) console.log(`${b.id}  ${b.name}`);
    return;
  }
  const config = await prisma.businessConfig.findUnique({ where: { businessId } });
  const playbook = (config?.playbook as Record<string, string> | null) ?? {};
  const shareable = Object.fromEntries(Object.entries(playbook).filter(([key]) => !key.startsWith("payment_instructions")));
  console.log(JSON.stringify(shareable, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
