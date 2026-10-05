'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { isS3Configured } from '@/lib/env';
import { presignUpload } from '@/lib/storage';
import { ROLES } from '@/shared/constants/roles';

export interface PresignResult {
  ok: boolean;
  error?: string;
  url?: string;
  key?: string;
}

const extFromName = (name: string) => {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name);
  return match ? match[1].toLowerCase() : 'bin';
};

export async function presignQrUpload(input: {
  filename: string;
  contentType: string;
  size: number;
}): Promise<PresignResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (!isS3Configured) return { ok: false, error: 'File storage is not configured.' };

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(input.contentType)) {
    return { ok: false, error: `That file type isn't allowed for QR codes.` };
  }

  if (input.size > 2_000_000) {
    return { ok: false, error: 'That file is too large (max 2MB).' };
  }

  const ext = extFromName(input.filename);
  const key = `settings/qr-${randomUUID()}.${ext}`;

  try {
    const url = await presignUpload(key, input.contentType, input.size);
    return { ok: true, url, key };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to generate upload URL.' };
  }
}

export async function updateGlobalQrSettings(qrUrl: string) {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  try {
    await db.globalSettings.upsert({
      where: { id: 'singleton' },
      update: { paymentQrUrl: qrUrl },
      create: { id: 'singleton', paymentQrUrl: qrUrl },
    });
    
    revalidatePath('/admin/settings');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to save QR code setting.' };
  }
}

export async function updateBankSettings(input: {
  bankName: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankBranch: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const { bankName, bankAccountName, bankAccountNo, bankBranch } = input;

  if (!bankName.trim() || !bankAccountName.trim() || !bankAccountNo.trim()) {
    return { ok: false, error: 'Bank name, account name, and account number are required.' };
  }

  try {
    await db.globalSettings.upsert({
      where: { id: 'singleton' },
      update: { bankName, bankAccountName, bankAccountNo, bankBranch },
      create: { id: 'singleton', bankName, bankAccountName, bankAccountNo, bankBranch },
    });

    revalidatePath('/admin/settings');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to save bank details.' };
  }
}
