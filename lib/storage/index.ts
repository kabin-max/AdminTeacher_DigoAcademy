import 'server-only';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env, isS3Configured } from '@/lib/env';

/**
 * Object-storage seam (SOLID/DIP). Everything goes through this module so the app
 * never touches the AWS SDK directly and never exposes credentials to the client.
 * Backed by AWS S3 in prod and MinIO in dev — same code, different S3_* env.
 *
 * Uploads use a presigned PUT: the browser uploads straight to the bucket with a
 * short-lived signed URL. Playback/downloads use a presigned GET.
 */
let client: S3Client | null = null;

function getClient(): S3Client {
  if (!isS3Configured) {
    throw new Error('Object storage is not configured (set S3_BUCKET + credentials).');
  }
  if (!client) {
    client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

/** Short-lived URL the browser PUTs a file to. `contentType` must match the upload. */
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(getClient(), command, { expiresIn });
}

/** Short-lived URL to read/stream a stored object (signed playback). */
export async function presignDownload(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key });
  return getSignedUrl(getClient(), command, { expiresIn });
}

export { isS3Configured };
