import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { readEnv } from '../config/env.js';

export const SETTINGS_FILE_NAME = 'configuracoes.env';

const DATABASE_FILE_NAME = 'trend-getter.db';

const AUTO_SEARCH_LINE = /^[ \t]*(?:export[ \t]+)?AUTO_SEARCH[ \t]*=.*$/gm;

const TEMPLATE = `# Configurações do Trend Getter.
# Depois de editar, saia do app (ícone na barra de menus > Sair) e abra de novo.

# true liga a busca automática nos horários de SCHEDULE_TIMES. Também dá para mudar pelo ícone na barra de menus.
AUTO_SEARCH=false
SCHEDULE_TIMES=08:00,20:00

# Opcional: chave da Anthropic para a IA relacionar as trends aos seus assuntos.
ANTHROPIC_API_KEY=

# Opcional: usa a API paga do X no lugar do trends24.in.
X_BEARER_TOKEN=
`;

export class DesktopSettingsFile {
  #filePath;

  constructor(filePath) {
    this.#filePath = filePath;
  }

  get path() {
    return this.#filePath;
  }

  read() {
    return parseEnv(this.#readText());
  }

  setAutoSearch(enabled) {
    const line = `AUTO_SEARCH=${enabled}`;
    const text = this.#readText();
    const updated = text.match(AUTO_SEARCH_LINE) ? text.replace(AUTO_SEARCH_LINE, line) : `${text.trimEnd()}\n${line}\n`;
    writeFileSync(this.#filePath, updated);
  }

  #readText() {
    if (!existsSync(this.#filePath)) {
      mkdirSync(path.dirname(this.#filePath), { recursive: true });
      writeFileSync(this.#filePath, TEMPLATE);
    }
    return readFileSync(this.#filePath, 'utf8');
  }
}

export function readDesktopEnv({ settingsFile, dataDir, processEnv = process.env }) {
  const values = Object.entries(settingsFile.read()).filter(([, value]) => value !== '');
  // O SDK da Anthropic lê ANTHROPIC_API_KEY direto de process.env.
  Object.assign(processEnv, Object.fromEntries(values));
  const env = readEnv({ DATABASE_PATH: path.join(dataDir, DATABASE_FILE_NAME), ...processEnv });
  return Object.freeze({ ...env, host: '127.0.0.1', port: 0 });
}
