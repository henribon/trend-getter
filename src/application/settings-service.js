import { NotConfiguredError } from '../domain/errors.js';
import { parseSettings } from '../domain/settings.js';

export class SettingsService {
  #repository;
  #clock;
  #cached;

  constructor(repository, clock = () => new Date()) {
    this.#repository = repository;
    this.#clock = clock;
    this.#cached = repository.load();
  }

  get() {
    return this.#cached;
  }

  isConfigured() {
    return this.#cached !== null;
  }

  require() {
    if (!this.#cached) {
      throw new NotConfiguredError();
    }
    return this.#cached;
  }

  save(input) {
    const previous = this.#cached;
    const now = this.#clock().toISOString();
    const settings = { ...parseSettings(input), configuredAt: previous?.configuredAt ?? now, updatedAt: now };
    this.#repository.save(settings);
    this.#cached = settings;
    return { settings, isFirstSetup: previous === null };
  }
}
