import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await buildApp({ config });

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(
    { billing: config.BILLING_PROVIDER, mockScreenTime: config.FOCUSFAMILY_USE_MOCK === '1' },
    'FocusFamily API ready',
  );
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
