'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthStatus } from '@/components/auth/auth-status';
import { HUNTER_NAV, HUNTER_PRODUCT } from '@/lib/hunter-copy';
import { cn } from '@/lib/utils';

function isActive(pathname: string, href: string) {
  if (href === '/hunter') return pathname === '/hunter';
  return pathname.startsWith(href);
}

export function HunterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-hunter-950 via-slate-900 to-slate-950">
      <aside className="w-56 shrink-0 border-r border-amber-900/40 bg-hunter-950/80 backdrop-blur min-h-screen p-4 flex flex-col">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/80 mb-1">
            Separate product
          </p>
          <h1 className="text-lg font-semibold text-amber-50">{HUNTER_PRODUCT.name}</h1>
          <p className="text-xs text-amber-200/60">{HUNTER_PRODUCT.edition}</p>
        </div>

        <nav className="space-y-1 flex-1">
          {HUNTER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(pathname, item.href)
                  ? 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/30'
                  : 'text-amber-100/70 hover:bg-amber-500/10 hover:text-amber-50',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 pt-4 border-t border-amber-900/40 space-y-3">
          <Link
            href="/ops"
            className="block text-xs text-amber-200/50 hover:text-amber-100 transition-colors"
          >
            ← Back to Demand Capture
          </Link>
          <div className="[&_*]:text-amber-100/80 [&_*]:text-xs">
            <AuthStatus />
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 overflow-visible text-slate-100">{children}</main>
    </div>
  );
}
