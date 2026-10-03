// Meta Graph API calls for the WhatsApp connection wizard
// (/settings/whatsapp/connect). Each business brings its own Meta App
// (docs/V2_REVAMP.md); from the two things its owner copies, a permanent
// access token and the app secret, these find everything else.
//
// What can't be done here: Meta only lets a WhatsApp webhook address be
// set in the app's own dashboard ("WhatsApp webhooks must be configured in
// the App Space", Graph API app/subscriptions reference), so the owner
// pastes that in by hand, and the webhook route records when Meta verifies
// it (src/app/api/whatsapp/[key]/route.ts).

const GRAPH_API_VERSION = "v21.0";

/** Overridable only to test against a stand-in server; real Meta otherwise. */
function graphBase(): string {
  return `${(process.env.META_GRAPH_BASE_URL ?? "https://graph.facebook.com").replace(/\/$/, "")}/${GRAPH_API_VERSION}`;
}

/** Something the owner needs to fix, in words they can act on. */
export class MetaSetupError extends Error {}
/** Meta itself refused a call; may just mean "not with this kind of token". */
export class GraphError extends MetaSetupError {}

async function graph<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(`${graphBase()}${path}`, {
      ...rest,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new GraphError("Couldn't reach Meta. Check the internet connection and try again.");
  }
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } } & T;
  if (!response.ok || body.error) {
    throw new GraphError(body.error?.message ?? `Meta answered with an error (${response.status}).`);
  }
  return body;
}

export interface TokenInfo {
  appId: string;
  /** WhatsApp Business Accounts this token can manage and message from. */
  wabaIds: string[];
  /** Null for a token that never expires, which is what a business needs. */
  expiresAt: Date | null;
}

const REQUIRED_SCOPES = ["whatsapp_business_management", "whatsapp_business_messaging"];

/** The app a token belongs to. Works for any valid token, so it's the first check. */
export async function identifyApp(token: string): Promise<{ appId: string; appName: string }> {
  try {
    const app = await graph<{ id: string; name?: string }>(`/app?fields=id,name`, { token });
    return { appId: app.id, appName: app.name ?? "your Meta App" };
  } catch (error) {
    if (error instanceof GraphError && error.message.startsWith("Couldn't reach")) throw error;
    throw new MetaSetupError("Meta says this token isn't valid. Copy it again from Meta.");
  }
}

/**
 * What a token is: its app, the WhatsApp accounts it reaches, and when it
 * expires (debug_token). `accessToken` is who asks: the token itself where
 * Meta allows that, else the app's own token (appId|appSecret), which is
 * why the wizard may only finish this check at the app-secret step. Refuses
 * anything that can't run a business: an invalid token, a temporary one, or
 * one missing WhatsApp permissions.
 */
export async function inspectToken(token: string, accessToken: string = token): Promise<TokenInfo> {
  const { data } = await graph<{
    data: {
      app_id?: string;
      is_valid?: boolean;
      expires_at?: number;
      scopes?: string[];
      granular_scopes?: { scope: string; target_ids?: string[] }[];
    };
  }>(`/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(accessToken)}`);

  if (!data.is_valid || !data.app_id) throw new MetaSetupError("Meta says this token isn't valid. Copy it again from Meta.");

  const missing = REQUIRED_SCOPES.filter((scope) => !data.scopes?.includes(scope));
  if (missing.length) {
    throw new MetaSetupError(
      `This token is missing the ${missing.join(" and ")} permission${missing.length > 1 ? "s" : ""}. Create it again with both WhatsApp permissions ticked.`
    );
  }

  const expiresAt = data.expires_at ? new Date(data.expires_at * 1000) : null;
  if (expiresAt) {
    throw new MetaSetupError(
      `This token expires on ${expiresAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}, so the AI would stop working then. ` +
        "Create a permanent one: Business Settings → System users → Generate new token, with expiry set to Never."
    );
  }

  const wabaIds = data.granular_scopes?.find((g) => g.scope === "whatsapp_business_management")?.target_ids ?? [];
  if (wabaIds.length === 0) {
    throw new MetaSetupError("This token can't reach any WhatsApp Business Account. Give the system user access to the account, then create the token again.");
  }
  return { appId: data.app_id, wabaIds: wabaIds.map(String), expiresAt };
}

export interface WhatsAppNumber {
  id: string;
  wabaId: string;
  wabaName: string;
  displayNumber: string;
  verifiedName: string | null;
  /** True once the number is registered for the Cloud API and can send. */
  registered: boolean;
}

/** Every number in the WhatsApp accounts the token reaches. */
export async function listNumbers(token: string, wabaIds: string[]): Promise<WhatsAppNumber[]> {
  const perAccount = await Promise.all(
    wabaIds.map(async (wabaId) => {
      const [account, numbers] = await Promise.all([
        graph<{ name?: string }>(`/${wabaId}?fields=name`, { token }),
        graph<{
          data: { id: string; display_phone_number: string; verified_name?: string; platform_type?: string }[];
        }>(`/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,platform_type`, { token }),
      ]);
      return numbers.data.map((n) => ({
        id: n.id,
        wabaId,
        wabaName: account.name ?? `WhatsApp account ${wabaId}`,
        displayNumber: n.display_phone_number,
        verifiedName: n.verified_name ?? null,
        registered: n.platform_type === "CLOUD_API",
      }));
    })
  );
  return perAccount.flat();
}

/** True if the secret belongs to the app: Meta only issues an app token for the right pair. */
export async function checkAppSecret(appId: string, appSecret: string): Promise<void> {
  try {
    await graph(
      `/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&grant_type=client_credentials`
    );
  } catch (error) {
    if (error instanceof GraphError && error.message.startsWith("Couldn't reach")) throw error;
    throw new MetaSetupError("That isn't this app's secret. Copy it again from App settings → Basic → App secret → Show.");
  }
}

/** Lets the app receive this WhatsApp account's webhooks. Safe to repeat. */
export async function subscribeAppToAccount(token: string, wabaId: string): Promise<void> {
  await graph(`/${wabaId}/subscribed_apps`, { method: "POST", token });
}

/** Registers a number for the Cloud API with a 6-digit PIN the owner chooses (Meta's two-step verification PIN). */
export async function registerNumber(token: string, phoneNumberId: string, pin: string): Promise<void> {
  await graph(`/${phoneNumberId}/register`, {
    method: "POST",
    token,
    body: JSON.stringify({ messaging_product: "whatsapp", pin }),
  });
}
