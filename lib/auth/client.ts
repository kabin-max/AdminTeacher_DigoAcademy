import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/**
 * Browser-side auth client. Base URL defaults to the current origin, so it talks
 * to our /api/auth/* handler. Import from client components only.
 */
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
