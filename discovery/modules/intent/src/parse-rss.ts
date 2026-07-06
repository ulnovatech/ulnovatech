import type { RssFeedItem } from './types';

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

function tagValue(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = block.match(re);
  return m ? decodeXml(m[1]) : undefined;
}

function atomLink(block: string): string | undefined {
  const href = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  return href?.[1];
}

/** Lightweight RSS 2.0 / Atom parser — no external XML deps */
export function parseRssXml(xml: string): RssFeedItem[] {
  const items: RssFeedItem[] = [];

  if (/<feed[\s>]/i.test(xml)) {
    const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
    for (const entry of entries) {
      const title = tagValue(entry, 'title');
      const link = atomLink(entry) ?? tagValue(entry, 'id');
      const snippet = tagValue(entry, 'summary') ?? tagValue(entry, 'content');
      if (title && link) items.push({ title, link, snippet });
    }
    return items;
  }

  const rssItems = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const item of rssItems) {
    const title = tagValue(item, 'title');
    const link = tagValue(item, 'link');
    const snippet = tagValue(item, 'description');
    if (title && link) items.push({ title, link, snippet });
  }

  return items;
}
