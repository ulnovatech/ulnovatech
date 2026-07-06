import { AccountRepository, AccountService } from '@agency/accounts';



/**

 * Returns false when a Places API lookup should be skipped (fresh cached data).

 */

export async function shouldSpendPlacesLookup(placesId: string): Promise<boolean> {

  const repo = new AccountRepository();

  const service = new AccountService();



  let existing = await repo.findBySourceExternalId('google_maps', placesId);

  if (!existing) {

    existing = await repo.findByPlacesExternalId(placesId);

  }

  if (!existing) return true;

  return service.shouldRefreshPlaces(existing);

}



/** @deprecated Use shouldSpendPlacesLookup */

export async function shouldFetchPlaceExternalId(externalId: string): Promise<boolean> {

  return shouldSpendPlacesLookup(externalId);

}


