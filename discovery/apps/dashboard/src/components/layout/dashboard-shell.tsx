'use client';

import { usePathname } from 'next/navigation';
import { HunterShell } from '@/components/layout/hunter-shell';
import { Sidebar } from '@/components/layout/sidebar';

const AUTH_PREFIXES = ['/sign-in', '/sign-up'];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (pathname.startsWith('/hunter')) {
    return <HunterShell>{children}</HunterShell>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-visible">{children}</main>
    </div>
  );
}
