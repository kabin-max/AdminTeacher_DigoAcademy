import 'server-only';

import { db } from '@/lib/db';
import { isS3Configured, presignDownload } from '@/lib/storage';

async function sign(key: string): Promise<string | null> {
  if (!isS3Configured) return null;
  try {
    return await presignDownload(key);
  } catch {
    return null;
  }
}

export interface BatchVideoRow {
  id: string;
  title: string;
  createdAt: string;
  videoUrl: string | null;
}

/** All class videos for a batch, newest first, with short-lived signed playback URLs. */
export async function getBatchVideos(batchId: string): Promise<BatchVideoRow[]> {
  const rows = await db.batchVideo.findMany({ where: { batchId }, orderBy: { createdAt: 'desc' } });
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
      videoUrl: await sign(row.videoKey),
    }))
  );
}
