import { registerAs } from '@nestjs/config';

export type StorageProvider = 'ovh' | 'r2';

const readProvider = (): StorageProvider =>
  (process.env.STORAGE_PROVIDER || 'ovh').toLowerCase() as StorageProvider;

/**
 * Public base URL objects are served from (OVH container URL, or the custom
 * domain bound to the R2 bucket). Read lazily because entity transformers run
 * long after boot, and exported so they resolve it the same way the services do.
 */
export const resolveStoragePublicUrl = (): string =>
  (process.env.STORAGE_PUBLIC_URL || process.env.OVH_BASE_URL || '').replace(
    /\/+$/,
    '',
  );

/**
 * S3-compatible object storage. Both providers speak the same S3 API, so the
 * only differences worth modelling are the region default and whether the
 * provider honours per-object ACLs.
 *
 * The legacy `OVH_*` variables are still read as a fallback, so switching to
 * `STORAGE_*` is opt-in and existing environments keep working untouched.
 */
export default registerAs('storage', (): Record<string, unknown> => {
  const provider = readProvider();

  return {
    provider,
    // R2 ignores the region, but the SDK still requires one to be set.
    region:
      process.env.STORAGE_REGION ||
      process.env.OVH_REGION ||
      (provider === 'r2' ? 'auto' : undefined),
    endpoint: process.env.STORAGE_ENDPOINT || process.env.OVH_ENDPOINT,
    accessKey: process.env.STORAGE_ACCESS_KEY || process.env.OVH_ACCESS_KEY,
    secretKey:
      process.env.STORAGE_SECRET_KEY || process.env.OVH_SECRET_ACCESS_KEY,
    bucketName: process.env.STORAGE_BUCKET || process.env.OVH_BUCKET_NAME,
    baseUrl: resolveStoragePublicUrl(),
    // R2 has no per-object ACLs: public access there is a bucket-level setting
    // bound to a custom domain, so the header is pointless (and unsupported).
    supportsObjectAcl: provider !== 'r2',
    // Lifetime of the signed URLs handed out for private objects (recitations).
    // Long enough to start playback and to survive an AI-service retry, short
    // enough that a leaked link stops working the same day.
    signedUrlTtlSeconds: parseInt(
      process.env.STORAGE_SIGNED_URL_TTL || '3600',
      10,
    ),
    fileSizeLimit:
      parseInt(process.env.MAX_SIZE_FILE_UPLOAD || '20', 10) * 1024 * 1024,
    fileCsvSizeLimit:
      parseInt(process.env.MAX_SIZE_CSV_UPLOAD || '50', 10) * 1024 * 1024,
    maxRows: parseInt(process.env.MAX_CSV_ROWS || '10000', 10),
  };
});
