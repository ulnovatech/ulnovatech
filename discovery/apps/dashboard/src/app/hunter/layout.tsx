import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Market Hunter — Demand Capture',
  description: 'Product gap scans and build-ready action cards',
};

export default function HunterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
