import { LOCATIONS } from '../domain/locations.js';
import { readJson, sendJson } from './responses.js';

const DEFAULT_RUNS_LIMIT = 20;
const MAX_RUNS_LIMIT = 60;

const PUBLIC_LOCATIONS = LOCATIONS.map(({ id, name }) => ({ id, name }));

export function registerApiRoutes(router, { settingsService, collector, job, runRepository, scheduler, provider, matcher }) {
  const describeState = () => ({
    configured: settingsService.isConfigured(),
    settings: settingsService.get(),
    locations: PUBLIC_LOCATIONS,
    schedule: { times: scheduler.times, nextRunAt: scheduler.nextRunAt?.toISOString() ?? null },
    collecting: collector.isCollecting,
    source: provider.label,
    matcher: { name: matcher.name, label: matcher.label },
  });

  router
    .on('GET', '/api/state', ({ response }) => sendJson(response, 200, describeState()))
    .on('PUT', '/api/settings', async ({ request, response }) => {
      const { settings, isFirstSetup } = settingsService.save(await readJson(request));
      if (isFirstSetup) {
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
