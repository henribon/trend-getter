import { api } from './api.js';
import { byId, cloneTemplate, createElement, setText } from './dom.js';
import { formatDateTime, formatList, formatScheduledTime, formatTweetCount, pluralize } from './format.js';

const POLL_INTERVAL_MS = 3000;

const view = {
  status: byId('status'),
  notice: byId('notice'),
  runNow: byId('run-now'),
  runTitle: byId('run-title'),
  runMeta: byId('run-meta'),
  grid: byId('interest-grid'),
  allTrends: byId('all-trends'),
  allTrendsSummary: byId('all-trends-summary'),
  allTrendsList: byId('all-trends-list'),
  history: byId('history-list'),
};

const store = { state: null, runs: [], selectedRunId: null };

let pollTimer = null;

async function refresh() {
  try {
    const [state, { runs }] = await Promise.all([api.getState(), api.listRuns()]);
    if (!state.configured) {
      window.location.replace('setup.html');
      return;
    }
    Object.assign(store, { state, runs });
    render();
    if (state.collecting) {
      schedulePoll();
    }
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

function schedulePoll() {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(refresh, POLL_INTERVAL_MS);
}

async function runNow() {
  renderRunButton(true);
  const outcome = await api.createRun(store.state).catch((error) => ({ type: 'error', error }));
  if (outcome.type === 'external') {
    openExternalRun(outcome.url);
    return;
  }
  if (outcome.type === 'run') {
    store.selectedRunId = outcome.run.id;
  }
  await refresh();
  if (outcome.type === 'error') {
    showNotice(outcome.error.message, 'error');
  }
}

function openExternalRun(url) {
  window.open(url, '_blank', 'noopener');
  renderRunButton(false);
  showNotice(
    'No GitHub, clique em "Run workflow". Em cerca de 1 minuto a nova busca é publicada; depois é só recarregar esta página.',
    'info',
  );
}

function selectRun(id) {
  store.selectedRunId = id;
  renderSelectedRun();
  renderHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectedRun() {
  return store.runs.find(({ id }) => id === store.selectedRunId) ?? store.runs[0] ?? null;
}

function render() {
  renderStatus(store.state);
  renderRunButton(store.state.collecting);
  renderSelectedRun();
  renderHistory();
}

function renderStatus({ settings, locations, schedule, source, matcher, collecting }) {
  const locationName = locations.find(({ id }) => id === settings.locationId)?.name ?? '—';
  const chips = [
    ['Local', locationName],
    ['Próxima busca', schedule.nextRunAt ? formatScheduledTime(schedule.nextRunAt) : '—'],
    ['Horários', formatList(schedule.times)],
    ['Fonte', source],
    ['Correspondência', matcher.label],
  ].map(([label, value]) => createChip(label, value));
  if (collecting) {
    chips.unshift(createElement('span', { className: 'chip chip-live', text: 'Buscando trends…' }));
  }
  view.status.replaceChildren(...chips);
}

function createChip(label, value) {
  const chip = createElement('span', { className: 'chip' });
  chip.append(createElement('span', { className: 'chip-label', text: label }), value);
  return chip;
}

function renderRunButton(isBusy) {
  view.runNow.disabled = isBusy;
  view.runNow.textContent = isBusy ? 'Buscando…' : 'Buscar agora';
}

function renderSelectedRun() {
  hideNotice();
  const run = selectedRun();
  if (!run) {
    renderEmptyRun();
    return;
  }
  view.runTitle.textContent = run.id === store.runs[0].id ? 'Suas trends agora' : 'Suas trends nesta busca';
  view.runMeta.textContent = `Busca de ${formatDateTime(run.startedAt)}`;
  if (run.status === 'error') {
    showNotice(`Esta busca falhou: ${run.error}`, 'error');
    view.grid.replaceChildren();
    view.allTrends.hidden = true;
    return;
  }
  if (run.warning) {
    showNotice(run.warning, 'warning');
  }
  view.grid.replaceChildren(...withMatchesFirst(run.matches).map(createInterestCard));
  renderAllTrends(run.trends);
}

function renderEmptyRun() {
  view.runTitle.textContent = 'Suas trends';
  view.runMeta.textContent = '';
  view.allTrends.hidden = true;
  const message = store.state.collecting
    ? 'A primeira busca está em andamento. Os resultados aparecem aqui em instantes.'
    : 'Nenhuma busca ainda. Clique em "Buscar agora" ou aguarde o próximo horário agendado.';
  view.grid.replaceChildren(createElement('p', { className: 'empty-state', text: message }));
}

function withMatchesFirst(matches) {
  return [...matches].sort((first, second) => Number(second.trends.length > 0) - Number(first.trends.length > 0));
}

function createInterestCard({ interest, trends }) {
  const card = cloneTemplate('interest-card-template');
  const hasTrends = trends.length > 0;
  setText(card, '.card-title', interest);
  setText(card, '.badge', String(trends.length));
  card.querySelector('.badge').classList.toggle('badge-active', hasTrends);
  card.classList.toggle('card-quiet', !hasTrends);
  card.querySelector('.trend-list').replaceChildren(...trends.map(createTrendItem));
  card.querySelector('.empty').hidden = hasTrends;
  return card;
}

function createTrendItem({ name, url, rank, tweetCount, reason }) {
  const item = cloneTemplate('trend-template');
  const link = item.querySelector('.trend-name');
  link.textContent = name;
  link.title = name;
  link.href = url;
  setText(item, '.trend-rank', `#${rank}`);
  setText(item, '.trend-count', formatTweetCount(tweetCount));
  setText(item, '.trend-reason', reason ?? '');
  item.querySelector('.trend-reason').hidden = !reason;
  return item;
}

function renderAllTrends(trends) {
  view.allTrends.hidden = trends.length === 0;
  view.allTrendsSummary.textContent = `Todas as trends desta busca (${trends.length})`;
  view.allTrendsList.replaceChildren(...trends.map(createTrendItem));
}

function renderHistory() {
  if (store.runs.length === 0) {
    view.history.replaceChildren(createElement('li', { className: 'muted', text: 'As buscas realizadas aparecem aqui.' }));
    return;
  }
  const currentId = selectedRun()?.id;
  view.history.replaceChildren(...store.runs.map((run) => createHistoryItem(run, run.id === currentId)));
}

function createHistoryItem(run, isSelected) {
  const item = cloneTemplate('history-item-template');
  const button = item.querySelector('.history-item');
  const summary = item.querySelector('.history-summary');
  button.setAttribute('aria-current', String(isSelected));
  button.addEventListener('click', () => selectRun(run.id));
  setText(item, '.history-date', formatDateTime(run.startedAt));
  summary.textContent = describeRun(run);
  summary.classList.toggle('history-summary-error', run.status === 'error');
  return item;
}

function describeRun(run) {
  if (run.status === 'error') {
    return 'Falhou';
  }
  const matched = new Set(run.matches.flatMap(({ trends }) => trends.map(({ name }) => name))).size;
  return `${pluralize(matched, 'relacionada', 'relacionadas')} · ${pluralize(run.trends.length, 'trend', 'trends')} no total`;
}

function showNotice(message, tone) {
  view.notice.textContent = message;
  view.notice.classList.toggle('notice-error', tone === 'error');
  view.notice.classList.toggle('notice-info', tone === 'info');
  view.notice.hidden = false;
}

function hideNotice() {
  view.notice.hidden = true;
}

view.runNow.addEventListener('click', runNow);
refresh();
