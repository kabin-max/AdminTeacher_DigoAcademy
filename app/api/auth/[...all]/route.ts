import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth';

// Better Auth mounts all of its endpoints under /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth);
