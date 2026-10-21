import { APP_MODE, describeAppState } from './application/app-state.js';
import { buildGithubLinks } from './application/github-links.js';
import { describeSkippedCollection, shouldCollectForSite } from './application/site-collection-policy.js';
import { readEnv } from './config/env.js';
import { CONFIG_FILE_NAME, CONFIG_FILE_PATH, PUBLIC_DIR } from './config/paths.js';
import { readSiteEnv, WORKFLOW_FILE_NAME } from './config/site-env.js';
import { nextOccurrence } from './domain/schedule.js';
import { ConfigFileSettingsRepository } from './infrastructure/config-file-settings-repository.js';
import { createLogger } from './infrastructure/logger.js';
import { MemoryRunRepository } from './infrastructure/memory-run-repository.js';
import { fetchPublishedSite } from './infrastructure/site/published-site.js';
import { writeStaticSite } from './infrastructure/site/static-site-writer.js';
import { createServices } from './services.js';

function describeSchedule(env) {
  return {
    automatic: env.autoSearch,
    times: env.autoSearch ? env.scheduleTimes.map(({ label }) => label) : [],
    nextRunAt: env.autoSearch ? nextOccurrence(env.scheduleTimes, new Date()) : null,
  };
}

async function buildSite() {
  const env = readEnv();
  const site = readSiteEnv();
  const logger = createLogger();
  const published = await fetchPublishedSite(site.siteUrl);
  const { settingsService, runRepository, provider, matcher, job } = await createServices({
    env,
    logger,
    settingsRepository: new ConfigFileSettingsRepository(CONFIG_FILE_PATH),
    runRepository: new MemoryRunRepository(published.runs),
  });

  const settings = settingsService.get();
  const decision = { settings, trigger: site.trigger, autoSearch: env.autoSearch, configFileName: CONFIG_FILE_NAME };
  if (shouldCollectForSite(decision)) {
    await job.run('GitHub Actions');
  } else {
    logger.info(describeSkippedCollection(decision));
  }

  await writeStaticSite({
    sourceDir: PUBLIC_DIR,
    outputDir: site.outputDir,
    runs: runRepository.list(env.historyLimit),
    state: describeAppState({
      mode: APP_MODE.static,
      settings,
      schedule: describeSchedule(env),
      collecting: false,
      provider,
      matcher,
      links: buildGithubLinks({ ...site, workflowFile: WORKFLOW_FILE_NAME, configFile: CONFIG_FILE_NAME }),
    }),
  });
  logger.info(`Site gerado em ${site.outputDir}.`);
}

buildSite().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
