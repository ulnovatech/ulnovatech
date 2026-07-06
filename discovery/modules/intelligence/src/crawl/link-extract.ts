export interface ExtractedLink {
  href: string;
  text: string;
  ariaLabel?: string;
  titleAttr?: string;
  inNav: boolean;
  inFooter: boolean;
  inHeader: boolean;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function attrValue(tag: string, name: string): string | undefined {
  const re = new RegExp(`\\b${name}=["']([^"']*)["']`, 'i');
  return tag.match(re)?.[1]?.trim();
}

function extractAnchorsFromFragment(fragment: string): Array<{ href: string; text: string; ariaLabel?: string; titleAttr?: string }> {
  const links: Array<{ href: string; text: string; ariaLabel?: string; titleAttr?: string }> = [];
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of fragment.matchAll(pattern)) {
    const attrs = match[1] ?? '';
    const href = attrValue(attrs, 'href');
    if (!href) continue;
    links.push({
      href,
      text: stripHtml(match[2] ?? ''),
      ariaLabel: attrValue(attrs, 'aria-label'),
      titleAttr: attrValue(attrs, 'title'),
    });
  }
  return links;
}

function extractRegion(html: string, tag: string): string {
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const parts: string[] = [];
  for (const m of html.matchAll(pattern)) {
    parts.push(m[1]);
  }
  return parts.join('\n');
}

function linkKey(href: string, text: string): string {
  return `${href}::${text}`;
}

export function extractLinksWithContext(html: string): ExtractedLink[] {
  const navHtml = extractRegion(html, 'nav');
  const footerHtml = extractRegion(html, 'footer');
  const headerHtml = extractRegion(html, 'header');

  const navKeys = new Set(
    extractAnchorsFromFragment(navHtml).map((l) => linkKey(l.href, l.text)),
  );
  const footerKeys = new Set(
    extractAnchorsFromFragment(footerHtml).map((l) => linkKey(l.href, l.text)),
  );
  const headerKeys = new Set(
    extractAnchorsFromFragment(headerHtml).map((l) => linkKey(l.href, l.text)),
  );

  const byHref = new Map<string, ExtractedLink>();

  for (const link of extractAnchorsFromFragment(html)) {
    const key = linkKey(link.href, link.text);
    const existing = byHref.get(link.href);
    const entry: ExtractedLink = {
      href: link.href,
      text: link.text || existing?.text || '',
      ariaLabel: link.ariaLabel ?? existing?.ariaLabel,
      titleAttr: link.titleAttr ?? existing?.titleAttr,
      inNav: navKeys.has(key) || existing?.inNav || false,
      inFooter: footerKeys.has(key) || existing?.inFooter || false,
      inHeader: headerKeys.has(key) || existing?.inHeader || false,
    };
    if (link.text.length > (existing?.text.length ?? 0)) entry.text = link.text;
    byHref.set(link.href, entry);
  }

  return [...byHref.values()];
}
