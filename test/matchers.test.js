import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTrend } from '../src/domain/trend.js';
import { ClaudeMatcher } from '../src/infrastructure/matchers/claude-matcher.js';
import { HybridMatcher } from '../src/infrastructure/matchers/hybrid-matcher.js';
import { KeywordMatcher } from '../src/infrastructure/matchers/keyword-matcher.js';

const trends = ['Flamengo', 'Gabigol', 'iPhone 18'].map((name, index) => createTrend({ name, rank: index + 1 }));
const interests = [
  { name: 'Futebol', keywords: ['flamengo'] },
  { name: 'Tecnologia', keywords: [] },
];
const silentLogger = { info() {}, warn() {}, error() {} };

function fakeClient(response) {
  const requests = [];
  const client = {
    beta: {
      messages: {
        create: async (request) => {
          requests.push(request);
          return response;
        },
      },
    },
  };
  return { client, requests };
}

function textResponse(matches) {
  return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ matches }) }] };
}

test('ClaudeMatcher converte a resposta estruturada e ignora ids inválidos', async () => {
  const { client, requests } = fakeClient(
    textResponse([
      { interest_id: 1, trend_id: 2, reason: 'Atacante de futebol' },
      { interest_id: 2, trend_id: 3, reason: 'Celular da Apple' },
      { interest_id: 9, trend_id: 1, reason: 'inválido' },
      { interest_id: 1, trend_id: 99, reason: 'inválido' },
    ]),
  );
  const { matches } = await new ClaudeMatcher({ model: 'claude-opus-5-5', client }).match(trends, interests);

  assert.deepEqual(matches.map(({ interest, trends: found }) => [interest, found.map(({ name }) => name)]), [
    ['Futebol', ['Gabigol']],
    ['Tecnologia', ['iPhone 18']],
  ]);
  assert.equal(requests[0].fallbacks, 'default');
  assert.equal(requests[0].output_config.format.type, 'json_schema');
  assert.match(requests[0].messages[0].content, /1\. Futebol \(palavras-chave: flamengo\)/);
});

test('ClaudeMatcher só usa fallback de servidor em modelos que suportam', async () => {
  const { client, requests } = fakeClient(textResponse([]));
  await new ClaudeMatcher({ model: 'claude-haiku-5-5', client }).match(trends, interests);
  assert.equal(requests[0].fallbacks, undefined);
  assert.equal(requests[0].betas, undefined);
});

test('ClaudeMatcher falha de forma explícita quando a IA recusa', async () => {
  const { client } = fakeClient({ stop_reason: 'refusal', content: [] });
  await assert.rejects(new ClaudeMatcher({ model: 'claude-opus-5-5', client }).match(trends, interests), /recusou/);
});

test('HybridMatcher une IA e palavras-chave, priorizando o motivo da IA', async () => {
  const primary = {
    name: 'ai',
    label: 'IA',
    match: async () => ({
      strategy: 'ai',
      matches: [
        { interest: 'Futebol', trends: [{ ...trends[1], reason: 'Jogador' }, { ...trends[0], reason: 'Clube' }] },
        { interest: 'Tecnologia', trends: [] },
      ],
    }),
  };
  const hybrid = new HybridMatcher({ primary, fallback: new KeywordMatcher(), logger: silentLogger });
  const { strategy, matches } = await hybrid.match(trends, interests);

  assert.equal(strategy, 'ai+keyword');
  assert.deepEqual(matches[0].trends.map(({ name, reason }) => [name, reason]), [
    ['Flamengo', 'Clube'],
    ['Gabigol', 'Jogador'],
  ]);
});

test('HybridMatcher usa palavras-chave e avisa quando a IA falha', async () => {
  const primary = { name: 'ai', label: 'IA', match: async () => Promise.reject(new Error('sem rede')) };
  const hybrid = new HybridMatcher({ primary, fallback: new KeywordMatcher(), logger: silentLogger });
  const { strategy, matches, warning } = await hybrid.match(trends, interests);

  assert.equal(strategy, 'keyword');
  assert.match(warning, /sem rede/);
  assert.deepEqual(matches[0].trends.map(({ name }) => name), ['Flamengo']);
});
