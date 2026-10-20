import { LOCATIONS } from '../domain/locations.js';

export const APP_MODE = Object.freeze({ server: 'server', static: 'static' });

const PUBLIC_LOCATIONS = Object.freeze(LOCATIONS.map(({ id, name }) => ({ id, name })));

export function describeAppState({ mode, settings, schedule, collecting, provider, matcher, links = null }) {
  return {
    mode,
    configured: settings !== null,
    settings,
    locations: PUBLIC_LOCATIONS,
    schedule: { times: schedule.times, nextRunAt: schedule.nextRunAt?.toISOString() ?? null },
    collecting,
    source: provider.label,
    matcher: { name: matcher.name, label: matcher.label },
    links,
  };
}
