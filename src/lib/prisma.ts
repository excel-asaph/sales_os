import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Standard Next.js dev-mode singleton: without this, hot-reload would
// create a new PrismaClient (and a new DB connection pool) on every
// edit, eventually exhausting Postgres connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
