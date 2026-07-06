import { BudgetGovernor } from '@agency/acquisition';
import { getAcquisitionModeLabel, getDiscoveryProviderStatus } from '@agency/discovery';
import { IntentService } from '@agency/intent';
import { platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const governor = new BudgetGovernor();

export async function GET() {
  await platformSettings.ensureLoaded();
  const sources = await getDiscoveryProviderStatus();
  const customHealth = await new IntentService().customScrapeHealth();
  const customSource = {
    name: 'reddit_custom',
    label: 'Reddit demand (custom scrape)',
    configured: customHealth.enabled,
    enabled: customHealth.enabled && customHealth.status !== 'degraded',
    reason:
      !customHealth.enabled
        ? 'Set CUSTOM_SCRAPE_ENABLED=true'
        : customHealth.status === 'degraded'
          ? 'Degraded — no successful poll in 3 days'
          : customHealth.status === 'healthy'
            ? undefined
            : 'Awaiting first poll',
    health: customHealth.status,
  };
  const allSources = [...sources, customSource];
  const active = allSources.filter((s) => s.configured && s.enabled);
  const budget = await governor.getSummary();
  const places = budget.find((b) => b.provider === 'google_places');
  const cse = budget.find((b) => b.provider === 'google_cse');
  const mode = getAcquisitionModeLabel();
  const searchQueriesPerRun = platformSettings.getRunSearchQueryLimit();

  let message: string | undefined;
  if (active.length === 0) {
    message =
      'No discovery sources active. Add Google Places, search credentials (CSE/Bing), Meta Graph token, or a CSV import file.';
  } else if (mode === 'economy' && !cse?.canSpend && !sources.find((s) => s.name === 'csv_import')?.configured) {
    message = 'Economy mode: CSE daily budget exhausted. Use CSV import or wait until tomorrow.';
  } else if (places && !places.canSpend && mode !== 'economy') {
    message = `Google Places monthly budget exhausted (${places.used}/${places.cap}). Public Search and CSV still available.`;
  }

  return NextResponse.json({
    sources: allSources,
    ready: active.length > 0,
    budget: {
      providers: budget,
      acquisitionMode: mode,
      searchQueriesPerRun,
    },
    message,
  });
}
