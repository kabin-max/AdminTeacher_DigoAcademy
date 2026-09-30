import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Use from Client Components for Storage / Realtime /
 * PostgREST when needed. Auth for this app remains Better Auth — do not use
 * this client for sign-in/sign-out.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    );
  }

  return createBrowserClient(url, key);
}
