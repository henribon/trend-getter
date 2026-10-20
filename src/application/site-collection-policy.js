import { isOutdated } from '../domain/schedule.js';

export function shouldCollectForSite({ settings, publishedSettings, lastSuccessfulRunAt, times, now, force }) {
  if (!settings) {
    return false;
  }
  return force || !haveSameInterests(settings, publishedSettings) || isOutdated(lastSuccessfulRunAt, times, now);
}

function haveSameInterests(current, published) {
  return fingerprint(current) === fingerprint(published);
}

function fingerprint(settings) {
  return settings ? JSON.stringify({ locationId: settings.locationId, interests: settings.interests }) : null;
}
