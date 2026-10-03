import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/viewer";
import { decryptSecret } from "@/lib/credential-crypto";
import { AppShell } from "@/components/app-shell";
import { ConnectWizard, type WizardStepKey } from "./connect-wizard";

// The WhatsApp connection wizard (v2): the business's own Meta App,
// connected by copying two things (actions.ts beside this). Which step
// shows is worked out from what's saved, so the owner can leave and come
// back to the same place.
export default async function ConnectWizardPage() {
  const session = await requireAdminPage();
  const [draft, connection, channels] = await Promise.all([
    prisma.metaConnectionDraft.findUnique({ where: { businessId: session.businessId } }),
    prisma.businessMetaConnection.findUnique({ where: { businessId: session.businessId } }),
    prisma.channel.findMany({ where: { businessId: session.businessId, status: "ACTIVE" }, orderBy: { createdAt: "asc" } }),
  ]);

  const ownApp = Boolean(connection?.webhookKey && connection.metaAppId);
  const step: WizardStepKey = draft
    ? draft.encryptedAppSecret
      ? "number"
      : "secret"
    : !ownApp
      ? "token"
      : !connection!.webhookVerifiedAt
        ? "webhook"
        : !connection!.lastWebhookAt
          ? "test"
          : "done";

  // The address Meta will call: this app's public address, as the browser
  // reached it (Railway sets the forwarded headers to the real domain).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const origin = `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;

  return (
    <AppShell active="settings" title="Connect WhatsApp" description="Your own Meta App, connected step by step">
      <ConnectWizard
        step={step}
        appId={draft?.metaAppId ?? connection?.metaAppId ?? null}
        webhookUrl={connection?.webhookKey ? `${origin}/api/whatsapp/${connection.webhookKey}` : null}
        verifyToken={connection?.encryptedWebhookVerifyToken ? decryptSecret(connection.encryptedWebhookVerifyToken) : null}
        localAddress={/^(localhost|127\.)/.test(host)}
        connectedNumbers={channels.map((c) => c.label ?? c.displayNumber ?? c.phoneNumberId)}
      />
    </AppShell>
  );
}
