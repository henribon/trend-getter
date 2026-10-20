import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findLocation } from '../src/domain/locations.js';
import { Trends24Provider } from '../src/infrastructure/providers/trends24-provider.js';
import { XApiTrendProvider } from '../src/infrastructure/providers/x-api-provider.js';

const brazil = findLocation('brazil');

function fakeFetch(response) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init.headers });
    return response;
  };
  return { fetch, calls };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('a API do X pede as trends do WOEID com o token e converte a resposta', async () => {
  const { fetch, calls } = fakeFetch(
    jsonResponse(200, { data: [{ trend_name: 'Botafogo', tweet_count: 52000 }, { trend_name: '#Eleicoes' }] }),
  );
  const trends = await new XApiTrendProvider({ bearerToken: 'segredo', fetch }).fetchTrends(brazil);

  assert.equal(
    calls[0].url,
    'https://api.x.com/2/trends/by/woeid/23424768?max_trends=50&trend.fields=trend_name,tweet_count',
  );
  assert.equal(calls[0].headers.Authorization, 'Bearer segredo');
  assert.deepEqual(
    trends.map(({ rank, name, tweetCount }) => ({ rank, name, tweetCount })),
    [
      { rank: 1, name: 'Botafogo', tweetCount: 52000 },
      { rank: 2, name: '#Eleicoes', tweetCount: null },
    ],
  );
});

test('a API do X repassa o motivo do erro', async () => {
  const { fetch } = fakeFetch(jsonResponse(401, { title: 'Unauthorized', detail: 'Unauthorized' }));
  await assert.rejects(
    new XApiTrendProvider({ bearerToken: 'errado', fetch }).fetchTrends(brazil),
    /API oficial do X respondeu com status 401: \{"title":"Unauthorized"/,
  );
});

test('bloqueio anti-robô vira uma mensagem curta, sem o HTML da página', async () => {
  const blocked = new Response('<!DOCTYPE html><html><title>Just a moment...</title></html>', {
    status: 403,
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  });
  const { fetch } = fakeFetch(blocked);
  await assert.rejects(new Trends24Provider({ fetch }).fetchTrends(brazil), {
    message: 'trends24.in respondeu com status 403: o site bloqueou o acesso automático.',
  });
});
