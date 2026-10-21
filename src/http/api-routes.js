import { APP_MODE, describeAppState } from '../application/app-state.js';
import { readJson, sendJson } from './responses.js';

const DEFAULT_RUNS_LIMIT = 20;
const MAX_RUNS_LIMIT = 60;

export function registerApiRoutes(router, { settingsService, collector, job, runRepository, scheduler, provider, matcher }) {
  const describeState = () =>
    describeAppState({
      mode: APP_MODE.server,
      settings: settingsService.get(),
      schedule: { automatic: scheduler.isAutomatic, times: scheduler.times, nextRunAt: scheduler.nextRunAt },
      collecting: collector.isCollecting,
      provider,
      matcher,
    });

  router
    .on('GET', '/api/state', ({ response }) => sendJson(response, 200, describeState()))
    .on('PUT', '/api/settings', async ({ request, response }) => {
      const { settings, isFirstSetup } = settingsService.save(await readJson(request));
      if (isFirstSetup && scheduler.isAutomatic) {
        job.runSafely('configuração inicial');
      }
      sendJson(response, 200, { settings });
    })
    .on('GET', '/api/runs', ({ response, url }) => {
      sendJson(response, 200, { runs: runRepository.list(readLimit(url)) });
    })
    .on('POST', '/api/runs', async ({ response }) => {
      sendJson(response, 201, { run: await job.run('manual') });
    });
}

function readLimit(url) {
  const requested = Number.parseInt(url.searchParams.get('limit'), 10);
  return Number.isInteger(requested) ? Math.min(Math.max(requested, 1), MAX_RUNS_LIMIT) : DEFAULT_RUNS_LIMIT;
}
