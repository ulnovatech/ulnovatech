'use client';

import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';

export function AuthStatus() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;

  return (
    <div className="mt-8 pt-4 border-t border-slate-200">
      <Show when="signed-out">
        <Link
          href="/sign-in"
          className="block w-full rounded-md px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          Sign in
        </Link>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-2 px-2">
          <UserButton />
          <span className="text-xs text-slate-500">Signed in</span>
        </div>
      </Show>
    </div>
  );
}
