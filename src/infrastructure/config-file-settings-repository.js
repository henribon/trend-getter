import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ValidationError } from '../domain/errors.js';
import { parseSettings } from '../domain/settings.js';

export class ConfigFileSettingsRepository {
  #filePath;

  constructor(filePath) {
    this.#filePath = filePath;
  }

  load() {
    if (!existsSync(this.#filePath)) {
      return null;
    }
    return parseSettings(this.#readJson());
  }

  save() {
    throw new Error(`Edite ${path.basename(this.#filePath)} no repositório para mudar a configuração.`);
  }

  #readJson() {
    try {
      return JSON.parse(readFileSync(this.#filePath, 'utf8'));
    } catch (error) {
      throw new ValidationError(`${path.basename(this.#filePath)} não é um JSON válido: ${error.message}`);
    }
  }
}
