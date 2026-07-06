import { loadRootEnv } from '@agency/config/load-env';
import { workerTick } from '../lib/job-worker';

loadRootEnv();

const POLL_MS = 2000;

async function loop() {
  console.log(`Job worker started — polling every ${POLL_MS}ms (reclaim stale + heartbeat)`);
  for (;;) {
    try {
      const worked = await workerTick();
      if (!worked) await new Promise((r) => setTimeout(r, POLL_MS));
    } catch (err) {
      console.error('Worker error:', err);
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

loop().catch((err) => {
  console.error(err);
  process.exit(1);
});
