import { api } from './api.js';
import { byId, cloneTemplate, createElement } from './dom.js';
import { formatList } from './format.js';

const DEFAULT_LOCATION_ID = 'brazil';

const SUGGESTIONS = ['Tecnologia', 'Futebol', 'Política', 'Economia', 'Games', 'Música', 'Cinema e séries', 'Ciência'];

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
};

async function init() {
  const state = await api.getState();
  const interests = state.settings?.interests ?? [];
  renderIntro(state);
  renderLocations(state.locations, state.settings?.locationId ?? DEFAULT_LOCATION_ID);
  (interests.length > 0 ? interests : [{}]).forEach(addRow);
  renderSuggestions();
  renderHint(state.matcher);
  bindEvents();
}

function renderIntro({ configured, schedule }) {
  const times = formatList(schedule.times);
  if (!configured) {
    view.description.textContent = `Você faz isso uma única vez. Depois, as trends do X são buscadas automaticamente todos os dias às ${times} e você vê só o que importa.`;
    return;
  }
  view.title.textContent = 'Editar interesses';
  view.description.textContent = `As buscas continuam automáticas, todos os dias às ${times}.`;
  view.save.textContent = 'Salvar alterações';
  view.cancel.hidden = false;
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
    await api.saveSettings({ locationId: view.location.value, interests });
    window.location.assign('/');
  } catch (error) {
    showError(error.message);
    view.save.disabled = false;
  }
}

function bindEvents() {
  view.form.addEventListener('submit', submit);
  view.list.addEventListener('change', refreshSuggestions);
  view.add.addEventListener('click', () => nameInput(addRow()).focus());
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
