import { DailyScheduler } from './application/daily-scheduler.js';
import { ManualScheduler } from './application/manual-scheduler.js';
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

async function main() {
  const container = await createContainer();
  const { env, logger, settingsService, runRepository, provider, matcher, job } = container;

  const scheduler = createScheduler(container);
  const staticFiles = await StaticFiles.load(PUBLIC_DIR);
  const server = createHttpServer({ ...container, scheduler, staticFiles });

  scheduler.start();
  server.listen(env.port, env.host, () => {
    logger.info(`Trend Getter rodando em http://${env.host}:${env.port}`);
    logger.info(`Fonte: ${provider.label} | Correspondência: ${matcher.label} | Busca: ${describeSchedule(scheduler)}`);
  });

  const missedScheduledRun = isOutdated(runRepository.lastSuccessfulRunAt(), env.scheduleTimes, new Date());
  if (scheduler.isAutomatic && settingsService.isConfigured() && missedScheduledRun) {
    job.runSafely('recuperação de horário perdido');
  }

  const shutdown = () => {
    scheduler.stop();
    server.close();
    container.close();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
