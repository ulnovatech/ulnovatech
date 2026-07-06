export type MergeContext = {
  name: string;
  business: string;
  city: string;
  website: string;
  email: string;
  phone: string;
  mapsUrl: string;
};

const TOKEN_PATTERN = /\{\{(name|business|city|website|email|phone|mapsUrl)\}\}/gi;

export function mergeTemplate(text: string, ctx: MergeContext): string {
  return text.replace(TOKEN_PATTERN, (_, key: string) => {
    const k = key.toLowerCase();
    if (k === 'mapsurl') return ctx.mapsUrl;
    return ctx[k as keyof MergeContext] ?? '';
  });
}

export function buildMergeContext(data: {
  businessName: string;
  canonicalName?: string | null;
  city?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  googleMapsUrl?: string | null;
  sourceUrl?: string | null;
}): MergeContext {
  const business = data.canonicalName?.trim() || data.businessName;
  const firstName = business.split(/\s+/)[0] ?? business;
  return {
    name: firstName,
    business,
    city: data.city?.trim() ?? '',
    website: data.website?.trim() ?? '',
    email: data.email?.trim() ?? '',
    phone: data.phone?.trim() ?? '',
    mapsUrl: data.googleMapsUrl?.trim() || data.sourceUrl?.trim() || '',
  };
}
