import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ValidationError } from '../src/domain/errors.js';
import { parseSettings } from '../src/domain/settings.js';

test('normaliza assuntos e palavras-chave', () => {
  const settings = parseSettings({
    locationId: 'brazil',
    interests: [
      { name: '  Futebol  ', keywords: ['flamengo', ' Flamengo ', '', 'brasileirão'] },
      { name: 'futebol', keywords: ['duplicado'] },
      { name: 'Tecnologia', keywords: 'ia, apple ,  ' },
      { name: '   ' },
    ],
  });
  assert.deepEqual(settings, {
    locationId: 'brazil',
    interests: [
      { name: 'Futebol', keywords: ['flamengo', 'brasileirão'] },
      { name: 'Tecnologia', keywords: ['ia', 'apple'] },
    ],
  });
});

test('rejeita local desconhecido e lista vazia', () => {
  assert.throws(() => parseSettings({ locationId: 'marte', interests: [{ name: 'X' }] }), ValidationError);
  assert.throws(() => parseSettings({ locationId: 'brazil', interests: [] }), ValidationError);
  assert.throws(() => parseSettings(null), ValidationError);
});
