import { isDevAuthEnabled } from '@agency/config/env';
import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

function clerkConfigured() {
  return !!(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export async function getOperatorId(): Promise<string | null> {
  if (clerkConfigured()) {
    const { userId } = await auth();
    if (userId) return userId;
  }

  if (isDevAuthEnabled()) {
    const h = await headers();
    return h.get('x-dev-user') ?? 'operator';
  }

  return null;
}

export async function requireAuth(): Promise<string> {
  const id = await getOperatorId();
  if (!id) throw new Error('Unauthorized');
  return id;
}

export function getAuthMode(): 'clerk' | 'dev_bypass' | 'none' {
  if (clerkConfigured()) return 'clerk';
  if (isDevAuthEnabled()) return 'dev_bypass';
  return 'none';
}
