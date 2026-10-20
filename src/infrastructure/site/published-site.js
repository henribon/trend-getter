const REQUEST_TIMEOUT_MS = 20_000;

export const SITE_DATA_FILES = Object.freeze({ state: 'data/state.json', runs: 'data/runs.json' });

const EMPTY_SITE = Object.freeze({ state: null, runs: [] });

export async function fetchPublishedSite(siteUrl, fetch = globalThis.fetch) {
  if (!siteUrl) {
    return EMPTY_SITE;
  }
  const [state, runs] = await Promise.all([
    fetchSiteJson(siteUrl, SITE_DATA_FILES.state, fetch),
    fetchSiteJson(siteUrl, SITE_DATA_FILES.runs, fetch),
  ]);
  return { state, runs: runs?.runs ?? [] };
}

async function fetchSiteJson(siteUrl, file, fetch) {
  const url = new URL(file, siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`);
  url.searchParams.set('t', String(Date.now()));
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Não foi possível ler ${file} do site publicado (status ${response.status}).`);
  }
  return response.json();
}
