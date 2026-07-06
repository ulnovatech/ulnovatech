import type { CustomDemandItem } from './types';

const USER_AGENT = 'AgencyPlatformBot/1.0 (+custom-scrape; demand-only)';

type RedditListing = {
  data?: {
    children?: Array<{
      data?: {
        title?: string;
        selftext?: string;
        permalink?: string;
        url?: string;
        id?: string;
      };
    }>;
  };
};

function inferSignalType(text: string): CustomDemandItem['signalType'] {
  const lower = text.toLowerCase();
  if (/\b(hiring|vacancy|job opening|we're looking for)\b/.test(lower)) return 'hiring';
  if (/\b(job|position|role|freelance|contract)\b/.test(lower)) return 'job_post';
  if (/\b(need|looking for|seeking|help|website|web design|developer)\b/.test(lower)) {
    return 'help_request';
  }
  return 'public_request';
}

export function parseRedditListing(json: RedditListing): CustomDemandItem[] {
  const children = json.data?.children ?? [];
  const items: CustomDemandItem[] = [];

  for (const child of children) {
    const post = child.data;
    if (!post?.permalink || !post.title?.trim()) continue;

    const sourceUrl = post.permalink.startsWith('http')
      ? post.permalink
      : `https://www.reddit.com${post.permalink}`;

    const snippet = post.selftext?.trim().slice(0, 500) || undefined;
    const text = `${post.title} ${snippet ?? ''}`;

    items.push({
      sourceUrl,
      title: post.title.trim(),
      snippet,
      signalType: inferSignalType(text),
    });
  }

  return items;
}

export class RedditIntentProvider {
  readonly name = 'reddit_intent' as const;
  readonly label = 'Reddit demand (public JSON)';

  async fetchSubreddit(subreddit: string, limit = 25): Promise<CustomDemandItem[]> {
    const sub = subreddit.replace(/^r\//i, '').trim();
    if (!sub) return [];

    const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/new.json?limit=${Math.min(limit, 25)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`Reddit HTTP ${res.status} for r/${sub}`);
    }

    const json = (await res.json()) as RedditListing;
    return parseRedditListing(json);
  }
}
