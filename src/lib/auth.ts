import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

const scryptAsync = promisify(crypto.scrypt);

export const SESSION_COOKIE = "antflow_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionPayload {
  /// The membership (HumanAgent) this session is working as. With
  /// businessId and isAdmin, it means exactly what it did in v1, so every
  /// page and action that reads these is unchanged by v2.
  agentId: string;
  businessId: string;
  isAdmin: boolean;
  /// v2: the person behind the membership, which the workspace switcher
  /// needs. Absent on cookies issued before switch-over and on a v1-style
  /// login (src/lib/workspaces.ts), so never assume it is set.
  userId?: string;
  exp: number;
}

/**
 * Password hashing (Node's built-in scrypt rather than adding a bcrypt
 * dependency — this project already leans on built-in `crypto` for HMAC
 * signing elsewhere, e.g. whatsapp.ts's webhook signature check).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hashHex, "hex");
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function sign(data: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Sessions are a signed, self-contained cookie (agentId/businessId/isAdmin/
 * exp + an HMAC signature) rather than a server-side session table — no
 * extra model needed, and src/proxy.ts (which must stay fast and avoid a DB
 * round-trip on every request) can verify one with just `AUTH_SECRET`.
 */
export function createSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  let expected: string;
  try {
    expected = sign(data);
  } catch {
    return null;
  }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function newSessionExpiry(): number {
  return Date.now() + SESSION_TTL_MS;
}

/** The Set-Cookie attributes every session cookie is written with. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

/** Read-only session access for Server Components. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * For Server Actions and Route Handlers. src/proxy.ts already redirects
 * unauthenticated requests away from protected paths, but Next's own docs
 * (file-conventions/proxy.md) warn that a matcher change can silently drop
 * coverage for a Server Function — so every action re-checks here too,
 * rather than trusting the proxy layer alone.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!session.isAdmin) throw new Error("Admin access required");
  return session;
}
