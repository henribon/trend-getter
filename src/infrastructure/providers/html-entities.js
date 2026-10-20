const ENTITY = /&(#x[\da-f]+|#\d+|[a-z]+);/gi;
const MAX_CODE_POINT = 0x10ffff;

const NAMED_ENTITIES = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['nbsp', ' '],
]);

export function decodeHtmlEntities(text) {
  return text.replace(ENTITY, (entity, code) => decodeEntity(code) ?? entity);
}

function decodeEntity(code) {
  if (!code.startsWith('#')) {
    return NAMED_ENTITIES.get(code.toLowerCase());
  }
  const isHex = code[1].toLowerCase() === 'x';
  const codePoint = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
  return codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : undefined;
}
