import { loadRootEnv } from '@agency/config/load-env';
import { hunterWorkerTick } from '../lib/hunter-worker';

loadRootEnv();

const POLL_MS = 3000;

async function loop() {
  console.log(`Hunter worker started — polling every ${POLL_MS}ms`);
  for (;;) {
    try {
      const worked = await hunterWorkerTick();
      if (!worked) await new Promise((r) => setTimeout(r, POLL_MS));
    } catch (err) {
      console.error('Hunter worker error:', err);
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

loop().catch((err) => {
  console.error(err);
  process.exit(1);
});
