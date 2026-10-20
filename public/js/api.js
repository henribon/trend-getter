async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? `Erro ${response.status} ao falar com o servidor.`);
  }
  return payload;
}

export const api = Object.freeze({
  getState: () => request('/api/state'),
  listRuns: (limit = 20) => request(`/api/runs?limit=${limit}`),
  createRun: () => request('/api/runs', { method: 'POST' }),
  saveSettings: (settings) => request('/api/settings', { method: 'PUT', body: settings }),
});
