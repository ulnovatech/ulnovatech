/** Single listing object returned by Grok marketplace research prompts. */
export type RawGrokListing = {
  title: string;
  price: number;
  salesCount: number;
  lastUpdated: string;
  publishedDate: string;
  tags: string[];
  reviewCount: number;
  averageRating: number;
  url: string;
  sellerName?: string;
  topComplaints?: string[];
};

export type GrokResearchRequest = {
  platform: string;
  platformBaseUrl: string;
  category: string;
  limit: number;
  allowedDomain?: string;
};

export type GrokReviewsRequest = {
  platform: string;
  listingUrl: string;
  listingTitle?: string;
  limit?: number;
};
