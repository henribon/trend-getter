import { createContainer } from './container.js';
import { RUN_STATUS } from './domain/run.js';

async function collectOnce() {
  const container = await createContainer();
  try {
    const run = await container.job.run('linha de comando');
    process.exitCode = run.status === RUN_STATUS.success ? 0 : 1;
  } catch (error) {
    container.logger.error(error.message);
    process.exitCode = 1;
  } finally {
    container.close();
  }
}

collectOnce().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
