/// <reference path="../playwright-shim.d.ts" />
import { BudgetGovernor } from '@agency/acquisition';
import { BROWSER_SESSION_TIMEOUT_MS, isBrowserAutomationEnabled, logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { CrawlContext } from '../crawl/crawl-service';
import { discoverExtraPageUrls } from '../crawl/link-discovery';
import { mergePageData, parseHtmlPage } from '../crawl/parse-html';

export type BrowserExtractResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  extractedEmail?: string;
  extractedPhone?: string;
  pagesFetched: number;
  pageUrls: string[];
};

type PlaywrightModule = {
  chromium: {
    launch: (opts: { headless: boolean }) => Promise<{
      newPage: () => Promise<{
        goto: (url: string, opts: { waitUntil: string; timeout: number }) => Promise<void>;
        content: () => Promise<string>;
        close: () => Promise<void>;
      }>;
      close: () => Promise<void>;
    }>;
  };
};

async function loadPlaywright(): Promise<PlaywrightModule | null> {
  try {
    return (await import(/* webpackIgnore: true */ 'playwright')) as PlaywrightModule;
  } catch {
    return null;
  }
}

function normalizeUrl(website: string): string {
  if (!/^https?:\/\//i.test(website)) return `https://${website}`;
  return website;
}

export class BrowserCrawlService {
  private governor = new BudgetGovernor();

  isEnabled(): boolean {
    return isBrowserAutomationEnabled();
  }

  async extractContacts(
    website: string | null | undefined,
    ctx: CrawlContext = {},
  ): Promise<BrowserExtractResult> {
    if (!this.isEnabled()) {
      return { ok: false, skipped: true, reason: 'browser_disabled', pagesFetched: 0, pageUrls: [] };
    }

    if (!website?.trim()) {
      return { ok: false, skipped: true, reason: 'no_website', pagesFetched: 0, pageUrls: [] };
    }

    if (!(await this.governor.canSpend('browser_automation', 1))) {
      return {
        ok: false,
        skipped: true,
        reason: 'budget_exhausted',
        pagesFetched: 0,
        pageUrls: [],
      };
    }

    const playwright = await loadPlaywright();
    if (!playwright) {
      logger.warn('Playwright not installed — browser automation skipped');
      return {
        ok: false,
        skipped: true,
        reason: 'playwright_unavailable',
        pagesFetched: 0,
        pageUrls: [],
      };
    }

    const homepageUrl = normalizeUrl(website.trim());
    const pageUrls: string[] = [homepageUrl];
    const parsedPages = [];

    try {
      const browser = await playwright.chromium.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.goto(homepageUrl, {
          waitUntil: 'domcontentloaded',
          timeout: BROWSER_SESSION_TIMEOUT_MS,
        });
        const homepageHtml = await page.content();
        parsedPages.push(parseHtmlPage(homepageHtml, homepageUrl));

        await platformSettings.ensureLoaded();
        const crawl = platformSettings.getCrawlSettings();
        const extras = discoverExtraPageUrls(homepageHtml, homepageUrl, {
          extraPaths: crawl.extraPaths,
          contactKeywords: crawl.contactLinkKeywords,
          aboutKeywords: crawl.aboutLinkKeywords,
          locales: platformSettings.getLocaleSettings(),
          maxExtra: 1,
        });

        for (const extraUrl of extras.slice(0, 1)) {
          if (pageUrls.includes(extraUrl)) continue;
          pageUrls.push(extraUrl);
          await page.goto(extraUrl, {
            waitUntil: 'domcontentloaded',
            timeout: BROWSER_SESSION_TIMEOUT_MS,
          });
          parsedPages.push(parseHtmlPage(await page.content(), extraUrl));
        }
        await page.close();
      } finally {
        await browser.close();
      }

      await this.governor.recordSpend({
        provider: 'browser_automation',
        operation: 'browser_session',
        units: 1,
        runId: ctx.runId,
        accountId: ctx.accountId,
      });

      const merged = mergePageData(parsedPages);
      return {
        ok: !!(merged.email || merged.phone),
        extractedEmail: merged.email,
        extractedPhone: merged.phone,
        pagesFetched: pageUrls.length,
        pageUrls,
      };
    } catch (err) {
      logger.warn('Browser crawl failed', { url: homepageUrl, error: String(err) });
      return {
        ok: false,
        reason: String(err),
        pagesFetched: pageUrls.length,
        pageUrls,
      };
    }
  }
}
