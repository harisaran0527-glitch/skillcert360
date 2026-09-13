import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";

export type StorageProviderType = "vercel-blob" | "supabase" | "s3" | "local" | "none";

export interface StorageConfig {
  provider: StorageProviderType;
  blobToken?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseBucket?: string;
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  localDir?: string;
}

export function getStorageConfig(): StorageConfig {
  // 1. Vercel Blob
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    return {
      provider: "vercel-blob",
      blobToken,
    };
  }

  // 2. Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "certificates";
  if (supabaseUrl && supabaseServiceKey) {
    return {
      provider: "supabase",
      supabaseUrl,
      supabaseServiceRoleKey: supabaseServiceKey,
      supabaseBucket,
    };
  }

  // 3. AWS S3 / Cloudflare R2
  const s3Bucket = process.env.S3_BUCKET_NAME;
  const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
  const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const s3Region = process.env.S3_REGION || "us-east-1";
  if (s3Bucket && s3AccessKeyId && s3SecretAccessKey) {
    return {
      provider: "s3",
      s3Bucket,
      s3Region,
      s3AccessKeyId,
      s3SecretAccessKey,
    };
  }

  // 4. Local Storage (for development / testing environments when explicitly enabled)
  const localDir = process.env.LOCAL_STORAGE_DIR || (process.env.STORAGE_PROVIDER === "local" ? "uploads" : undefined);
  if (localDir) {
    return {
      provider: "local",
      localDir,
    };
  }

  return { provider: "none" };
}

export function isStorageConfigured(): boolean {
  const config = getStorageConfig();
  return config.provider !== "none";
}

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
 * Enforces MIME type, size limit (5MB), extension, and magic header signatures.
 */
export function validateCertificateFile(file: {
  name: string;
  buffer: Buffer;
  mimeType: string;
}): FileValidationResult {
  if (!file || !file.buffer || file.buffer.length === 0) {
    return { valid: false, error: "Empty or missing file buffer." };
  }

  if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds maximum size limit of 5 MB." };
  }

  const rawName = (file.name || "").toLowerCase();
  const rawMime = (file.mimeType || "").toLowerCase();

  // Reject known dangerous extensions
  const forbiddenExts = [".exe", ".zip", ".js", ".html", ".htm", ".svg", ".sh", ".bat", ".cmd", ".php", ".py", ".ps1"];
  if (forbiddenExts.some((ext) => rawName.endsWith(ext))) {
    return { valid: false, error: "Unsupported or restricted file format." };
  }

  // Magic byte checks
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

  // Ensure declared MIME type matches header signature or is acceptable
  if (rawMime && rawMime !== detectedMime) {
    if (!(rawMime === "image/jpg" && detectedMime === "image/jpeg")) {
      return { valid: false, error: "File contents do not match the declared file type." };
    }
  }

  return {
    valid: true,
    mimeType: detectedMime,
    cleanExtension: cleanExt,
  };
}

export interface UploadOptions {
  studentId: string;
  certificateId: string;
  file: {
    name: string;
    buffer: Buffer;
    mimeType: string;
  };
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
 * Safe structured storage path concept:
 * certificates/{studentId}/{certificateId}/{secure-random-file-name}
 */
export function generateStorageKey(studentId: string, certificateId: string, extension: string): string {
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const uniqueId = randomUUID();
  return `certificates/${studentId}/${certificateId}/${uniqueId}.${safeExt}`;
}

/**
 * Upload certificate file to external object storage provider.
 * Throws explicit error if external storage is not configured.
 */
export async function uploadCertificateFile(options: UploadOptions): Promise<UploadResult> {
  const validation = validateCertificateFile(options.file);
  if (!validation.valid || !validation.mimeType || !validation.cleanExtension) {
    throw new Error(validation.error || "Invalid file for upload.");
  }

  const config = getStorageConfig();
  if (config.provider === "none") {
    throw new Error(
      "External file storage is not configured. Please submit via Credential URL and Credential ID."
    );
  }

  const storageKey = generateStorageKey(
    options.studentId,
    options.certificateId,
    validation.cleanExtension
  );
  const mimeType = validation.mimeType;
  const fileSize = options.file.buffer.length;

  if (config.provider === "vercel-blob") {
    const endpoint = `https://blob.vercel-storage.com/${storageKey}`;
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${config.blobToken}`,
        "x-api-version": "7",
        "x-content-type": mimeType,
      },
      body: new Uint8Array(options.file.buffer),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Vercel Blob upload failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { url: string };
    return {
      storageKey,
      fileUrl: data.url,
      originalFileName: options.file.name,
      mimeType,
      fileSize,
      storageProvider: "vercel-blob",
    };
  }

  if (config.provider === "supabase") {
    const endpoint = `${config.supabaseUrl}/storage/v1/object/${config.supabaseBucket}/${storageKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: new Uint8Array(options.file.buffer),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase Storage upload failed (${response.status}): ${text}`);
    }

    const publicUrl = `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseBucket}/${storageKey}`;
    return {
      storageKey: `${config.supabaseBucket}/${storageKey}`,
      fileUrl: publicUrl,
      originalFileName: options.file.name,
      mimeType,
      fileSize,
      storageProvider: "supabase",
    };
  }

  if (config.provider === "local" && config.localDir) {
    const targetPath = resolve(config.localDir, storageKey);
    const parentDir = resolve(targetPath, "..");
    await mkdir(parentDir, { recursive: true });
    await writeFile(targetPath, options.file.buffer);

    return {
      storageKey,
      fileUrl: `/api/certificates/file/${encodeURIComponent(options.certificateId)}`,
      originalFileName: options.file.name,
      mimeType,
      fileSize,
      storageProvider: "local",
    };
  }

  throw new Error(`Storage provider "${config.provider}" is not implemented.`);
}

/**
 * Delete a certificate file from external object storage.
 */
export async function deleteCertificateFile(storageKey: string | null | undefined): Promise<boolean> {
  if (!storageKey) return false;

  const config = getStorageConfig();
  if (config.provider === "none") return false;

  try {
    if (config.provider === "vercel-blob") {
      const endpoint = `https://blob.vercel-storage.com/delete`;
      await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.blobToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ urls: [storageKey] }),
      });
      return true;
    }

    if (config.provider === "supabase") {
      const keyWithoutBucket = storageKey.includes("/")
        ? storageKey.split("/").slice(1).join("/")
        : storageKey;
      const endpoint = `${config.supabaseUrl}/storage/v1/object/${config.supabaseBucket}/${keyWithoutBucket}`;
      await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        },
      });
      return true;
    }

    if (config.provider === "local" && config.localDir) {
      const targetPath = resolve(config.localDir, storageKey);
      if (existsSync(targetPath)) {
        await unlink(targetPath);
      }
      return true;
    }
  } catch (err) {
    console.error("Failed to delete certificate storage file:", err);
  }

  return false;
}

/**
 * Fetch file content buffer for proxy streaming / verification preview.
 */
export async function getCertificateFileContent(
  storageKey: string | null | undefined
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!storageKey) return null;

  const config = getStorageConfig();

  if (config.provider === "local" && config.localDir) {
    const targetPath = resolve(config.localDir, storageKey);
    if (!existsSync(targetPath)) return null;
    const buffer = await readFile(targetPath);
    const cleanExt = storageKey.split(".").pop()?.toLowerCase();
    const contentType =
      cleanExt === "pdf" ? "application/pdf" : cleanExt === "png" ? "image/png" : "image/jpeg";
    return { buffer, contentType };
  }

  // If storageKey is a direct HTTP/HTTPS URL
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    const res = await fetch(storageKey);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return { buffer, contentType };
  }

  if (config.provider === "supabase" && config.supabaseUrl) {
    const keyWithoutBucket = storageKey.includes("/")
      ? storageKey.split("/").slice(1).join("/")
      : storageKey;
    const endpoint = `${config.supabaseUrl}/storage/v1/object/authenticated/${config.supabaseBucket}/${keyWithoutBucket}`;
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${config.supabaseServiceRoleKey}` },
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return { buffer, contentType };
  }

  if (config.provider === "vercel-blob") {
    // If storageKey is a Blob URL
    const res = await fetch(`https://blob.vercel-storage.com/${storageKey}`, {
      headers: { authorization: `Bearer ${config.blobToken}` },
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return { buffer, contentType };
  }

  return null;
}
