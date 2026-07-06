import { config as loadDotenv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { withSentryConfig } from '@sentry/nextjs';

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
loadDotenv({ path: path.join(monorepoRoot, '.env'), override: false });

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: [
    '@agency/config',
    '@agency/geo',
    '@agency/database',
    '@agency/types',
    '@agency/validation',
    '@agency/scoring',
    '@agency/discovery',
    '@agency/intent',
    '@agency/intelligence',
    '@agency/qualification',
    '@agency/crm',
    '@agency/outreach',
    '@agency/proposal',
    '@agency/revenue',
    '@agency/ops',
    '@agency/integrations',
    '@agency/market-hunter',
  ],
  experimental: {
    serverComponentsExternalPackages: [
      'postgres',
      'playwright',
      'playwright-core',
      '@sentry/node',
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
