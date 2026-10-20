export function byId(id) {
  return document.getElementById(id);
}

export function cloneTemplate(id) {
  return byId(id).content.firstElementChild.cloneNode(true);
}

export function setText(root, selector, text) {
  root.querySelector(selector).textContent = text;
}

export function createElement(tag, { className, text } = {}) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}
