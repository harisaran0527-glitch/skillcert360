/**
 * Certificate File Storage Abstraction Layer
 * 
 * Supports external storage providers (Supabase Storage, S3/R2) without storing
 * binary file blobs inside Neon PostgreSQL.
 * 
 * Storage secrets are kept strictly server-side.
 */

export type StorageProviderType = "supabase" | "s3" | "r2" | "none";

export interface StorageConfig {
  provider: StorageProviderType;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseBucket?: string;
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
}

export function getStorageConfig(): StorageConfig {
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

  return { provider: "none" };
}

export function isStorageConfigured(): boolean {
  const config = getStorageConfig();
  return config.provider !== "none";
}

export interface UploadOptions {
  fileName: string;
  contentBuffer: Buffer;
  contentType: string;
}

export interface UploadResult {
  filePath: string;
  publicUrl: string;
}

/**
 * Upload a certificate file (PDF/image) to configured external storage provider.
 * Throws explicit error if external storage is not configured (no faking).
 */
export async function uploadCertificateFile(options: UploadOptions): Promise<UploadResult> {
  const config = getStorageConfig();

  if (config.provider === "none") {
    throw new Error(
      "External file storage is not configured. Please use Credential URL or Credential ID for certificate verification."
    );
  }

  if (config.provider === "supabase") {
    const endpoint = `${config.supabaseUrl}/storage/v1/object/${config.supabaseBucket}/${options.fileName}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        "Content-Type": options.contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(options.contentBuffer),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase Storage upload failed (${response.status}): ${text}`);
    }

    const publicUrl = `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseBucket}/${options.fileName}`;
    return {
      filePath: `${config.supabaseBucket}/${options.fileName}`,
      publicUrl,
    };
  }

  throw new Error(`Storage provider ${config.provider} is not supported in this runtime environment.`);
}

/**
 * Resolves the public URL for a stored certificate file path.
 */
export function getCertificateFileUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;

  const config = getStorageConfig();
  if (config.provider === "supabase" && config.supabaseUrl) {
    return `${config.supabaseUrl}/storage/v1/object/public/${filePath}`;
  }

  return filePath;
}
