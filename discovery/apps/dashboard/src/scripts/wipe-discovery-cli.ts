import { loadRootEnv } from '@agency/config/load-env';
import { closeDb } from '@agency/database';
import { DiscoveryService } from '@agency/discovery';

loadRootEnv();

async function main() {
  const discovery = new DiscoveryService();
  const fixtures = await discovery.purgeTestFixtureRuns();
  console.log(`Purged test fixture runs: ${fixtures.runs} run(s), ${fixtures.orphanSignals} signal(s)`);

  const wiped = await discovery.wipeAllRuns();
  console.log(`Wiped all discovery runs: ${wiped.runs} run(s), ${wiped.orphanSignals} signal(s)`);

  await closeDb();
  console.log('Database ready for real discovery runs.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
