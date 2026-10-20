import { RUN_STATUS } from '../domain/run.js';

export class MemoryRunRepository {
  #runs;

  constructor(runs = []) {
    this.#runs = [...runs].sort((first, second) => second.id - first.id);
  }

  insert(run) {
    const saved = { id: (this.#runs[0]?.id ?? 0) + 1, ...run };
    this.#runs.unshift(saved);
    return saved;
  }

  list(limit) {
    return this.#runs.slice(0, limit);
  }

  lastSuccessfulRunAt() {
    const run = this.#runs.find(({ status }) => status === RUN_STATUS.success);
    return run ? new Date(run.startedAt) : null;
  }

  keepLatest(count) {
    this.#runs.splice(count);
  }
}
