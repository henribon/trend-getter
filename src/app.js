import { DailyScheduler } from './application/daily-scheduler.js';
import { ManualScheduler } from './application/manual-scheduler.js';
import { readEnv } from './config/env.js';
import { PUBLIC_DIR } from './config/paths.js';
import { createContainer } from './container.js';
import { isOutdated } from './domain/schedule.js';
import { createHttpServer } from './http/http-server.js';
import { StaticFiles } from './http/static-files.js';

function createScheduler({ env, job, logger }) {
  if (!env.autoSearch) {
    return new ManualScheduler();
  }
  return new DailyScheduler({ times: env.scheduleTimes, task: () => job.runSafely('agendada'), logger });
}

function describeSchedule(scheduler) {
  return scheduler.isAutomatic
    ? `automática às ${scheduler.times.join(', ')} (próxima: ${scheduler.nextRunAt.toLocaleString('pt-BR')})`
    : 'manual, pelo botão Buscar agora';
}

function listen(server, { port, host }) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
}

export async function startApp(env = readEnv()) {
  const container = await createContainer(env);
  const { logger, settingsService, runRepository, provider, matcher, job } = container;

  const scheduler = createScheduler(container);
  const staticFiles = await StaticFiles.load(PUBLIC_DIR);
  const server = createHttpServer({ ...container, scheduler, staticFiles });
  await listen(server, env);
  const url = `http://${env.host}:${server.address().port}`;

  const runMissedSearch = () => {
    const missed = isOutdated(runRepository.lastSuccessfulRunAt(), env.scheduleTimes, new Date());
    if (scheduler.isAutomatic && settingsService.isConfigured() && missed) {
      job.runSafely('recuperação de horário perdido');
    }
  };

  scheduler.start();
  logger.info(`Trend Getter rodando em ${url}`);
  logger.info(`Fonte: ${provider.label} | Correspondência: ${matcher.label} | Busca: ${describeSchedule(scheduler)}`);
  runMissedSearch();

  return {
    url,
    job,
    // O relógio dos timers para enquanto o computador dorme: ao acordar, refaz a agenda e busca o horário perdido.
    resume() {
      scheduler.stop();
      scheduler.start();
      runMissedSearch();
    },
    close() {
      scheduler.stop();
      server.close();
      container.close();
    },
  };
}
