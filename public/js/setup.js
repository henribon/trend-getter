import { api } from './api.js';
import { byId, cloneTemplate, createElement } from './dom.js';
import { formatList } from './format.js';

const DEFAULT_LOCATION_ID = 'brazil';

const SUGGESTIONS = ['Tecnologia', 'Futebol', 'Política', 'Economia', 'Games', 'Música', 'Cinema e séries', 'Ciência'];

const COMMIT_INSTRUCTIONS = Object.freeze({
  prefilled:
    'Clique em "Abrir no GitHub": o arquivo trends.config.json já vai preenchido. Lá, clique em "Commit changes". Em cerca de 1 minuto o site é atualizado; depois é só clicar em "Buscar agora".',
  manual:
    'Clique em "Abrir no GitHub", troque todo o conteúdo do arquivo pelo texto abaixo e clique em "Commit changes". O site é atualizado em cerca de 1 minuto, sem fazer uma nova busca.',
});

const view = {
  form: byId('setup-form'),
  title: byId('setup-title'),
  description: byId('setup-description'),
  location: byId('location'),
  list: byId('interest-list'),
  add: byId('add-interest'),
  suggestions: byId('suggestions'),
  hint: byId('matcher-hint'),
  error: byId('form-error'),
  cancel: byId('cancel'),
  save: byId('save'),
  commitPanel: byId('commit-panel'),
  commitInstructions: byId('commit-instructions'),
  commitLink: byId('commit-link'),
  configContent: byId('config-content'),
  copyConfig: byId('copy-config'),
  backToForm: byId('back-to-form'),
};

let appState = null;

async function init() {
  appState = await api.getState();
  const interests = appState.settings?.interests ?? [];
  renderIntro(appState);
  renderLocations(appState.locations, appState.settings?.locationId ?? DEFAULT_LOCATION_ID);
  (interests.length > 0 ? interests : [{}]).forEach(addRow);
  renderSuggestions();
  renderHint(appState.matcher);
  bindEvents();
}

function renderIntro({ configured, schedule, mode }) {
  const commitNote = mode === 'static' ? ' Ao salvar, você confirma a configuração com um commit no GitHub.' : '';
  if (!configured) {
    view.description.textContent = `Você faz isso uma única vez. Depois, ${describeSearches(schedule)} e você vê só o que importa.${commitNote}`;
    return;
  }
  view.title.textContent = 'Editar interesses';
  view.description.textContent = `Mudar os interesses não dispara uma busca: ${describeSearches(schedule)}.${commitNote}`;
  view.save.textContent = 'Salvar alterações';
  view.cancel.hidden = false;
}

function describeSearches({ automatic, times }) {
  return automatic
    ? `as trends do X são buscadas automaticamente todos os dias às ${formatList(times)}`
    : 'as trends do X são buscadas quando você clicar em "Buscar agora"';
}

function renderLocations(locations, selectedId) {
  view.location.replaceChildren(...locations.map(({ id, name }) => new Option(name, id, false, id === selectedId)));
}

function renderHint(matcher) {
  view.hint.textContent = matcher.name.startsWith('ai')
    ? 'A IA está ativa: ela relaciona as trends aos seus assuntos mesmo sem palavras-chave (ex.: "Flamengo" em Futebol). Use palavras-chave para reforçar o que você quer acompanhar.'
    : 'As trends são relacionadas pelo nome do assunto e pelas palavras-chave. Inclua times, pessoas, marcas e siglas para não perder nada.';
}

function addRow({ name = '', keywords = [] } = {}) {
  const row = cloneTemplate('interest-row-template');
  nameInput(row).value = name;
  keywordsInput(row).value = keywords.join(', ');
  row.querySelector('.icon-button').addEventListener('click', () => removeRow(row));
  view.list.append(row);
  return row;
}

function removeRow(row) {
  row.remove();
  if (view.list.children.length === 0) {
    addRow();
  }
  refreshSuggestions();
}

function renderSuggestions() {
  view.suggestions.replaceChildren(
    createElement('span', { className: 'muted', text: 'Sugestões:' }),
    ...SUGGESTIONS.map(createSuggestion),
  );
  refreshSuggestions();
}

function refreshSuggestions() {
  const chosen = new Set(readInterests().map(({ name }) => normalize(name)));
  const buttons = [...view.suggestions.querySelectorAll('.chip-button')];
  buttons.forEach((button) => {
    button.hidden = chosen.has(normalize(button.dataset.name));
  });
  view.suggestions.hidden = buttons.every((button) => button.hidden);
}

function createSuggestion(name) {
  const button = createElement('button', { className: 'chip-button', text: `+ ${name}` });
  button.type = 'button';
  button.dataset.name = name;
  button.addEventListener('click', () => applySuggestion(name));
  return button;
}

function applySuggestion(name) {
  const row = rows().find((candidate) => !nameInput(candidate).value.trim()) ?? addRow();
  nameInput(row).value = name;
  keywordsInput(row).focus();
  refreshSuggestions();
}

function readInterests() {
  return rows()
    .map((row) => ({
      name: nameInput(row).value.trim(),
      keywords: keywordsInput(row)
        .value.split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    }))
    .filter(({ name }) => name);
}

async function submit(event) {
  event.preventDefault();
  const interests = readInterests();
  if (interests.length === 0) {
    showError('Adicione pelo menos um assunto.');
    return;
  }
  hideError();
  view.save.disabled = true;
  try {
    handleSaveResult(await api.saveSettings({ locationId: view.location.value, interests }, appState));
  } catch (error) {
    showError(error.message);
  } finally {
    view.save.disabled = false;
  }
}

function handleSaveResult(result) {
  if (result.type === 'commit') {
    showCommitPanel(result);
    return;
  }
  window.location.assign('./');
}

function showCommitPanel({ url, content, prefilled }) {
  view.commitInstructions.textContent = prefilled ? COMMIT_INSTRUCTIONS.prefilled : COMMIT_INSTRUCTIONS.manual;
  view.commitLink.href = url;
  view.configContent.value = content;
  view.form.hidden = true;
  view.commitPanel.hidden = false;
  view.commitLink.focus();
}

function showForm() {
  view.commitPanel.hidden = true;
  view.form.hidden = false;
}

async function copyConfig() {
  const copied = await navigator.clipboard.writeText(view.configContent.value).then(
    () => true,
    () => false,
  );
  if (!copied) {
    view.configContent.select();
  }
  view.copyConfig.textContent = copied ? 'Copiado!' : 'Use Ctrl+C para copiar';
}

function bindEvents() {
  view.form.addEventListener('submit', submit);
  view.list.addEventListener('change', refreshSuggestions);
  view.add.addEventListener('click', () => nameInput(addRow()).focus());
  view.copyConfig.addEventListener('click', copyConfig);
  view.backToForm.addEventListener('click', showForm);
}

function rows() {
  return [...view.list.children];
}

function nameInput(row) {
  return row.querySelector('[name="name"]');
}

function keywordsInput(row) {
  return row.querySelector('[name="keywords"]');
}

function normalize(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function showError(message) {
  view.error.textContent = message;
  view.error.hidden = false;
}

function hideError() {
  view.error.hidden = true;
}

init().catch((error) => showError(error.message));
