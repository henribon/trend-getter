import { clearToken, readToken, saveToken } from './github-token.js';

const REJECTED_TOKEN_STATUSES = new Set([401, 403, 404]);

async function readJson(path) {
  const response = await fetch(`${path}?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${path} (status ${response.status}).`);
  }
  return response.json();
}

function toConfigFile(settings) {
  return `${JSON.stringify(settings, null, 2)}\n`;
}

function dispatchWorkflow({ url, ref }, token) {
  return fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ref }),
  });
}

async function createRun(state, { token: newToken } = {}) {
  if (newToken) {
    saveToken(newToken);
  }
  const token = readToken();
  const tokenUrl = state.links.createToken;
  if (!token) {
    return { type: 'needs-token', tokenUrl };
  }
  const response = await dispatchWorkflow(state.links.dispatch, token);
  if (REJECTED_TOKEN_STATUSES.has(response.status)) {
    clearToken();
    return {
      type: 'needs-token',
      tokenUrl,
      error: 'O GitHub recusou o token. Confira se ele dá acesso ao repositório com a permissão Actions: Read and write.',
    };
  }
  if (!response.ok) {
    throw new Error(`O GitHub não iniciou a busca (status ${response.status}). Tente de novo em instantes.`);
  }
  return { type: 'dispatched' };
}

export const api = Object.freeze({
  getState: () => readJson('data/state.json'),
  listRuns: () => readJson('data/runs.json'),
  createRun,
  saveSettings: async (settings, state) => {
    const content = toConfigFile(settings);
    if (state.configured) {
      return { type: 'commit', url: state.links.editConfig, content, prefilled: false };
    }
    return {
      type: 'commit',
      url: `${state.links.createConfig}&value=${encodeURIComponent(content)}`,
      content,
      prefilled: true,
    };
  },
});
