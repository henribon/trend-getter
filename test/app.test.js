import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { startApp } from '../src/app.js';
import { CollectionJob } from '../src/application/collection-job.js';
import { readEnv } from '../src/config/env.js';

const workspace = mkdtempSync(path.join(tmpdir(), 'trend-getter-app-'));
after(() => rmSync(workspace, { recursive: true, force: true }));

const silentLogger = { info() {}, warn() {}, error() {} };

test('sobe o servidor numa porta livre e manda para a configuração no primeiro acesso', async () => {
  const env = { ...readEnv({ DATABASE_PATH: path.join(workspace, 'app.db') }), host: '127.0.0.1', port: 0 };
  const app = await startApp(env);
  try {
    assert.match(app.url, /^http:\/\/127\.0\.0\.1:\d+$/);
    const state = await fetch(`${app.url}/api/state`).then((response) => response.json());
    assert.equal(state.configured, false);
    const home = await fetch(app.url, { redirect: 'manual' });
    assert.equal(home.headers.get('location'), '/setup.html');
  } finally {
    app.close();
  }
});

test('avisa quem acompanha as buscas terminadas', async () => {
  const run = { id: 1, status: 'success', trends: [], matches: [] };
  const job = new CollectionJob({ collector: { collect: async () => run }, logger: silentLogger });
  const finished = [];
  job.onRun((...event) => finished.push(event));

  await job.run('agendada');
  assert.deepEqual(finished, [[run, 'agendada']]);
});
