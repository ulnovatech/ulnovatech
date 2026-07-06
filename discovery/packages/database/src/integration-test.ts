/**
 * Guards and helpers for DB integration tests — never pollute the operator database.
 */

/** Country marker for all integration-test discovery runs (filtered from UI/API). */
export const INTEGRATION_TEST_COUNTRY = '__integration_test__';

/** Legacy fixture countries left by older tests — purged on wipe. */
export const LEGACY_TEST_FIXTURE_COUNTRIES = ['Testland', 'Failland', 'Acceptance'] as const;

export const TEST_FIXTURE_COUNTRIES = [
  INTEGRATION_TEST_COUNTRY,
  ...LEGACY_TEST_FIXTURE_COUNTRIES,
] as const;

export type TestFixtureCountry = (typeof TEST_FIXTURE_COUNTRIES)[number];

/** True when integration tests are allowed to write to the database. */
export function shouldRunIntegrationTests(): boolean {
  if (!process.env.DATABASE_URL?.trim()) return false;
  if (process.env.RUN_INTEGRATION_TESTS === 'true') return true;
  const url = process.env.DATABASE_URL.toLowerCase();
  return (
    url.includes('_test') ||
    url.includes('/test_') ||
    url.endsWith('/test') ||
    url.includes('agency_platform_test')
  );
}

export function integrationTestSkipMessage(label: string): string {
  return `skip ${label} — set RUN_INTEGRATION_TESTS=true (tests clean up) or use a *_test database`;
}

/** Discovery run row values for integration tests only. */
export function integrationDiscoveryRun(overrides: {
  city: string;
  industry?: string;
  status?: string;
  runProfile?: string;
}) {
  return {
    country: INTEGRATION_TEST_COUNTRY,
    city: overrides.city,
    industry: overrides.industry ?? '__integration__',
    status: overrides.status ?? 'pending',
    runProfile: overrides.runProfile,
  };
}

export function isTestFixtureCountry(country: string): boolean {
  return (TEST_FIXTURE_COUNTRIES as readonly string[]).includes(country);
}
