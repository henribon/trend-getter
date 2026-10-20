import { ValidationError } from './errors.js';
import { findLocation } from './locations.js';
import { normalize } from './text.js';

export const SETTINGS_LIMITS = Object.freeze({
  interests: 30,
  interestName: 60,
  keywordsPerInterest: 20,
  keyword: 40,
});

export function parseSettings(input) {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Envie as configurações em formato JSON.');
  }
  const location = findLocation(input.locationId);
  if (!location) {
    throw new ValidationError('Escolha um local válido para as trends.');
  }
  return { locationId: location.id, interests: parseInterests(input.interests) };
}

function parseInterests(list) {
  if (!Array.isArray(list)) {
    throw new ValidationError('Informe a lista de assuntos de interesse.');
  }
  const interests = uniqueBy(list.map(parseInterest).filter(Boolean), ({ name }) => normalize(name));
  if (interests.length === 0) {
    throw new ValidationError('Informe pelo menos um assunto de interesse.');
  }
  if (interests.length > SETTINGS_LIMITS.interests) {
    throw new ValidationError(`Informe no máximo ${SETTINGS_LIMITS.interests} assuntos.`);
  }
  return interests;
}

function parseInterest(raw) {
  const name = cleanText(raw?.name, SETTINGS_LIMITS.interestName);
  if (!name) {
    return null;
  }
  const keywords = uniqueBy(
    toList(raw.keywords).map((keyword) => cleanText(keyword, SETTINGS_LIMITS.keyword)).filter(Boolean),
    normalize,
  ).slice(0, SETTINGS_LIMITS.keywordsPerInterest);
  return { name, keywords };
}

function toList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return typeof value === 'string' ? value.split(',') : [];
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
}

function uniqueBy(items, keyOf) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyOf(item);
    const isNew = !seen.has(key);
    seen.add(key);
    return isNew;
  });
}
