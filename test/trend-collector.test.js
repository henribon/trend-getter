import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SettingsService } from '../src/application/settings-service.js';
import { TrendCollector } from '../src/application/trend-collector.js';
import { CollectionInProgressError, NotConfiguredError } from '../src/domain/errors.js';
import { createTrend } from '../src/domain/trend.js';
import { openDatabase } from '../src/infrastructure/database.js';
import { KeywordMatcher } from '../src/infrastructure/matchers/keyword-matcher.js';
import { RunRepository } from '../src/infrastructure/run-repository.js';
import { SettingsRepository } from '../src/infrastructure/settings-repository.js';

function setup({ provider, configured = true, historyLimit = 10 }) {
  const database = openDatabase(':memory:');
  const settingsService = new SettingsService(new SettingsRepository(database));
  const runRepository = new RunRepository(database);
  if (configured) {
    settingsService.save({ locationId: 'brazil', interests: [{ name: 'Futebol', keywords: ['flamengo'] }] });
  }
  const collector = new TrendCollector({
    settingsService,
    provider,
    matcher: new KeywordMatcher(),
    runRepository,
    historyLimit,
  });
  return { collector, runRepository };
}

const workingProvider = {
  name: 'fake',
  fetchTrends: async () => [createTrend({ name: 'Flamengo', rank: 1 }), createTrend({ name: 'Eleições', rank: 2 })],
};

test('salva a busca com as trends e as correspondências', async () => {
  const { collector, runRepository } = setup({ provider: workingProvider });
  const run = await collector.collect();

  assert.equal(run.status, 'success');
  assert.equal(run.locationId, 'brazil');
  assert.deepEqual(run.matches[0].trends.map(({ name }) => name), ['Flamengo']);
  assert.deepEqual(runRepository.list(5), [run]);
  assert.ok(runRepository.lastSuccessfulRunAt() instanceof Date);
});

test('registra a falha da fonte sem derrubar o processo', async () => {
  const provider = { name: 'fake', fetchTrends: async () => Promise.reject(new Error('fora do ar')) };
  const { collector, runRepository } = setup({ provider });
  const run = await collector.collect();

  assert.equal(run.status, 'error');
  assert.equal(run.error, 'fora do ar');
  assert.equal(runRepository.lastSuccessfulRunAt(), null);
});

test('não busca sem configuração nem em paralelo', async () => {
  await assert.rejects(setup({ provider: workingProvider, configured: false }).collector.collect(), NotConfiguredError);

  const { collector } = setup({ provider: workingProvider });
  const first = collector.collect();
  await assert.rejects(collector.collect(), CollectionInProgressError);
  await first;
});

test('mantém apenas o histórico configurado', async () => {
  const { collector, runRepository } = setup({ provider: workingProvider, historyLimit: 2 });
  for (let index = 0; index < 4; index += 1) {
    await collector.collect();
  }
  assert.deepEqual(runRepository.list(10).map(({ id }) => id), [4, 3]);
});
