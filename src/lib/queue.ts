import PgBoss from "pg-boss";

export const FOLLOWUP_QUEUE = "run-followup";

export interface FollowupJobData {
  followupId: string;
}

declare global {
  var pgBossReady: Promise<PgBoss> | undefined;
}

/**
 * One pg-boss instance per process (web or worker), cached across Next.js
 * dev hot-reloads the same way src/lib/prisma.ts caches its client.
 * pg-boss v10 requires a queue to be created once before it's used —
 * `createQueue` is idempotent, so doing it here on first access is safe to
 * call from both the sender (web process) and the consumer (worker).
 */
export function getBoss(): Promise<PgBoss> {
  if (!global.pgBossReady) {
    global.pgBossReady = (async () => {
      const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
      await boss.start();
      await boss.createQueue(FOLLOWUP_QUEUE);
      return boss;
    })();
  }
  return global.pgBossReady;
}
