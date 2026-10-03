import "dotenv/config";
import { prisma } from "@/lib/prisma";

// Grants or removes Antflow staff access (User.isPlatformAdmin), which
// lets someone open any business on the platform from /admin. Deliberately
// not something the app itself can change: like create-admin, it has to
// come from someone with database access.
//
//   npm run platform-admin -- --email you@example.com           grant
//   npm run platform-admin -- --email you@example.com --revoke  remove
//   npm run platform-admin -- --list                            who has it
//
// The person must already have a login (a User row).

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  if (process.argv.includes("--list")) {
    const staff = await prisma.user.findMany({ where: { isPlatformAdmin: true }, select: { email: true, name: true } });
    console.log(staff.length ? staff.map((u) => `${u.name} <${u.email}>`).join("\n") : "No one has staff access.");
    return;
  }

  const email = getArg("--email")?.toLowerCase();
  if (!email) {
    console.error("Usage: npm run platform-admin -- --email you@example.com [--revoke] | --list");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No login for ${email}. Create one first (npm run create-admin) or run the v2 backfill.`);
    process.exit(1);
  }

  const grant = !process.argv.includes("--revoke");
  await prisma.user.update({ where: { id: user.id }, data: { isPlatformAdmin: grant } });
  console.log(grant ? `${email} now has Antflow staff access.` : `${email} no longer has Antflow staff access.`);
  if (!grant) {
    // Their support memberships stay for the record (events point at them)
    // but are switched off, so nothing they opened stays open to them.
    const { count } = await prisma.humanAgent.updateMany({ where: { userId: user.id, support: true }, data: { active: false } });
    if (count) console.log(`Closed ${count} support membership(s).`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
