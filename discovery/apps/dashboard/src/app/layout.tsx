import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/auth/app-providers';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Demand Capture — Web Agency',
  description: 'Find website opportunities and demand, pursue honestly, close revenue',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <DashboardShell>{children}</DashboardShell>
        </AppProviders>
      </body>
    </html>
  );
}
