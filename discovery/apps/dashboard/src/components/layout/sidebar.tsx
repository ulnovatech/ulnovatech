'use client';



import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { AuthStatus } from '@/components/auth/auth-status';

import { NAV_SECTIONS, PRODUCT } from '@/lib/product-copy';

import { cn } from '@/lib/utils';



function isNavActive(pathname: string, href: string): boolean {

  if (pathname === href) return true;

  if (href === '/intent' && pathname.startsWith('/intent/inbox')) return false;

  return pathname.startsWith(href + '/');

}



export function Sidebar() {

  const pathname = usePathname();



  return (

    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white min-h-screen p-4">

      <div className="mb-6">

        <h1 className="text-lg font-semibold text-slate-900">{PRODUCT.name}</h1>

        <p className="text-xs text-slate-500">{PRODUCT.edition}</p>

      </div>

      <nav className="space-y-5">

        {NAV_SECTIONS.map((section) => (

          <div key={section.label}>

            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">

              {section.label}

            </p>

            <div className="space-y-0.5">

              {section.items.map((item) => (

                <Link

                  key={item.href}

                  href={item.href}

                  className={cn(

                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',

                    isNavActive(pathname, item.href)

                      ? 'bg-brand-50 text-brand-700'

                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',

                  )}

                >

                  {item.label}

                </Link>

              ))}

            </div>

          </div>

        ))}

      </nav>

      <AuthStatus />

    </aside>

  );

}

