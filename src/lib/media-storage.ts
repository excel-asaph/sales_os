import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const GRAPH_API_VERSION = "v21.0";
const RECEIPT_STORAGE_DIR = path.join(process.cwd(), "storage", "receipts");

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/amr": "amr",
};

export const MIME_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSION_BY_MIME).map(([mime, extension]) => [extension, mime])
);

export interface DownloadedMedia {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Downloads a WhatsApp media asset by id — Graph API is a two-step fetch:
 * resolve the media id to a short-lived URL, then download the bytes from
 * that URL, both authenticated with the same access token.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<DownloadedMedia | null> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn(`[media-storage:dry-run] WHATSAPP_ACCESS_TOKEN not set — cannot download media ${mediaId}`);
    return null;
  }

  const metaResponse = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metaResponse.ok) {
    throw new Error(`WhatsApp media lookup failed (${metaResponse.status}): ${await metaResponse.text()}`);
  }
  const meta = (await metaResponse.json()) as { url: string; mime_type: string };

  const fileResponse = await fetch(meta.url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!fileResponse.ok) {
    throw new Error(`WhatsApp media download failed (${fileResponse.status}): ${await fileResponse.text()}`);
  }

  return { buffer: Buffer.from(await fileResponse.arrayBuffer()), mimeType: meta.mime_type };
}

interface ObjectStorageConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
}

function getObjectStorageConfig(): ObjectStorageConfig | null {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const bucket = process.env.STORAGE_BUCKET;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey, publicBaseUrl };
}

let s3Client: S3Client | null = null;
function getS3Client(config: ObjectStorageConfig): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      // R2 (and most self-hosted S3-compatible stores) address buckets by
      // path under the account endpoint rather than via a virtual-hosted
      // subdomain — path style works for both R2 and real AWS S3.
      forcePathStyle: true,
    });
  }
  return s3Client;
}

/**
 * Persists a downloaded WhatsApp media asset (receipt image, delivered
 * product file re-hosting isn't needed here, an inbound voice note, etc.)
 * so we have a stable, re-servable URL for it instead of the short-lived
 * WhatsApp media reference. Uploads to real S3-compatible object storage
 * (Cloudflare R2 or AWS S3, ARCHITECTURE.md §3) when `STORAGE_*` env vars
 * are configured; otherwise falls back to local disk — the same kind of
 * dry-run fallback whatsapp-send.ts uses when WhatsApp credentials aren't
 * set, not a permanent choice, just what makes local dev possible without
 * a bucket.
 */
export async function persistMediaFile(buffer: Buffer, mimeType: string, mediaId: string): Promise<string> {
  const extension = EXTENSION_BY_MIME[mimeType] ?? "bin";
  const filename = `${mediaId}.${extension}`;

  const objectStorage = getObjectStorageConfig();
  if (objectStorage) {
    const key = `receipts/${filename}`;
    await getS3Client(objectStorage).send(
      new PutObjectCommand({
        Bucket: objectStorage.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return `${objectStorage.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  console.warn(`[media-storage:local-disk] STORAGE_* not fully configured — saving ${filename} to local disk`);
  await fs.mkdir(RECEIPT_STORAGE_DIR, { recursive: true });
  await fs.writeFile(path.join(RECEIPT_STORAGE_DIR, filename), buffer);
  return `/api/media/receipts/${filename}`;
}

export function receiptStorageDir(): string {
  return RECEIPT_STORAGE_DIR;
}

/**
 * Reads back a URL previously returned by `persistMediaFile`, whichever
 * backend produced it. A server-side `fetch` can't resolve the local-disk
 * fallback's relative `/api/media/receipts/...` path (no host to resolve
 * against outside a browser) — that case reads the file directly; a real
 * object-storage URL just fetches. Used when re-verifying already-stored
 * evidence (src/lib/actions.ts) instead of re-downloading from WhatsApp.
 */
export async function readPersistedMedia(url: string): Promise<DownloadedMedia | null> {
  if (url.startsWith("/api/media/receipts/")) {
    const filename = path.basename(url.slice("/api/media/receipts/".length));
    try {
      const buffer = await fs.readFile(path.join(RECEIPT_STORAGE_DIR, filename));
      const extension = filename.split(".").pop()?.toLowerCase() ?? "";
      return { buffer, mimeType: MIME_BY_EXTENSION[extension] ?? "application/octet-stream" };
    } catch {
      return null;
    }
  }

  const response = await fetch(url);
  if (!response.ok) return null;
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}
