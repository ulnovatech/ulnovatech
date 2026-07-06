import { loadRootEnv } from '@agency/config/load-env';
import { IntentService } from '@agency/intent';

loadRootEnv();

const intent = new IntentService();

intent
  .pollCustomScrape()
  .then((result) => {
    console.log('Custom scrape poll complete:', result);
    if ('skipped' in result && result.skipped) process.exit(0);
    process.exit(result.errors?.length > 0 && result.created === 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
