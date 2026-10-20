import path from 'node:path';

export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..');

export const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

export const CONFIG_FILE_NAME = 'trends.config.json';

export const CONFIG_FILE_PATH = path.join(PROJECT_ROOT, CONFIG_FILE_NAME);

export function resolveFromRoot(target) {
  return path.resolve(PROJECT_ROOT, target);
}

export function resolveInsideRoot(target) {
  const resolved = resolveFromRoot(target);
  if (!resolved.startsWith(`${PROJECT_ROOT}${path.sep}`)) {
    throw new Error(`O caminho "${target}" precisa ficar dentro do projeto.`);
  }
  return resolved;
}
