import { platformSettings } from '../service';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`ok ${name}`);
  } else {
    failed++;
    console.error(`fail ${name}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('skip settings integration tests (DATABASE_URL not set)');
    process.exit(0);
  }

  await platformSettings.ensureLoaded();
  const beforeMode = platformSettings.getAcquisitionMode();
  const beforeIndustries = [...platformSettings.getSync().discovery.industries];

  await platformSettings.updateAcquisition({ mode: 'boost' });
  assert(platformSettings.getAcquisitionMode() === 'boost', 'updates acquisition mode');

  await platformSettings.updateDiscovery({
    industries: [...beforeIndustries, 'Settings Test Industry'],
  });
  assert(
    platformSettings.getSync().discovery.industries.includes('Settings Test Industry'),
    'updates industries',
  );

  await platformSettings.updateAcquisition({ mode: beforeMode });
  await platformSettings.updateDiscovery({ industries: beforeIndustries });

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
