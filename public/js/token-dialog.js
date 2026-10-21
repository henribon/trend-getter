import { byId } from './dom.js';

const SAVE_ACTION = 'save';

const view = {
  dialog: byId('token-dialog'),
  input: byId('token-input'),
  error: byId('token-error'),
  createLink: byId('token-create-link'),
};

export function requestToken({ tokenUrl, error }) {
  view.createLink.href = tokenUrl;
  view.error.textContent = error ?? '';
  view.error.hidden = !error;
  view.input.value = '';
  view.dialog.returnValue = '';
  view.dialog.showModal();
  return new Promise((resolve) => {
    view.dialog.addEventListener('close', () => resolve(readChosenToken()), { once: true });
  });
}

function readChosenToken() {
  return view.dialog.returnValue === SAVE_ACTION ? view.input.value.trim() || null : null;
}
