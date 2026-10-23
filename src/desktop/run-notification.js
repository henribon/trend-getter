import { RUN_STATUS } from '../domain/run.js';
import { countMatchedTrends } from '../domain/trend.js';

const MAX_NAMES_PER_INTEREST = 3;

export function describeRunNotification(run) {
  if (run.status === RUN_STATUS.error) {
    return { title: 'A busca de trends falhou', body: run.error };
  }
  const related = run.matches.filter(({ trends }) => trends.length > 0);
  if (related.length === 0) {
    return null;
  }
  const count = countMatchedTrends(run.matches);
  return {
    title: `${count} ${count === 1 ? 'trend' : 'trends'} sobre seus assuntos`,
    body: related.map(({ interest, trends }) => `${interest}: ${listNames(trends)}`).join('\n'),
  };
}

function listNames(trends) {
  const names = trends.slice(0, MAX_NAMES_PER_INTEREST).map(({ name }) => name);
  const hidden = trends.length - names.length;
  return hidden > 0 ? `${names.join(', ')} e mais ${hidden}` : names.join(', ');
}
