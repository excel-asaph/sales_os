import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, the standard/recommended size for GCM
const AUTH_TAG_LENGTH = 16;

// The one master key encrypting every business's stored Meta access token
// (BusinessMetaConnection.encryptedAccessToken) — proportionate for this
// app's scale, the same reasoning as AUTH_SECRET being a single env var
// rather than a full KMS. Generate with the same command the README already
// documents for AUTH_SECRET:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
function getKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY is not set — required to encrypt/decrypt stored Meta credentials."
    );
  }
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must be a 32-byte value, hex-encoded (64 hex characters).");
  }
  return buf;
}

/**
 * Encrypts a secret (a Meta access token) for storage. Returns a single
 * base64 string packing iv + authTag + ciphertext together, so the schema
 * only needs one column instead of three.
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Reverses encryptSecret. Throws if the key is wrong or the value was tampered with (GCM auth tag check). */
export function decryptSecret(packed: string): string {
  const key = getKey();
  const raw = Buffer.from(packed, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
