'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth/client';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';

type Step = 'idle' | 'password' | 'confirm';

/** Pull the shared secret out of an otpauth:// URI for manual entry. */
function secretFromUri(uri: string): string | null {
  try {
    return new URL(uri).searchParams.get('secret');
  } catch {
    return null;
  }
}

export function MfaSetup({ enabled, required }: { enabled: boolean; required?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('idle');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  function reset() {
    setStep('idle');
    setPassword('');
    setCode('');
    setTotpUri('');
    setBackupCodes([]);
  }

  async function startEnable() {
    setBusy(true);
    const { data, error } = await authClient.twoFactor.enable({ password });
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? 'Could not start 2FA setup');
      return;
    }
    setTotpUri(data.totpURI);
    setBackupCodes(data.backupCodes);
    setStep('confirm');
  }

  async function confirmEnable() {
    setBusy(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? 'Invalid code');
      return;
    }
    toast.success('Two-factor authentication is now on.');
    reset();
    router.refresh();
  }

  async function disable() {
    setBusy(true);
    const { error } = await authClient.twoFactor.disable({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? 'Could not disable 2FA');
      return;
    }
    toast.success('Two-factor authentication disabled.');
    reset();
    router.refresh();
  }

  if (enabled) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is <span className="font-medium text-foreground">on</span>.
        </p>
        {step !== 'password' ? (
          <Button variant="outline" onClick={() => setStep('password')}>
            Disable two-factor
          </Button>
        ) : (
          <div className="space-y-3">
            <Field>
              <FieldLabel htmlFor="disable-password">Confirm your password</FieldLabel>
              <Input
                id="disable-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={disable} disabled={busy || !password}>
                {busy ? 'Disabling…' : 'Disable'}
              </Button>
              <Button variant="ghost" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {required && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          Your role requires two-factor authentication. Set it up to continue.
        </p>
      )}

      {step === 'idle' && (
        <>
          <p className="text-sm text-muted-foreground">
            Add an authenticator app (Google Authenticator, 1Password, etc.) as a second factor.
          </p>
          <Button onClick={() => setStep('password')}>Enable two-factor</Button>
        </>
      )}

      {step === 'password' && (
        <div className="space-y-3">
          <Field>
            <FieldLabel htmlFor="enable-password">Confirm your password</FieldLabel>
            <Input
              id="enable-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FieldDescription>We ask for your password before changing security settings.</FieldDescription>
          </Field>
          <div className="flex gap-2">
            <Button onClick={startEnable} disabled={busy || !password}>
              {busy ? 'Starting…' : 'Continue'}
            </Button>
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">1. Scan this QR code</p>
            <div className="inline-block rounded-lg bg-white p-3">
              <QRCodeSVG value={totpUri} size={160} />
            </div>
            {secretFromUri(totpUri) && (
              <p className="mt-2 text-xs text-muted-foreground">
                Or enter this key manually:{' '}
                <code className="font-mono">{secretFromUri(totpUri)}</code>
              </p>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">2. Save your backup codes</p>
            <p className="mb-2 text-xs text-muted-foreground">
              Store these somewhere safe — each can be used once if you lose your device.
            </p>
            <div className="grid grid-cols-2 gap-1 rounded-md border p-3 font-mono text-sm">
              {backupCodes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="enable-code">3. Enter the 6-digit code to confirm</FieldLabel>
            <Input
              id="enable-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={confirmEnable} disabled={busy || code.length !== 6}>
              {busy ? 'Verifying…' : 'Verify & finish'}
            </Button>
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
