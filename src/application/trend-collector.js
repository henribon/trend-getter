import { CollectionInProgressError } from '../domain/errors.js';
import { findLocation } from '../domain/locations.js';
import { RUN_STATUS } from '../domain/run.js';

export class TrendCollector {
  #settingsService;
  #provider;
  #matcher;
  #runRepository;
  #historyLimit;
  #clock;
  #inFlight = null;

  constructor({ settingsService, provider, matcher, runRepository, historyLimit, clock = () => new Date() }) {
    this.#settingsService = settingsService;
    this.#provider = provider;
    this.#matcher = matcher;
    this.#runRepository = runRepository;
    this.#historyLimit = historyLimit;
    this.#clock = clock;
  }

  get isCollecting() {
    return this.#inFlight !== null;
  }

  async collect() {
    if (this.#inFlight) {
      throw new CollectionInProgressError();
    }
    this.#inFlight = this.#execute();
    try {
      return await this.#inFlight;
    } finally {
      this.#inFlight = null;
    }
  }

  async #execute() {
    const settings = this.#settingsService.require();
    const location = findLocation(settings.locationId);
    const startedAt = this.#clock().toISOString();
    const outcome = await this.#gather(settings.interests, location).catch(toFailure);
    const run = this.#runRepository.insert({
      ...outcome,
      startedAt,
      finishedAt: this.#clock().toISOString(),
      locationId: location.id,
      source: this.#provider.name,
    });
    this.#runRepository.keepLatest(this.#historyLimit);
    return run;
  }

  async #gather(interests, location) {
    const trends = await this.#provider.fetchTrends(location);
    const { strategy, matches, warning = null } = await this.#matcher.match(trends, interests);
    return { status: RUN_STATUS.success, strategy, trends, matches, warning, error: null };
  }
}

function toFailure(error) {
  return { status: RUN_STATUS.error, strategy: null, trends: [], matches: [], warning: null, error: error.message };
}
