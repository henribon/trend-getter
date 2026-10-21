export const SITE_TRIGGER = Object.freeze({
  manual: 'workflow_dispatch',
  schedule: 'schedule',
  push: 'push',
});

export function shouldCollectForSite({ settings, trigger, autoSearch }) {
  if (!settings) {
    return false;
  }
  return trigger === SITE_TRIGGER.manual || (trigger === SITE_TRIGGER.schedule && autoSearch);
}

export function describeSkippedCollection({ settings, trigger, configFileName }) {
  if (!settings) {
    return `Sem ${configFileName}: publicando a tela de configuração.`;
  }
  if (trigger === SITE_TRIGGER.push) {
    return 'Commit recebido: site atualizado sem fazer uma nova busca.';
  }
  return 'Busca automática desligada: site atualizado sem fazer uma nova busca.';
}
