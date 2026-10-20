import { DailyScheduler } from './application/daily-scheduler.js';
import { PUBLIC_DIR } from './config/paths.js';
import { createContainer } from './container.js';
import { isOutdated } from './domain/schedule.js';
import { createHttpServer } from './http/http-server.js';
import { StaticFiles } from './http/static-files.js';

async function main() {
  const container = await createContainer();
  const { env, logger, settingsService, runRepository, provider, matcher, job } = container;

  const scheduler = new DailyScheduler({
    times: env.scheduleTimes,
    task: () => job.runSafely('agendada'),
    logger,
  });
  const staticFiles = await StaticFiles.load(PUBLIC_DIR);
  const server = createHttpServer({ ...container, scheduler, staticFiles });

  server.listen(env.port, env.host, () => {
    logger.info(`Trend Getter rodando em http://${env.host}:${env.port}`);
    logger.info(`Fonte: ${provider.label} | Correspondência: ${matcher.label} | Horários: ${scheduler.times.join(', ')}`);
  });

  scheduler.start();
  logger.info(`Próxima busca agendada para ${scheduler.nextRunAt.toLocaleString('pt-BR')}.`);

  if (settingsService.isConfigured() && isOutdated(runRepository.lastSuccessfulRunAt(), env.scheduleTimes, new Date())) {
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
