import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { DesktopSettingsFile, readDesktopEnv } from '../src/desktop/desktop-settings.js';
import { describeRunNotification } from '../src/desktop/run-notification.js';

const workspace = mkdtempSync(path.join(tmpdir(), 'trend-getter-desktop-'));
after(() => rmSync(workspace, { recursive: true, force: true }));

function settingsFileAt(name) {
  return new DesktopSettingsFile(path.join(workspace, `${name}.env`));
}

test('cria o arquivo de configurações com a busca automática desligada', () => {
  const settingsFile = new DesktopSettingsFile(path.join(workspace, 'Trend Getter', 'configuracoes.env'));
  assert.equal(settingsFile.read().AUTO_SEARCH, 'false');
  assert.match(readFileSync(settingsFile.path, 'utf8'), /ANTHROPIC_API_KEY=/);
});

test('liga e desliga a busca automática sem mexer no resto do arquivo', () => {
  const settingsFile = settingsFileAt('alternar');
  settingsFile.read();
  settingsFile.setAutoSearch(true);
  assert.equal(settingsFile.read().AUTO_SEARCH, 'true');
  assert.equal(settingsFile.read().SCHEDULE_TIMES, '08:00,20:00');

  writeFileSync(settingsFile.path, 'SCHEDULE_TIMES=07:00\n');
  settingsFile.setAutoSearch(false);
  assert.equal(readFileSync(settingsFile.path, 'utf8'), 'SCHEDULE_TIMES=07:00\nAUTO_SEARCH=false\n');
});

test('o app do Mac guarda o banco na pasta do app e escuta só no próprio computador', () => {
  const settingsFile = settingsFileAt('ambiente');
  writeFileSync(settingsFile.path, 'AUTO_SEARCH=true\nANTHROPIC_API_KEY=\nSCHEDULE_TIMES=09:30\n');
  const processEnv = { ANTHROPIC_API_KEY: 'chave-do-terminal' };
  const env = readDesktopEnv({ settingsFile, dataDir: '/dados', processEnv });

  assert.equal(env.databasePath, path.resolve('/dados/trend-getter.db'));
  assert.equal(env.host, '127.0.0.1');
  assert.equal(env.port, 0);
  assert.equal(env.autoSearch, true);
  assert.deepEqual(env.scheduleTimes.map(({ label }) => label), ['09:30']);
  assert.equal(processEnv.ANTHROPIC_API_KEY, 'chave-do-terminal');
  assert.equal(processEnv.AUTO_SEARCH, 'true');
});

test('a notificação lista as trends ligadas a cada assunto', () => {
  const trend = (name) => ({ name });
  const run = {
    status: 'success',
    matches: [
      { interest: 'Futebol', trends: ['Botafogo', 'Libertadores', 'Flamengo', 'Brasileirão'].map(trend) },
      { interest: 'Política', trends: [] },
      { interest: 'Esportes', trends: [trend('Botafogo')] },
    ],
  };
  assert.deepEqual(describeRunNotification(run), {
    title: '4 trends sobre seus assuntos',
    body: 'Futebol: Botafogo, Libertadores, Flamengo e mais 1\nEsportes: Botafogo',
  });
});

test('sem trends relacionadas não há notificação, mas uma falha sempre avisa', () => {
  assert.equal(describeRunNotification({ status: 'success', matches: [{ interest: 'Futebol', trends: [] }] }), null);
  assert.deepEqual(describeRunNotification({ status: 'error', error: 'trends24.in respondeu com status 403.' }), {
    title: 'A busca de trends falhou',
    body: 'trends24.in respondeu com status 403.',
  });
});
