const DIACRITICS = /\p{Diacritic}/gu;
const NON_ALPHANUMERIC = /[^\p{L}\p{N}]+/gu;
const LOWER_TO_UPPER = /(\p{Ll})(\p{Lu})/gu;
const ACRONYM_TO_WORD = /(\p{Lu})(\p{Lu}\p{Ll})/gu;

export function normalize(text) {
  return text.normalize('NFD').replace(DIACRITICS, '').toLowerCase();
}

export function compact(text) {
  return normalize(text).replace(NON_ALPHANUMERIC, '');
}

export function words(text) {
  const separated = text.replace(LOWER_TO_UPPER, '$1 $2').replace(ACRONYM_TO_WORD, '$1 $2');
  return normalize(separated).split(NON_ALPHANUMERIC).filter(Boolean);
}
