import { startApp } from './app.js';

async function main() {
  const app = await startApp();

  const shutdown = () => {
    app.close();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
