import { BudgetGovernor } from '@agency/acquisition';
import { logger } from '@agency/config';
import { platformSettings, type CrawlStatusValue } from '@agency/settings';
import { DomainRateLimiter } from './rate-limiter';
import { discoverExtraPageUrls } from './link-discovery';
import {
  auditInfrastructureHtml,
  emptyInfrastructureAudit,
  finalizeInfrastructureAudit,
  mergeInfrastructureAudits,
} from './infrastructure-audit';
import { mergePageData, parseHtmlPage, type ParsedPageData } from './parse-html';
import type { InfrastructureAudit } from '../bi/types';

export interface CrawlContext {
  runId?: string;
  accountId?: string;
  businessId?: string;
}

export interface CrawlResult {
  crawlStatus: CrawlStatusValue;
  hasWebsite: boolean;
  httpsEnabled: boolean | null;
  mobileFriendly: boolean | null;
  notes: string | null;
  extractedEmail?: string;
  extractedPhone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  socialUrls?: string[];
  linkInBioUrls?: string[];
  infrastructureAudit?: InfrastructureAudit;
  pagesFetched: number;
  pageUrls: string[];
  title?: string;
  metaDescription?: string;
}

function normalizeUrl(website: string): string {
  if (!/^https?:\/\//i.test(website)) return `https://${website}`;
  return website;
}

export class CrawlService {
  private governor = new BudgetGovernor();
  private limiter: DomainRateLimiter | null = null;
  private limiterMs = -1;

  private async getLimiter(): Promise<DomainRateLimiter> {
    await platformSettings.ensureLoaded();
    const { rateLimitMsPerDomain } = platformSettings.getCrawlSettings();
    if (!this.limiter || this.limiterMs !== rateLimitMsPerDomain) {
      this.limiter = new DomainRateLimiter(rateLimitMsPerDomain);
      this.limiterMs = rateLimitMsPerDomain;
    }
    return this.limiter;
  }

  async crawlWebsite(website: string | null | undefined, ctx: CrawlContext = {}): Promise<CrawlResult> {
    await platformSettings.ensureLoaded();
    const crawl = platformSettings.getCrawlSettings();

    if (!crawl.enabled) {
      return {
        crawlStatus: 'skipped',
        hasWebsite: !!website?.trim(),
        httpsEnabled: null,
        mobileFriendly: null,
        notes: 'Website crawl disabled in settings.',
        pagesFetched: 0,
        pageUrls: [],
      };
    }

    if (!website?.trim()) {
      return {
        crawlStatus: 'no_website',
        hasWebsite: false,
        httpsEnabled: null,
        mobileFriendly: null,
        notes: 'No website on record — high opportunity for web services.',
        pagesFetched: 0,
        pageUrls: [],
        infrastructureAudit: finalizeInfrastructureAudit(emptyInfrastructureAudit(), {
          crawled: false,
          hasWebsite: false,
        }),
      };
    }

    const homepageUrl = normalizeUrl(website.trim());
    const limiter = await this.getLimiter();
    const pageUrls: string[] = [homepageUrl];
    const parsedPages: ParsedPageData[] = [];
    const infrastructureAudits: InfrastructureAudit[] = [];
    const notes: string[] = [];
    let crawlStatus: CrawlStatusValue = 'ok';
    let httpsEnabled: boolean | null = homepageUrl.startsWith('https://');

    const homepage = await this.fetchPage(homepageUrl, limiter, crawl, ctx);
    if (!homepage.ok) {
      if (homepage.status === 403 || homepage.status === 401) {
        return {
          crawlStatus: 'blocked',
          hasWebsite: true,
          httpsEnabled,
          mobileFriendly: null,
          notes: 'Website blocks automated crawlers (HTTP ' + homepage.status + ').',
          pagesFetched: homepage.pagesFetched,
          pageUrls,
          infrastructureAudit: finalizeInfrastructureAudit(emptyInfrastructureAudit(), {
            crawled: false,
            crawlStatus: 'blocked',
            hasWebsite: true,
          }),
        };
      }
      return {
        crawlStatus: 'unreachable',
        hasWebsite: true,
        httpsEnabled,
        mobileFriendly: null,
        notes: homepage.error ?? 'Could not fetch website.',
        pagesFetched: homepage.pagesFetched,
        pageUrls,
        infrastructureAudit: finalizeInfrastructureAudit(emptyInfrastructureAudit(), {
          crawled: false,
          crawlStatus: 'unreachable',
          hasWebsite: true,
        }),
      };
    }

    if (homepage.budgetExhausted) {
      return {
        crawlStatus: 'budget_exhausted',
        hasWebsite: true,
        httpsEnabled: homepage.finalUrl?.startsWith('https://') ?? httpsEnabled,
        mobileFriendly: null,
        notes: 'Custom scrape daily budget exhausted.',
        pagesFetched: homepage.pagesFetched,
        pageUrls,
      };
    }

    httpsEnabled = homepage.finalUrl?.startsWith('https://') ?? httpsEnabled;
    parsedPages.push(parseHtmlPage(homepage.html!, homepageUrl));
    infrastructureAudits.push(auditInfrastructureHtml(homepage.html!, homepageUrl));

    const maxExtra = Math.max(0, crawl.maxPagesPerAccount - 1);
    const extras = discoverExtraPageUrls(homepage.html!, homepageUrl, {
      extraPaths: crawl.extraPaths,
      contactKeywords: crawl.contactLinkKeywords,
      aboutKeywords: crawl.aboutLinkKeywords,
      locales: platformSettings.getLocaleSettings(),
      maxExtra,
    });

    for (const extraUrl of extras) {
      if (pageUrls.includes(extraUrl)) continue;
      const page = await this.fetchPage(extraUrl, limiter, crawl, ctx);
      pageUrls.push(extraUrl);
      if (page.budgetExhausted) {
        crawlStatus = 'budget_exhausted';
        notes.push('Stopped early: custom scrape budget exhausted.');
        break;
      }
      if (page.ok && page.html) {
        parsedPages.push(parseHtmlPage(page.html, extraUrl));
        infrastructureAudits.push(auditInfrastructureHtml(page.html, extraUrl));
      }
    }

    const merged = mergePageData(parsedPages);
    const infrastructureAudit = finalizeInfrastructureAudit(
      mergeInfrastructureAudits(infrastructureAudits),
      { crawled: true, crawlStatus, hasWebsite: true },
    );
    if (!merged.mobileFriendly) notes.push('Missing viewport meta — likely not mobile-friendly.');
    if (httpsEnabled === false) notes.push('Site not served over HTTPS.');

    return {
      crawlStatus,
      hasWebsite: true,
      httpsEnabled,
      mobileFriendly: merged.mobileFriendly,
      notes: notes.length ? notes.join(' ') : null,
      extractedEmail: merged.email,
      extractedPhone: merged.phone,
      facebookUrl: merged.facebookUrl,
      instagramUrl: merged.instagramUrl,
      whatsappUrl: merged.whatsappUrl,
      tiktokUrl: merged.tiktokUrl,
      linkedinUrl: merged.linkedinUrl,
      youtubeUrl: merged.youtubeUrl,
      twitterUrl: merged.twitterUrl,
      socialUrls: merged.socialUrls,
      linkInBioUrls: merged.linkInBioUrls,
      infrastructureAudit,
      pagesFetched: pageUrls.length,
      pageUrls,
      title: merged.title,
      metaDescription: merged.metaDescription,
    };
  }

  private async fetchPage(
    url: string,
    limiter: DomainRateLimiter,
    crawl: ReturnType<typeof platformSettings.getCrawlSettings>,
    ctx: CrawlContext,
  ): Promise<{
    ok: boolean;
    html?: string;
    status?: number;
    error?: string;
    finalUrl?: string;
    budgetExhausted?: boolean;
    pagesFetched: number;
  }> {
    if (crawl.trackBudget && !(await this.governor.canSpend('custom_scrape', 1))) {
      return { ok: false, budgetExhausted: true, pagesFetched: 0 };
    }

    await limiter.waitForDomain(url);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), crawl.fetchTimeoutMs);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': crawl.userAgent },
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (crawl.trackBudget) {
        await this.governor.recordSpend({
          provider: 'custom_scrape',
          operation: 'crawl_page',
          units: 1,
          runId: ctx.runId,
          accountId: ctx.accountId,
        });
      }

      if (!res.ok) {
        return { ok: false, status: res.status, pagesFetched: 1 };
      }

      const html = await res.text();
      return { ok: true, html, finalUrl: res.url, pagesFetched: 1 };
    } catch (err) {
      logger.warn('Crawl fetch failed', { url, error: String(err) });
      return { ok: false, error: String(err), pagesFetched: 1 };
    }
  }
}
