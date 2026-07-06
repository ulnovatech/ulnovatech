import { loadRootEnv } from '@agency/config/load-env';
import { IntentService } from '@agency/intent';

loadRootEnv();

const intent = new IntentService();

intent
  .pollRssFeeds()
  .then((result) => {
    console.log('RSS poll complete:', result);
    process.exit(result.errors.length > 0 && result.created === 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
