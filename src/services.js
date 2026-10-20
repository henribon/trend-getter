import { CollectionJob } from './application/collection-job.js';
import { SettingsService } from './application/settings-service.js';
import { TrendCollector } from './application/trend-collector.js';
import { createMatcher } from './infrastructure/matchers/matcher-factory.js';
import { createTrendProvider } from './infrastructure/providers/provider-factory.js';

export async function createServices({ env, logger, settingsRepository, runRepository }) {
  const settingsService = new SettingsService(settingsRepository);
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
  return { settingsService, runRepository, provider, matcher, collector, job };
}
