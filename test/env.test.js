import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ManualScheduler } from '../src/application/manual-scheduler.js';
import { readEnv } from '../src/config/env.js';

test('a busca automática fica desligada por padrão', () => {
  assert.equal(readEnv({}).autoSearch, false);
  assert.equal(readEnv({ AUTO_SEARCH: 'false' }).autoSearch, false);
  assert.equal(readEnv({ AUTO_SEARCH: 'true' }).autoSearch, true);
});

test('no modo manual não há horário agendado', () => {
  const scheduler = new ManualScheduler();
  scheduler.start();
  assert.equal(scheduler.isAutomatic, false);
  assert.deepEqual(scheduler.times, []);
  assert.equal(scheduler.nextRunAt, null);
});
