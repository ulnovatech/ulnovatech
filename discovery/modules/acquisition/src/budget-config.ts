import { platformSettings } from '@agency/settings';
import type { BudgetCapConfig, BudgetProvider } from './types';

const PROVIDER_PERIOD: Record<BudgetProvider, 'monthly' | 'daily'> = {
  google_places: 'monthly',
  google_cse: 'daily',
  bing_search: 'daily',
  browser_automation: 'daily',
  custom_scrape: 'daily',
  meta_graph: 'daily',
  llm_narrative: 'daily',
};

const CAP_KEY: Record<BudgetProvider, keyof ReturnType<typeof platformSettings.getSync>['acquisition']['caps']> = {
  google_places: 'google_places',
  google_cse: 'google_cse',
  bing_search: 'bing_search',
  browser_automation: 'browser_automation',
  custom_scrape: 'custom_scrape',
  meta_graph: 'meta_graph',
  llm_narrative: 'llm_narrative',
};

export function getBudgetCaps(): BudgetCapConfig[] {
  const snap = platformSettings.getSync();
  return (Object.keys(PROVIDER_PERIOD) as BudgetProvider[]).map((provider) => ({
    provider,
    period: PROVIDER_PERIOD[provider],
    cap: snap.acquisition.caps[CAP_KEY[provider]],
  }));
}

export function getCapForProvider(provider: BudgetProvider): BudgetCapConfig {
  const caps = getBudgetCaps();
  const found = caps.find((c) => c.provider === provider);
  if (!found) throw new Error(`Unknown budget provider: ${provider}`);
  return found;
}

export function periodStart(period: 'monthly' | 'daily', now = new Date()): Date {
  if (period === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
