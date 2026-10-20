import { nextOccurrence } from '../domain/schedule.js';

export class DailyScheduler {
  #times;
  #task;
  #logger;
  #clock;
  #timer = null;
  #nextRunAt = null;

  constructor({ times, task, logger, clock = () => new Date() }) {
    this.#times = times;
    this.#task = task;
    this.#logger = logger;
    this.#clock = clock;
  }

  get times() {
    return this.#times.map(({ label }) => label);
  }

  get nextRunAt() {
    return this.#nextRunAt;
  }

  start() {
    this.#scheduleNext();
  }

  stop() {
    clearTimeout(this.#timer);
    this.#timer = null;
    this.#nextRunAt = null;
  }

  #scheduleNext() {
    const now = this.#clock();
    const reference = this.#nextRunAt && this.#nextRunAt > now ? this.#nextRunAt : now;
    this.#nextRunAt = nextOccurrence(this.#times, reference);
    this.#timer = setTimeout(() => this.#fire(), this.#nextRunAt - now);
  }

  async #fire() {
    try {
      await this.#task();
    } catch (error) {
      this.#logger.error(`Falha na busca agendada: ${error.message}`);
    } finally {
      this.#scheduleNext();
    }
  }
}
