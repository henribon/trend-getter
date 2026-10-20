import { RUN_STATUS } from '../domain/run.js';
import { countMatchedTrends } from '../domain/trend.js';

export class CollectionJob {
  #collector;
  #logger;

  constructor({ collector, logger }) {
    this.#collector = collector;
    this.#logger = logger;
  }

  async run(trigger) {
    const run = await this.#collector.collect();
    this.#report(run, trigger);
    return run;
  }

  async runSafely(trigger) {
    try {
      return await this.run(trigger);
    } catch (error) {
      this.#logger.warn(`Busca (${trigger}) não executada: ${error.message}`);
      return null;
    }
  }

  #report(run, trigger) {
    if (run.status === RUN_STATUS.error) {
      this.#logger.error(`Busca (${trigger}) #${run.id} falhou: ${run.error}`);
      return;
    }
    this.#logger.info(
      `Busca (${trigger}) #${run.id}: ${run.trends.length} trends, ${countMatchedTrends(run.matches)} ligadas aos seus interesses.`,
    );
  }
}
