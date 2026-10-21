import { resolveInsideRoot } from './paths.js';

export const WORKFLOW_FILE_NAME = 'trends.yml';

export function readSiteEnv(source = process.env) {
  if (!source.GITHUB_REPOSITORY) {
    throw new Error('Defina GITHUB_REPOSITORY no formato dono/repositório para gerar o site.');
  }
  return Object.freeze({
    siteUrl: source.SITE_URL || '',
    repository: source.GITHUB_REPOSITORY,
    branch: source.GITHUB_REF_NAME || 'main',
    serverUrl: source.GITHUB_SERVER_URL || 'https://github.com',
    apiUrl: source.GITHUB_API_URL || 'https://api.github.com',
    outputDir: resolveInsideRoot(source.SITE_OUTPUT_DIR || 'dist'),
    trigger: source.SITE_TRIGGER || '',
  });
}
