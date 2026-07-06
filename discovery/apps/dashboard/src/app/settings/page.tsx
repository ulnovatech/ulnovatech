'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { V1CharterPanel } from '@/components/settings/v1-charter-panel';
import { KpiTargetsPanel } from '@/components/settings/kpi-targets-panel';
import { PageHeader } from '@/components/layout/page-header';
import { PAGE_COPY } from '@/lib/product-copy';
import { GmailIntegrationsPanel } from '@/components/settings/gmail-integrations-panel';
import { MarketHunterSettingsPanel } from '@/components/settings/market-hunter-settings-panel';
import { SuppressionListPanel } from '@/components/settings/suppression-list-panel';
import {
  LocalePacksEditor,
  type LocaleSettings,
} from '@/components/settings/locale-packs-editor';

type AcquisitionSettings = {
  mode: 'economy' | 'standard' | 'boost';
  caps: Record<string, number>;
  searchLimits: { economy: number; standard: number; boost: number };
  metaGraphLimits: { economy: number; standard: number; boost: number };
  socialSearchLimits: { economy: number; standard: number; boost: number };
  placesTtlDays: number;
  places: {
    standardVerifyMaxPerRun: number;
    boostVerifyMaxPerRun: number;
    detailsTopN: number;
    detailsMinScore: number;
  };
};

type DiscoverySettings = {
  countries: string[];
  industries: string[];
  citiesByCountry: Record<string, string[]>;
  allCitiesLabel: string;
  defaults: { country: string; city: string; industry: string };
  csvImportPath: string;
};

type CredentialField = {
  key: string;
  label: string;
  envVar: string;
  configured: boolean;
  source: string;
  hint?: string;
  hasStoredValue: boolean;
};

type CrawlSettings = {
  enabled: boolean;
  maxPagesPerAccount: number;
  rateLimitMsPerDomain: number;
  fetchTimeoutMs: number;
  extraPaths: string[];
  contactLinkKeywords: string[];
  aboutLinkKeywords: string[];
  userAgent: string;
  trackBudget: boolean;
};

type IcpSettings = {
  requireWebsiteOpportunity: boolean;
  demandWeightMultiplier: number;
  minReachabilityForExport: 'low' | 'medium' | 'high';
};

type QualificationSettings = {
  requireContactForReview: boolean;
  minScoreDefault: number;
  icp: IcpSettings;
};

type CrmSettings = {
  followUpDaysAfterContact: number;
};

type SettingsResponse = {
  acquisition: AcquisitionSettings;
  discovery: DiscoverySettings;
  crawl: CrawlSettings;
  locales: LocaleSettings;
  qualification: QualificationSettings;
  crm: CrmSettings;
  credentials: CredentialField[];
};

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(items: string[]): string {
  return items.join('\n');
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [acquisition, setAcquisition] = useState<AcquisitionSettings | null>(null);
  const [discovery, setDiscovery] = useState<DiscoverySettings | null>(null);
  const [crawl, setCrawl] = useState<CrawlSettings | null>(null);
  const [locales, setLocales] = useState<LocaleSettings | null>(null);
  const [qualification, setQualification] = useState<QualificationSettings | null>(null);
  const [crm, setCrm] = useState<CrmSettings | null>(null);
  const [extraPathsText, setExtraPathsText] = useState('');
  const [contactKeywordsText, setContactKeywordsText] = useState('');
  const [aboutKeywordsText, setAboutKeywordsText] = useState('');
  const [credentials, setCredentials] = useState<CredentialField[]>([]);
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});

  const [countriesText, setCountriesText] = useState('');
  const [industriesText, setIndustriesText] = useState('');
  const [citiesCountry, setCitiesCountry] = useState('');
  const [citiesText, setCitiesText] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    const data = await api<SettingsResponse>('/api/settings');
    setAcquisition(data.acquisition);
    setDiscovery(data.discovery);
    setCrawl(data.crawl);
    setLocales(data.locales ?? { useBuiltinLexicon: true, packs: [] });
    setQualification(
      data.qualification ?? {
        requireContactForReview: true,
        minScoreDefault: 0,
        icp: {
          requireWebsiteOpportunity: true,
          demandWeightMultiplier: 1,
          minReachabilityForExport: 'low',
        },
      },
    );
    setCrm(data.crm ?? { followUpDaysAfterContact: 3 });
    setExtraPathsText(listToLines(data.crawl.extraPaths));
    setContactKeywordsText(listToLines(data.crawl.contactLinkKeywords ?? []));
    setAboutKeywordsText(listToLines(data.crawl.aboutLinkKeywords ?? []));
    setCredentials(data.credentials);
    setCredentialValues({});
    setCountriesText(listToLines(data.discovery.countries));
    setIndustriesText(listToLines(data.discovery.industries));
    const firstCountry = data.discovery.countries[0] ?? '';
    setCitiesCountry(firstCountry);
    setCitiesText(
      listToLines(data.discovery.citiesByCountry[firstCountry] ?? []),
    );
    setLoading(false);
  };

  useEffect(() => {
    load().catch((e) => {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!discovery || !citiesCountry) return;
    setCitiesText(listToLines(discovery.citiesByCountry[citiesCountry] ?? []));
  }, [citiesCountry, discovery]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acquisition || !discovery || !crawl || !locales || !qualification || !crm) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const citiesByCountry = { ...discovery.citiesByCountry };
    if (citiesCountry) {
      citiesByCountry[citiesCountry] = linesToList(citiesText);
    }

    const credPatch: Record<string, string> = {};
    for (const [key, value] of Object.entries(credentialValues)) {
      if (value.trim()) credPatch[key] = value.trim();
    }

    try {
      await api('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          acquisition,
          discovery: {
            ...discovery,
            countries: linesToList(countriesText),
            industries: linesToList(industriesText),
            citiesByCountry,
          },
          crawl: {
            ...crawl,
            extraPaths: linesToList(extraPathsText),
            contactLinkKeywords: linesToList(contactKeywordsText),
            aboutLinkKeywords: linesToList(aboutKeywordsText),
          },
          locales,
          qualification,
          crm,
          credentials: Object.keys(credPatch).length > 0 ? credPatch : undefined,
        }),
      });
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading settings…</p>;
  }

  if (!acquisition || !discovery || !crawl || !locales || !qualification || !crm) {
    return <p className="text-red-700">Settings could not be loaded.</p>;
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={PAGE_COPY.settings.title} description={PAGE_COPY.settings.description} />
      <p className="text-slate-600 text-sm mb-6 -mt-2">
        API keys are saved here (database). Use the single project <code className="text-xs">.env</code>{' '}
        at the repo root only for infrastructure (database URL, auth, caps) — not for discovery keys.
      </p>

      {error && (
        <p className="mb-4 text-red-700 text-sm bg-red-50 border border-red-200 rounded p-3">{error}</p>
      )}
      {saved && (
        <p className="mb-4 text-green-800 text-sm bg-green-50 border border-green-200 rounded p-3">
          Settings saved.
        </p>
      )}

      <V1CharterPanel />

      <div className="mb-8">
        <KpiTargetsPanel />
        <GmailIntegrationsPanel
          hasClientCredentials={
            credentials.some((c) => c.key === 'gmail_oauth_client_id' && c.configured) &&
            credentials.some((c) => c.key === 'gmail_oauth_client_secret' && c.configured)
          }
        />
        <div className="mt-4">
          <MarketHunterSettingsPanel />
        </div>
        <SuppressionListPanel />
      </div>

      <form onSubmit={save} className="space-y-8">
        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-900">Qualification &amp; review queue</h3>
          <p className="text-sm text-slate-600">
            Verified means email, phone, or Google Places confirmation. When enabled, the review
            queue defaults to verified prospects only.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={qualification.requireContactForReview}
              onChange={(e) =>
                setQualification({
                  ...qualification,
                  requireContactForReview: e.target.checked,
                })
              }
            />
            <span>
              <span className="text-slate-700 font-medium">Require contact for review (default filter)</span>
              <span className="block text-slate-500 text-xs mt-0.5">
                When on, API and review page default to verified-only unless you choose unverified or all.
              </span>
            </span>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Default minimum score (0 = none)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-32 border border-slate-300 rounded-md px-3 py-2"
              value={qualification.minScoreDefault}
              onChange={(e) =>
                setQualification({
                  ...qualification,
                  minScoreDefault: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </label>
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-sm font-medium text-slate-900">ICP scoring</h4>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={qualification.icp.requireWebsiteOpportunity}
                onChange={(e) =>
                  setQualification({
                    ...qualification,
                    icp: {
                      ...qualification.icp,
                      requireWebsiteOpportunity: e.target.checked,
                    },
                  })
                }
              />
              <span>
                <span className="text-slate-700 font-medium">No-website opportunity bonus</span>
                <span className="block text-slate-500 text-xs mt-0.5">
                  Web-agency ICP: boost businesses without a website. Turn off for other service
                  models.
                </span>
              </span>
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Demand signal weight multiplier</span>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                className="mt-1 w-32 border border-slate-300 rounded-md px-3 py-2"
                value={qualification.icp.demandWeightMultiplier}
                onChange={(e) =>
                  setQualification({
                    ...qualification,
                    icp: {
                      ...qualification.icp,
                      demandWeightMultiplier: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Minimum reachability (export + review)</span>
              <select
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={qualification.icp.minReachabilityForExport}
                onChange={(e) =>
                  setQualification({
                    ...qualification,
                    icp: {
                      ...qualification.icp,
                      minReachabilityForExport: e.target.value as IcpSettings['minReachabilityForExport'],
                    },
                  })
                }
              >
                <option value="low">Low and above (email or phone)</option>
                <option value="medium">Medium and above (valid email)</option>
                <option value="high">High only (email + phone or strong demand)</option>
              </select>
            </label>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-900">CRM &amp; follow-ups</h3>
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Follow-up days after contacted</span>
            <input
              type="number"
              min={1}
              max={90}
              className="mt-1 w-32 border border-slate-300 rounded-md px-3 py-2"
              value={crm.followUpDaysAfterContact}
              onChange={(e) =>
                setCrm({
                  ...crm,
                  followUpDaysAfterContact: parseInt(e.target.value, 10) || 3,
                })
              }
            />
          </label>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-900">Acquisition &amp; budget</h3>

          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Acquisition mode</span>
            <select
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
              value={acquisition.mode}
              onChange={(e) =>
                setAcquisition({
                  ...acquisition,
                  mode: e.target.value as AcquisitionSettings['mode'],
                })
              }
            >
              <option value="economy">Economy (search only, 5 queries/run)</option>
              <option value="standard">Standard (search + Places verify)</option>
              <option value="boost">Boost (search + Places verify, higher caps)</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {(
              [
                ['google_places', 'Google Places (monthly)'],
                ['google_cse', 'Google CSE (daily)'],
                ['bing_search', 'Bing Search (daily)'],
                ['browser_automation', 'Browser automation (daily)'],
                ['custom_scrape', 'Custom scrape (daily)'],
                ['meta_graph', 'Meta Graph (daily)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-slate-700">{label}</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={acquisition.caps[key]}
                  onChange={(e) =>
                    setAcquisition({
                      ...acquisition,
                      caps: { ...acquisition.caps, [key]: parseInt(e.target.value, 10) || 0 },
                    })
                  }
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            {(['economy', 'standard', 'boost'] as const).map((mode) => (
              <label key={`search-${mode}`} className="block">
                <span className="text-slate-700 capitalize">{mode} search queries/run</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={acquisition.searchLimits[mode]}
                  onChange={(e) =>
                    setAcquisition({
                      ...acquisition,
                      searchLimits: {
                        ...acquisition.searchLimits,
                        [mode]: parseInt(e.target.value, 10) || 1,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            {(['economy', 'standard', 'boost'] as const).map((mode) => (
              <label key={`meta-${mode}`} className="block">
                <span className="text-slate-700 capitalize">{mode} Meta Graph queries/run</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={acquisition.metaGraphLimits[mode]}
                  onChange={(e) =>
                    setAcquisition({
                      ...acquisition,
                      metaGraphLimits: {
                        ...acquisition.metaGraphLimits,
                        [mode]: parseInt(e.target.value, 10) || 1,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            {(['economy', 'standard', 'boost'] as const).map((mode) => (
              <label key={`social-${mode}`} className="block">
                <span className="text-slate-700 capitalize">{mode} social search queries/run</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={acquisition.socialSearchLimits[mode]}
                  onChange={(e) =>
                    setAcquisition({
                      ...acquisition,
                      socialSearchLimits: {
                        ...acquisition.socialSearchLimits,
                        [mode]: parseInt(e.target.value, 10) || 1,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>

          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Places cache TTL (days)</span>
            <input
              type="number"
              min={1}
              className="mt-1 w-32 border border-slate-300 rounded-md px-3 py-2"
              value={acquisition.placesTtlDays}
              onChange={(e) =>
                setAcquisition({
                  ...acquisition,
                  placesTtlDays: parseInt(e.target.value, 10) || 90,
                })
              }
            />
          </label>

          <div className="pt-3 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-800 mb-3">Places verify &amp; details (per run)</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="block">
                <span className="text-slate-700">Standard verify max (Text Search)</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={acquisition.places?.standardVerifyMaxPerRun ?? 10}
                  onChange={(e) =>
                    setAcquisition({
                      ...acquisition,
                      places: {
                        ...acquisition.places,
                        standardVerifyMaxPerRun: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="text-slate-700">Boost verify max (Text Search)</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={acquisition.places?.boostVerifyMaxPerRun ?? 50}
                  onChange={(e) =>
                    setAcquisition({
                      ...acquisition,
                      places: {
                        ...acquisition.places,
                        boostVerifyMaxPerRun: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="text-slate-700">Details top N (after scoring)</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={acquisition.places?.detailsTopN ?? 20}
                  onChange={(e) =>
                    setAcquisition({
                      ...acquisition,
                      places: {
                        ...acquisition.places,
                        detailsTopN: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="text-slate-700">Details min score</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={acquisition.places?.detailsMinScore ?? 25}
                  onChange={(e) =>
                    setAcquisition({
                      ...acquisition,
                      places: {
                        ...acquisition.places,
                        detailsMinScore: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </label>
            </div>
          </div>
        </section>

        <LocalePacksEditor locales={locales} onChange={setLocales} />

        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-900">Website crawl (Tier 3)</h3>
          <p className="text-sm text-slate-600">
            Link discovery uses intent scoring (nav/footer links, multilingual tokens, anchor text) —
            keyword lists below extend the built-in lexicon, not replace it.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={crawl.enabled}
              onChange={(e) => setCrawl({ ...crawl, enabled: e.target.checked })}
            />
            <span className="text-slate-700">Enable deep website crawl after discovery</span>
          </label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block">
              <span className="text-slate-700">Max pages per account</span>
              <input
                type="number"
                min={1}
                max={10}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={crawl.maxPagesPerAccount}
                onChange={(e) =>
                  setCrawl({ ...crawl, maxPagesPerAccount: parseInt(e.target.value, 10) || 1 })
                }
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Rate limit (ms per domain)</span>
              <input
                type="number"
                min={0}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={crawl.rateLimitMsPerDomain}
                onChange={(e) =>
                  setCrawl({ ...crawl, rateLimitMsPerDomain: parseInt(e.target.value, 10) || 0 })
                }
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Fetch timeout (ms)</span>
              <input
                type="number"
                min={1000}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={crawl.fetchTimeoutMs}
                onChange={(e) =>
                  setCrawl({ ...crawl, fetchTimeoutMs: parseInt(e.target.value, 10) || 8000 })
                }
              />
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={crawl.trackBudget}
                onChange={(e) => setCrawl({ ...crawl, trackBudget: e.target.checked })}
              />
              <span className="text-slate-700 text-sm">Track against custom_scrape daily budget</span>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Fallback paths (one per line)</span>
            <p className="text-xs text-slate-500 mt-0.5">
              Only probed when smart link scoring finds few matches — optional safety net
            </p>
            <textarea
              rows={4}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={extraPathsText}
              onChange={(e) => setExtraPathsText(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Extra contact intent keywords</span>
            <p className="text-xs text-slate-500 mt-0.5">
              Boost scores for your markets/languages — e.g. wasiliana, contacter, ubicacion
            </p>
            <textarea
              rows={4}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={contactKeywordsText}
              onChange={(e) => setContactKeywordsText(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Extra about intent keywords</span>
            <textarea
              rows={3}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={aboutKeywordsText}
              onChange={(e) => setAboutKeywordsText(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">User-Agent</span>
            <input
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={crawl.userAgent}
              onChange={(e) => setCrawl({ ...crawl, userAgent: e.target.value })}
            />
          </label>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-900">API credentials</h3>
          <p className="text-sm text-slate-600">
            Leave blank to keep existing stored values. Set env vars to override without storing in
            the database. Market Hunter keys (OpenRouter, xAI, Anthropic) are configured in the Live
            Market Hunter panel above.
          </p>
          {credentials
            .filter(
              (c) =>
                !['openrouter_api_key', 'xai_grok_api_key', 'anthropic_api_key'].includes(c.key),
            )
            .map((c) => (
            <label key={c.key} className="block text-sm">
              <span className="text-slate-700 font-medium">{c.label}</span>
              <span className="ml-2 text-xs text-slate-500">
                {c.configured
                  ? c.source === 'env'
                    ? `(active via ${c.envVar})`
                    : '(stored in database)'
                  : '(not configured)'}
              </span>
              <input
                type="password"
                autoComplete="off"
                placeholder={c.hasStoredValue ? '••••••••  (leave blank to keep)' : `Enter ${c.envVar}`}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
                value={credentialValues[c.key] ?? ''}
                onChange={(e) =>
                  setCredentialValues({ ...credentialValues, [c.key]: e.target.value })
                }
              />
            </label>
          ))}
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-900">Discovery form options</h3>

          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Countries (one per line)</span>
            <textarea
              rows={6}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={countriesText}
              onChange={(e) => setCountriesText(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Industries (one per line)</span>
            <textarea
              rows={6}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={industriesText}
              onChange={(e) => setIndustriesText(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Edit cities for country</span>
              <select
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={citiesCountry}
                onChange={(e) => {
                  const next = e.target.value;
                  if (citiesCountry && discovery) {
                    const updated = {
                      ...discovery,
                      citiesByCountry: {
                        ...discovery.citiesByCountry,
                        [citiesCountry]: linesToList(citiesText),
                      },
                    };
                    setDiscovery(updated);
                  }
                  setCitiesCountry(next);
                }}
              >
                {linesToList(countriesText).map((c) => {
                  const cityCount = discovery.citiesByCountry[c]?.length ?? 0;
                  return (
                    <option key={c} value={c}>
                      {c} ({cityCount} {cityCount === 1 ? 'city' : 'cities'})
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">&quot;All cities&quot; label</span>
              <input
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={discovery.allCitiesLabel}
                onChange={(e) =>
                  setDiscovery({ ...discovery, allCitiesLabel: e.target.value })
                }
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-slate-700 font-medium">
              Cities for {citiesCountry}{' '}
              <span className="text-slate-500 font-normal">
                ({discovery.citiesByCountry[citiesCountry]?.length ?? 0} cities)
              </span>
            </span>
            <textarea
              rows={5}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={citiesText}
              onChange={(e) => setCitiesText(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <label className="block">
              <span className="text-slate-700">Default country</span>
              <input
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={discovery.defaults.country}
                onChange={(e) =>
                  setDiscovery({
                    ...discovery,
                    defaults: { ...discovery.defaults, country: e.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Default city</span>
              <input
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={discovery.defaults.city}
                onChange={(e) =>
                  setDiscovery({
                    ...discovery,
                    defaults: { ...discovery.defaults, city: e.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Default industry</span>
              <input
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                value={discovery.defaults.industry}
                onChange={(e) =>
                  setDiscovery({
                    ...discovery,
                    defaults: { ...discovery.defaults, industry: e.target.value },
                  })
                }
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-slate-700 font-medium">CSV import path</span>
            <input
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={discovery.csvImportPath}
              onChange={(e) =>
                setDiscovery({ ...discovery, csvImportPath: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-slate-500">
              Upload your lead file on the{' '}
              <a href="/discovery" className="text-brand-600 hover:underline">
                Discovery
              </a>{' '}
              page — files are saved to this path.
            </p>
          </label>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="bg-brand-600 text-white rounded-md px-6 py-2 font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
