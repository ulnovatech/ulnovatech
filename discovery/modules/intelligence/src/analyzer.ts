import { CrawlService, type CrawlContext, type CrawlResult } from './crawl/crawl-service';

export type AnalysisResult = CrawlResult;

const crawlService = new CrawlService();

export async function analyzeWebsite(
  website: string | null,
  ctx: CrawlContext = {},
): Promise<AnalysisResult> {
  return crawlService.crawlWebsite(website, ctx);
}
