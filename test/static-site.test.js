import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { buildGithubLinks } from '../src/application/github-links.js';
import {
  describeSkippedCollection,
  shouldCollectForSite,
  SITE_TRIGGER,
} from '../src/application/site-collection-policy.js';
import { ValidationError } from '../src/domain/errors.js';
import { ConfigFileSettingsRepository } from '../src/infrastructure/config-file-settings-repository.js';
import { MemoryRunRepository } from '../src/infrastructure/memory-run-repository.js';
import { fetchPublishedSite } from '../src/infrastructure/site/published-site.js';

const workspace = mkdtempSync(path.join(tmpdir(), 'trend-getter-'));
after(() => rmSync(workspace, { recursive: true, force: true }));

const settings = { locationId: 'brazil', interests: [{ name: 'Futebol', keywords: [] }] };

test('o botão sempre busca, o commit nunca busca e o horário só busca se a busca automática estiver ligada', () => {
  const decide = (trigger, autoSearch = false) => shouldCollectForSite({ settings, trigger, autoSearch });

  assert.equal(decide(SITE_TRIGGER.manual), true);
  assert.equal(decide(SITE_TRIGGER.push), false);
  assert.equal(decide(SITE_TRIGGER.push, true), false);
  assert.equal(decide(SITE_TRIGGER.schedule), false);
  assert.equal(decide(SITE_TRIGGER.schedule, true), true);
  assert.equal(shouldCollectForSite({ settings: null, trigger: SITE_TRIGGER.manual, autoSearch: true }), false);
});

test('explica por que a busca não rodou', () => {
  const configFileName = 'trends.config.json';
  assert.match(describeSkippedCollection({ settings: null, trigger: 'push', configFileName }), /Sem trends\.config\.json/);
  assert.match(describeSkippedCollection({ settings, trigger: 'push', configFileName }), /Commit recebido/);
});

test('o repositório em memória continua a numeração e respeita o limite', () => {
  const repository = new MemoryRunRepository([
    { id: 1, status: 'success', startedAt: '2026-10-19T11:00:00.000Z' },
    { id: 2, status: 'error', startedAt: '2026-10-19T23:00:00.000Z' },
  ]);
  const saved = repository.insert({ status: 'success', startedAt: '2026-10-20T11:00:00.000Z' });

  assert.equal(saved.id, 3);
  assert.deepEqual(repository.lastSuccessfulRunAt(), new Date('2026-10-20T11:00:00.000Z'));
  repository.keepLatest(2);
  assert.deepEqual(repository.list(10).map(({ id }) => id), [3, 2]);
});

test('o arquivo de configuração é opcional, mas precisa ser válido', () => {
  const filePath = path.join(workspace, 'trends.config.json');
  const repository = new ConfigFileSettingsRepository(filePath);
  assert.equal(repository.load(), null);

  writeFileSync(filePath, JSON.stringify({ locationId: 'brazil', interests: [{ name: ' Futebol ' }] }));
  assert.deepEqual(repository.load(), settings);

  writeFileSync(filePath, '{ quebrado');
  assert.throws(() => repository.load(), ValidationError);
});

test('monta os links do GitHub e o disparo do workflow', () => {
  const { createToken, ...links } = buildGithubLinks({
    serverUrl: 'https://github.com',
    apiUrl: 'https://api.github.com',
    repository: 'dono/repo',
    branch: 'main',
    workflowFile: 'trends.yml',
    configFile: 'trends.config.json',
  });
  assert.deepEqual(links, {
    repository: 'https://github.com/dono/repo',
    runWorkflow: 'https://github.com/dono/repo/actions/workflows/trends.yml',
    editConfig: 'https://github.com/dono/repo/edit/main/trends.config.json',
    createConfig: 'https://github.com/dono/repo/new/main?filename=trends.config.json',
    dispatch: { url: 'https://api.github.com/repos/dono/repo/actions/workflows/trends.yml/dispatches', ref: 'main' },
  });

  const template = new URL(createToken);
  assert.equal(template.pathname, '/settings/personal-access-tokens/new');
  assert.equal(template.searchParams.get('target_name'), 'dono');
  assert.equal(template.searchParams.get('actions'), 'write');
  assert.ok(template.searchParams.get('name').length <= 40);
});

test('lê o histórico do site publicado e trata o primeiro deploy', async () => {
  const requested = [];
  const fetch = async (url) => {
    requested.push(url.pathname);
    return url.pathname.endsWith('runs.json')
      ? { ok: true, status: 200, json: async () => ({ runs: [{ id: 7 }] }) }
      : { ok: false, status: 404 };
  };
  const published = await fetchPublishedSite('https://dono.github.io/repo', fetch);

  assert.deepEqual(published, { state: null, runs: [{ id: 7 }] });
  assert.deepEqual(requested.sort(), ['/repo/data/runs.json', '/repo/data/state.json']);
  assert.deepEqual(await fetchPublishedSite(''), { state: null, runs: [] });
});

test('falha quando o site publicado está instável, para não apagar o histórico', async () => {
  const fetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(fetchPublishedSite('https://dono.github.io/repo', fetch), /status 503/);
});
