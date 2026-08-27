import { buildApp } from './app.js';
import { env } from './env.js';

async function main() {
  const config = env();
  const app = await buildApp(config);

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: config.PORT, host: config.HOST });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
