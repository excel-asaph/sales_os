import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// One-time bootstrap for the Dashboard's login (src/lib/auth.ts). There is
// deliberately no public sign-up page — anyone who could self-register
// would be able to grant themselves admin access to a real business, so
// the first login has to come from a trusted context (this script, run
// locally or via `railway run` / equivalent in production) rather than a
// route anyone can hit.
function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const businessId = getArg("--business-id");
  const businessName = getArg("--business-name");
  const name = getArg("--name");
  const contact = getArg("--contact");
  const password = getArg("--password");
  const asAgent = process.argv.includes("--agent");

  if (!name || !contact || !password || (!businessId && !businessName)) {
    console.error(`Usage:
  Create a new business + its first admin login:
    npm run create-admin -- --business-name "My Business" --name "Jane Doe" --contact jane@example.com --password secret123

  Add another login (admin or agent) to an existing business:
    npm run create-admin -- --business-id <id> --name "John Doe" --contact john@example.com --password secret123 [--agent]
`);
    process.exit(1);
  }

  const resolvedBusinessId =
    businessId ??
    (
      await prisma.business.create({
        data: { name: businessName!, config: { create: {} } },
      })
    ).id;

  const passwordHash = await hashPassword(password);
  const agent = await prisma.humanAgent.create({
    data: { businessId: resolvedBusinessId, name, contact, passwordHash, isAdmin: !asAgent },
  });

  console.log(`Created ${agent.isAdmin ? "admin" : "agent"} login for business ${resolvedBusinessId}`);
  console.log(`  Login: ${contact}`);
  console.log(`  Agent id: ${agent.id}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
