export type SignalClass = 'enrichment' | 'demand';

export type DemandSignalType =
  | 'job_post'
  | 'hiring'
  | 'help_request'
  | 'pain_signal'
  | 'public_request'
  | 'other';

export type PasteDemandInput = {
  sourceUrl: string;
  title: string;
  snippet?: string;
  signalType: DemandSignalType;
  city?: string;
  country?: string;
  businessId?: string;
  signalStrength?: number;
};

export type RssFeedItem = {
  title: string;
  link: string;
  snippet?: string;
};
