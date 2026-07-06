import { platformSettings } from './service';

async function main() {
  const seeded = await platformSettings.seedDefaultsIfEmpty();
  console.log(seeded ? 'Platform settings seeded from defaults.' : 'Platform settings already exist — skipped.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
