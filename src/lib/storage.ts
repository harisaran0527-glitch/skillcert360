/**
 * storage.ts — SkillCert 360 certificate file storage abstraction
 *
 * Supported providers:
 *   supabase      — Supabase Storage (production, recommended)
 *   cloudflare-r2 — Cloudflare R2 Object Storage via S3 API (production alternative)
 *   vercel-blob   — Vercel Private Blob (production alternative)
 *   local         — local filesystem (development / E2E tests only)
 *   none          — no file storage configured
 *
 * Production MUST use supabase, cloudflare-r2, or vercel-blob.
 * Local filesystem storage is explicitly blocked in NODE_ENV=production.
 *
 * Supabase Storage:
 *   - All operations are server-side only (service role key, never NEXT_PUBLIC_).
 *   - Bucket must be private; signed/proxy URLs are never exposed to the browser.
 *   - Files are served via /api/certificates/[id]/file with auth enforcement.
 *   - Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET
 */

import { randomUUID } from "node:crypto";

// ── Local-only fs imports ────────────────────────────────────────────────────
// These are only executed at runtime when provider === "local".
// We use /*turbopackIgnore: true*/ to prevent Turbopack from tracing the full
// project due to dynamic path resolution (build warning fix).
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

// ── Vercel Blob SDK ──────────────────────────────────────────────────────────
import { put, del as blobDel } from "@vercel/blob";

// ── AWS S3 SDK for Cloudflare R2 ─────────────────────────────────────────────
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ── Supabase SDK ─────────────────────────────────────────────────────────────
// Imported lazily via createClient() at runtime so the service role key is
// never bundled into client-side code paths.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────────────────────────

export type StorageProviderType =
  | "supabase"
  | "cloudflare-r2"
  | "vercel-blob"
  | "local"
  | "none";

export interface StorageConfig {
  provider: StorageProviderType;
  /** Relative sub-directory for local dev uploads. Never used in production. */
  localDir?: string;
}

// ── Supabase Client Helper ────────────────────────────────────────────────────

let cachedSupabaseClient: SupabaseClient | null = null;
let cachedSupabaseUrl: string | null = null;

/**
 * Returns a server-side-only Supabase client using the SERVICE ROLE KEY.
 * Never call this from browser code or expose the key to NEXT_PUBLIC_ variables.
 */
function getSupabaseClient(): { client: SupabaseClient; bucket: string } | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_STORAGE_BUCKET || "skillcert360-certificates";

  if (!url || !serviceRoleKey) {
    return null;
  }

  if (!cachedSupabaseClient || cachedSupabaseUrl !== url) {
    cachedSupabaseClient = createClient(url, serviceRoleKey, {
      auth: {
        // Disable auto-refresh and session persistence — this is a server-only client.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    cachedSupabaseUrl = url;
  }

  return { client: cachedSupabaseClient, bucket };
}

// ── R2 Client Helper ─────────────────────────────────────────────────────────

let cachedR2Client: S3Client | null = null;
let cachedR2Bucket: string | null = null;

function getR2Client(): { client: S3Client; bucket: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  if (!cachedR2Client || cachedR2Bucket !== bucket) {
    const endpoint =
      process.env.R2_ENDPOINT ||
      `https://${accountId}.r2.cloudflarestorage.com`;

    cachedR2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    cachedR2Bucket = bucket;
  }

  return { client: cachedR2Client, bucket: cachedR2Bucket };
}

// ── Config resolution ────────────────────────────────────────────────────────

export function getStorageConfig(): StorageConfig {
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Supabase Storage — explicit STORAGE_PROVIDER === "supabase" or presence of credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    process.env.STORAGE_PROVIDER === "supabase" ||
    (supabaseUrl && supabaseKey)
  ) {
    if (!supabaseUrl || !supabaseKey) {
      if (isProduction) {
        console.error(
          "[storage] Supabase Storage credentials missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)."
        );
      }
      return { provider: "none" };
    }
    return { provider: "supabase" };
  }

  // 2. Cloudflare R2 — explicit STORAGE_PROVIDER === "cloudflare-r2" or presence of R2 credentials
  const r2AccountId = process.env.R2_ACCOUNT_ID;
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const r2BucketName = process.env.R2_BUCKET_NAME;

  if (
    process.env.STORAGE_PROVIDER === "cloudflare-r2" ||
    (r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName)
  ) {
    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName) {
      if (isProduction) {
        console.error(
          "[storage] Cloudflare R2 credentials missing (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)."
        );
      }
      return { provider: "none" };
    }
    return { provider: "cloudflare-r2" };
  }

  // 3. Vercel Blob — detected by presence of token (auto-injected by Vercel)
  const blobToken =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

  if (blobToken || process.env.STORAGE_PROVIDER === "vercel-blob") {
    if (!blobToken) {
      if (isProduction) {
        console.error(
          "[storage] BLOB_READ_WRITE_TOKEN is not set. File uploads will be unavailable."
        );
      }
      return { provider: "none" };
    }
    return { provider: "vercel-blob" };
  }

  // 4. Local filesystem — only allowed outside production
  if (isProduction) {
    console.error(
      "[storage] No production storage provider configured (Supabase, Cloudflare R2, or Vercel Blob). File uploads will be unavailable."
    );
    return { provider: "none" };
  }

  // Local dev / test: allow explicit opt-in via STORAGE_PROVIDER=local or LOCAL_STORAGE_DIR
  const localDir =
    process.env.LOCAL_STORAGE_DIR ||
    (process.env.STORAGE_PROVIDER === "local" ? "test-results/uploads" : undefined);

  if (localDir) {
    return { provider: "local", localDir };
  }

  return { provider: "none" };
}

export function isStorageConfigured(): boolean {
  return getStorageConfig().provider !== "none";
}

// ── File validation ──────────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  cleanExtension?: string;
}

/**
 * Server-side validation of certificate upload files.
 * Enforces MIME type, size limit (5 MB), extension, and magic header signatures.
 */
export function validateCertificateFile(file: {
  name: string;
  buffer: Buffer;
  mimeType: string;
}): FileValidationResult {
  if (!file?.buffer || file.buffer.length === 0) {
    return { valid: false, error: "Empty or missing file buffer." };
  }

  if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds maximum size limit of 5 MB." };
  }

  const rawName = (file.name || "").toLowerCase();

  // Reject dangerous extensions
  const forbiddenExts = [
    ".exe", ".zip", ".js", ".html", ".htm", ".svg",
    ".sh", ".bat", ".cmd", ".php", ".py", ".ps1",
  ];
  if (forbiddenExts.some((ext) => rawName.endsWith(ext))) {
    return { valid: false, error: "Unsupported or restricted file format." };
  }

  // Magic-byte detection
  const buf = file.buffer;
  let detectedMime: string | null = null;
  let cleanExt: string | null = null;

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    detectedMime = "application/pdf";
    cleanExt = "pdf";
  }
  // PNG: 0x89 0x50 0x4E 0x47
  else if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    detectedMime = "image/png";
    cleanExt = "png";
  }
  // JPEG: 0xFF 0xD8 0xFF
  else if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    detectedMime = "image/jpeg";
    cleanExt = "jpg";
  }

  if (!detectedMime || !cleanExt || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
    return {
      valid: false,
      error: "Unsupported file type. Only PDF, JPG, JPEG, and PNG files are allowed.",
    };
  }

  const rawMime = (file.mimeType || "").toLowerCase();
  if (rawMime && rawMime !== detectedMime) {
    if (!(rawMime === "image/jpg" && detectedMime === "image/jpeg")) {
      return { valid: false, error: "File contents do not match the declared file type." };
    }
  }

  return { valid: true, mimeType: detectedMime, cleanExtension: cleanExt };
}

// ── Key generation ────────────────────────────────────────────────────────────

export interface UploadOptions {
  studentId: string;
  certificateId: string;
  file: { name: string; buffer: Buffer; mimeType: string };
}

export interface UploadResult {
  storageKey: string;
  fileUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
}

/**
 * Deterministic, safe storage path:
 *   certificates/{studentId}/{certificateId}/{uuid}.{ext}
 */
export function generateStorageKey(
  studentId: string,
  certificateId: string,
  extension: string
): string {
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `certificates/${studentId}/${certificateId}/${randomUUID()}.${safeExt}`;
}

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * Upload certificate file to configured storage provider.
 *
 * Production: Supabase Storage (private bucket), Cloudflare R2, or Vercel Private Blob.
 * Development/Test: local filesystem under a statically scoped directory.
 *
 * The returned fileUrl is always the internal proxy route /api/certificates/[id]/file.
 * Supabase credentials are NEVER exposed to the browser.
 */
export async function uploadCertificateFile(options: UploadOptions): Promise<UploadResult> {
  const validation = validateCertificateFile(options.file);
  if (!validation.valid || !validation.mimeType || !validation.cleanExtension) {
    throw new Error(validation.error || "Invalid file for upload.");
  }

  const config = getStorageConfig();
  if (config.provider === "none") {
    throw new Error(
      "File storage is not configured. Submit via Credential URL and Credential ID."
    );
  }

  const storageKey = generateStorageKey(
    options.studentId,
    options.certificateId,
    validation.cleanExtension
  );
  const mimeType = validation.mimeType;
  const fileSize = options.file.buffer.length;

  // ── Supabase Storage ─────────────────────────────────────────────────────
  if (config.provider === "supabase") {
    const sb = getSupabaseClient();
    if (!sb) {
      throw new Error(
        "Supabase is configured as provider but credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are missing."
      );
    }

    const { error } = await sb.client.storage
      .from(sb.bucket)
      .upload(storageKey, options.file.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    return {
      storageKey,
      fileUrl: `/api/certificates/${encodeURIComponent(options.certificateId)}/file`,
      originalFileName: options.file.name,
      mimeType,
      fileSize,
      storageProvider: "supabase",
    };
  }

  // ── Cloudflare R2 ────────────────────────────────────────────────────────
  if (config.provider === "cloudflare-r2") {
    const r2 = getR2Client();
    if (!r2) {
      throw new Error("Cloudflare R2 is configured as provider but environment variables are missing.");
    }
    const command = new PutObjectCommand({
      Bucket: r2.bucket,
      Key: storageKey,
      Body: options.file.buffer,
      ContentType: mimeType,
    });
    await r2.client.send(command);

    return {
      storageKey,
      fileUrl: `/api/certificates/${encodeURIComponent(options.certificateId)}/file`,
      originalFileName: options.file.name,
      mimeType,
      fileSize,
      storageProvider: "cloudflare-r2",
    };
  }

  // ── Vercel Private Blob ──────────────────────────────────────────────────
  if (config.provider === "vercel-blob") {
    const blob = await put(storageKey, options.file.buffer, {
      access: "private",
      contentType: mimeType,
      addRandomSuffix: false,
    });

    return {
      storageKey: blob.url,
      fileUrl: blob.url,
      originalFileName: options.file.name,
      mimeType,
      fileSize,
      storageProvider: "vercel-blob",
    };
  }

  // ── Local filesystem (dev/test only) ─────────────────────────────────────
  if (config.provider === "local" && config.localDir) {
    const baseDir = join(/*turbopackIgnore: true*/ process.cwd(), config.localDir);
    const targetPath = join(/*turbopackIgnore: true*/ baseDir, storageKey);
    const parentDir = join(targetPath, "..");
    await mkdir(parentDir, { recursive: true });
    await writeFile(
      /*turbopackIgnore: true*/ targetPath,
      options.file.buffer
    );

    return {
      storageKey,
      fileUrl: `/api/certificates/${encodeURIComponent(options.certificateId)}/file`,
      originalFileName: options.file.name,
      mimeType,
      fileSize,
      storageProvider: "local",
    };
  }

  throw new Error(`Storage provider "${config.provider}" is not implemented.`);
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete a certificate file from storage.
 * Safe — returns false on error instead of throwing.
 */
export async function deleteCertificateFile(
  storageKey: string | null | undefined
): Promise<boolean> {
  if (!storageKey) return false;

  const config = getStorageConfig();
  if (config.provider === "none") return false;

  try {
    // ── Supabase Storage ───────────────────────────────────────────────────
    if (config.provider === "supabase") {
      const sb = getSupabaseClient();
      if (sb) {
        const { error } = await sb.client.storage
          .from(sb.bucket)
          .remove([storageKey]);
        if (error) {
          console.error("[storage] Supabase Storage delete error:", error.message);
          return false;
        }
        return true;
      }
    }

    if (config.provider === "cloudflare-r2") {
      const r2 = getR2Client();
      if (r2) {
        const command = new DeleteObjectCommand({
          Bucket: r2.bucket,
          Key: storageKey,
        });
        await r2.client.send(command);
        return true;
      }
    }

    if (config.provider === "vercel-blob") {
      await blobDel(storageKey);
      return true;
    }

    if (config.provider === "local" && config.localDir) {
      const baseDir = join(/*turbopackIgnore: true*/ process.cwd(), config.localDir);
      const targetPath = join(/*turbopackIgnore: true*/ baseDir, storageKey);
      if (existsSync(/*turbopackIgnore: true*/ targetPath)) {
        await unlink(/*turbopackIgnore: true*/ targetPath);
      }
      return true;
    }
  } catch (err) {
    console.error("[storage] Failed to delete certificate file:", err);
  }

  return false;
}

// ── Retrieve ──────────────────────────────────────────────────────────────────

/**
 * Fetch file content for server-side proxy streaming.
 * Used by /api/certificates/[id]/file to enforce auth before serving.
 *
 * All providers fetch the file server-side and return a Buffer.
 * Supabase credentials (service role key) are NEVER sent to the browser.
 *
 * For Supabase: downloads the object bytes using the admin client.
 * For Cloudflare R2: retrieves object using S3 GetObjectCommand server-side.
 * For private Vercel Blob: fetches using the SDK token server-side.
 * For local: reads from the statically scoped directory.
 */
export async function getCertificateFileContent(
  storageKey: string | null | undefined
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!storageKey) return null;

  const config = getStorageConfig();

  // ── Supabase Storage ──────────────────────────────────────────────────────
  if (config.provider === "supabase") {
    const sb = getSupabaseClient();
    if (!sb) return null;

    try {
      const { data, error } = await sb.client.storage
        .from(sb.bucket)
        .download(storageKey);

      if (error || !data) {
        console.error("[storage] Supabase Storage download error:", error?.message);
        return null;
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine content type from key extension
      const cleanExt = storageKey.split(".").pop()?.toLowerCase();
      const contentType =
        cleanExt === "pdf"
          ? "application/pdf"
          : cleanExt === "png"
          ? "image/png"
          : "image/jpeg";

      return { buffer, contentType };
    } catch (err) {
      console.error("[storage] Failed to fetch object from Supabase Storage:", err);
      return null;
    }
  }

  // ── Cloudflare R2 ────────────────────────────────────────────────────────
  if (config.provider === "cloudflare-r2") {
    const r2 = getR2Client();
    if (!r2) return null;

    try {
      const command = new GetObjectCommand({
        Bucket: r2.bucket,
        Key: storageKey,
      });
      const response = await r2.client.send(command);
      if (!response.Body) return null;

      const byteArray = await response.Body.transformToByteArray();
      const buffer = Buffer.from(byteArray);
      const contentType = response.ContentType || "application/octet-stream";
      return { buffer, contentType };
    } catch (err) {
      console.error("[storage] Failed to fetch object from R2:", err);
      return null;
    }
  }

  // ── Vercel Private Blob ──────────────────────────────────────────────────
  if (config.provider === "vercel-blob") {
    const token =
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

    if (!token) return null;

    const url = storageKey.startsWith("http") ? storageKey : `https://blob.vercel-storage.com/${storageKey}`;
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return { buffer, contentType };
  }

  // ── Local filesystem (dev/test only) ─────────────────────────────────────
  if (config.provider === "local" && config.localDir) {
    const baseDir = join(/*turbopackIgnore: true*/ process.cwd(), config.localDir);
    const targetPath = join(/*turbopackIgnore: true*/ baseDir, storageKey);

    if (!existsSync(/*turbopackIgnore: true*/ targetPath)) return null;

    const buffer = await readFile(/*turbopackIgnore: true*/ targetPath);
    const cleanExt = storageKey.split(".").pop()?.toLowerCase();
    const contentType =
      cleanExt === "pdf"
        ? "application/pdf"
        : cleanExt === "png"
        ? "image/png"
        : "image/jpeg";
    return { buffer, contentType };
  }

  // Fallback: if storageKey is an HTTPS URL (legacy records)
  if (storageKey.startsWith("https://")) {
    const res = await fetch(storageKey);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return { buffer, contentType };
  }

  return null;
}
