import path from 'node:path';

export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..');

export const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

export function resolveFromRoot(target) {
  return path.resolve(PROJECT_ROOT, target);
}
