async function readJson(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${path} (status ${response.status}).`);
  }
  return response.json();
}

function toConfigFile(settings) {
  return `${JSON.stringify(settings, null, 2)}\n`;
}

export const api = Object.freeze({
  getState: () => readJson('data/state.json'),
  listRuns: () => readJson('data/runs.json'),
  createRun: async (state) => ({ type: 'external', url: state.links.runWorkflow }),
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
