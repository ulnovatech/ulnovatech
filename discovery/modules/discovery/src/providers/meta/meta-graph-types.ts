export type MetaGraphSearchType = 'page' | 'place';

export interface MetaGraphLocation {
  city?: string;
  state?: string;
  country?: string;
  street?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
}

export interface MetaInstagramBusinessAccount {
  id: string;
  username?: string;
  name?: string;
  website?: string;
}

export interface MetaGraphPageResult {
  id: string;
  name?: string;
  link?: string;
  phone?: string;
  website?: string;
  category?: string;
  fan_count?: number;
  location?: MetaGraphLocation;
  instagram_business_account?: MetaInstagramBusinessAccount;
}

export interface MetaGraphPlaceResult {
  id: string;
  name?: string;
  link?: string;
  phone?: string;
  website?: string;
  category?: string;
  location?: MetaGraphLocation;
}

export interface MetaGraphPaging {
  cursors?: { before?: string; after?: string };
  next?: string;
}

export interface MetaGraphSearchResponse<T> {
  data?: T[];
  paging?: MetaGraphPaging;
  error?: MetaGraphErrorBody;
}

export interface MetaGraphErrorBody {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
}
