import { loadRootEnv } from '@agency/config/load-env';
import { closeDb } from '@agency/database';
import { CITIES_BY_COUNTRY, COUNTRIES } from '@agency/geo';
import { platformSettings } from '@agency/settings';

loadRootEnv();

async function main() {
  await platformSettings.ensureLoaded();

  const citiesByCountry: Record<string, string[]> = {};
  let totalCities = 0;
  let countriesWithCities = 0;
  const sparse: string[] = [];

  for (const country of COUNTRIES) {
    const cities = [...(CITIES_BY_COUNTRY[country] ?? [])];
    citiesByCountry[country] = cities;
    totalCities += cities.length;
    if (cities.length > 0) countriesWithCities++;
    if (cities.length > 0 && cities.length < 15) {
      sparse.push(`${country} (${cities.length})`);
    }
  }

  const ugandaBefore = platformSettings.specificCitiesForCountry('Uganda').length;
  await platformSettings.updateDiscovery({ citiesByCountry });
  await platformSettings.ensureLoaded();
  const ugandaAfter = platformSettings.specificCitiesForCountry('Uganda');

  console.log(`Synced citiesByCountry for ${COUNTRIES.length} countries.`);
  console.log(`  Countries with cities: ${countriesWithCities}`);
  console.log(`  Total city entries: ${totalCities}`);
  console.log(`  Uganda: ${ugandaBefore} → ${ugandaAfter.length} cities`);
  if (ugandaAfter.length > 0) {
    console.log(`  Uganda sample: ${ugandaAfter.slice(0, 5).join(', ')}…`);
  }
  if (sparse.length) {
    console.log(`  Fewer than 15 cities: ${sparse.length} countries`);
  }

  await closeDb();
  console.log('Done — restart dev server or reload discovery options to see cities in the UI.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
