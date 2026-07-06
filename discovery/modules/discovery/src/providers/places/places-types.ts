export interface PlacesTextSearchResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  addressComponents?: Array<{ longText?: string; types?: string[] }>;
  businessStatus?: string;
}

export interface PlacesTextSearchResponse {
  places?: PlacesTextSearchResult[];
  nextPageToken?: string;
}

export interface PlacesDetailsResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: Array<{
    text?: { text?: string };
    rating?: number;
    publishTime?: string;
  }>;
}
