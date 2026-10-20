const PREFERENCES_KEY = 'preferences';

export class SettingsRepository {
  #select;
  #upsert;

  constructor(database) {
    this.#select = database.prepare('SELECT value FROM settings WHERE key = ?');
    this.#upsert = database.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    );
  }

  load() {
    const row = this.#select.get(PREFERENCES_KEY);
    return row ? JSON.parse(row.value) : null;
  }

  save(settings) {
    this.#upsert.run(PREFERENCES_KEY, JSON.stringify(settings));
  }
}
