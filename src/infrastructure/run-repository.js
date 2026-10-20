import { RUN_STATUS } from '../domain/run.js';

export class RunRepository {
  #insert;
  #list;
  #lastSuccessful;
  #prune;

  constructor(database) {
    this.#insert = database.prepare(`
      INSERT INTO runs (started_at, finished_at, status, location_id, source, strategy, trends, matches, warning, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    this.#list = database.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT ?');
    this.#lastSuccessful = database.prepare(
      'SELECT started_at FROM runs WHERE status = ? ORDER BY id DESC LIMIT 1',
    );
    this.#prune = database.prepare(
      'DELETE FROM runs WHERE id NOT IN (SELECT id FROM runs ORDER BY id DESC LIMIT ?)',
    );
  }

  insert(run) {
    const { lastInsertRowid } = this.#insert.run(
      run.startedAt,
      run.finishedAt,
      run.status,
      run.locationId,
      run.source,
      run.strategy,
      JSON.stringify(run.trends),
      JSON.stringify(run.matches),
      run.warning,
      run.error,
    );
    return { id: Number(lastInsertRowid), ...run };
  }

  list(limit) {
    return this.#list.all(limit).map(toRun);
  }

  lastSuccessfulRunAt() {
    const row = this.#lastSuccessful.get(RUN_STATUS.success);
    return row ? new Date(row.started_at) : null;
  }

  keepLatest(count) {
    this.#prune.run(count);
  }
}

function toRun(row) {
  return {
    id: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    locationId: row.location_id,
    source: row.source,
    strategy: row.strategy,
    trends: JSON.parse(row.trends),
    matches: JSON.parse(row.matches),
    warning: row.warning,
    error: row.error,
  };
}
