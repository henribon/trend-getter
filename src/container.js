import { CollectionJob } from './application/collection-job.js';
import { SettingsService } from './application/settings-service.js';
import { TrendCollector } from './application/trend-collector.js';
import { readEnv } from './config/env.js';
import { openDatabase } from './infrastructure/database.js';
import { createLogger } from './infrastructure/logger.js';
import { createMatcher } from './infrastructure/matchers/matcher-factory.js';
import { createTrendProvider } from './infrastructure/providers/provider-factory.js';
import { RunRepository } from './infrastructure/run-repository.js';
import { SettingsRepository } from './infrastructure/settings-repository.js';

export async function createContainer(env = readEnv()) {
  const logger = createLogger();
  const database = openDatabase(env.databasePath);
  const settingsService = new SettingsService(new SettingsRepository(database));
  const runRepository = new RunRepository(database);
  const provider = createTrendProvider(env);
  const matcher = await createMatcher(env, logger);
  const collector = new TrendCollector({
    settingsService,
    provider,
    matcher,
    runRepository,
    historyLimit: env.historyLimit,
  });
  const job = new CollectionJob({ collector, logger });

  return {
    env,
    logger,
    settingsService,
    runRepository,
    provider,
    matcher,
    collector,
    job,
    close: () => database.close(),
  };
}
