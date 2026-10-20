import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTrend } from '../src/domain/trend.js';
import { KeywordMatcher } from '../src/infrastructure/matchers/keyword-matcher.js';

const trends = ['#LULAVAIVENCER', 'Flamengo', '#NBAFinals', 'Inteligência Artificial', 'OpenAI', 'Raissa'].map(
  (name, index) => createTrend({ name, rank: index + 1 }),
);

async function matchNames(interest) {
  const { matches } = await new KeywordMatcher().match(trends, [{ keywords: [], ...interest }]);
  return matches[0].trends.map(({ name }) => name);
}

test('relaciona trends pela palavra-chave ignorando caixa e acentos', async () => {
  assert.deepEqual(await matchNames({ name: 'Futebol', keywords: ['FLAMENGO'] }), ['Flamengo']);
  assert.deepEqual(await matchNames({ name: 'inteligencia artificial' }), ['Inteligência Artificial']);
});

test('encontra termos longos dentro de hashtags', async () => {
  assert.deepEqual(await matchNames({ name: 'Política', keywords: ['lula'] }), ['#LULAVAIVENCER']);
});

test('termos curtos exigem a palavra inteira', async () => {
  assert.deepEqual(await matchNames({ name: 'Tecnologia', keywords: ['AI'] }), ['OpenAI']);
  assert.deepEqual(await matchNames({ name: 'Basquete', keywords: ['nba'] }), ['#NBAFinals']);
});

test('explica o motivo e devolve todos os assuntos, mesmo sem trends', async () => {
  const { strategy, matches } = await new KeywordMatcher().match(trends, [
    { name: 'Futebol', keywords: ['flamengo'] },
    { name: 'Culinária', keywords: [] },
  ]);
  assert.equal(strategy, 'keyword');
  assert.equal(matches[0].trends[0].reason, 'Contém "flamengo"');
  assert.deepEqual(matches[1], { interest: 'Culinária', trends: [] });
});
