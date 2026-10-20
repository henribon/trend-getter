import { readEnv } from './config/env.js';
import { openDatabase } from './infrastructure/database.js';
import { createLogger } from './infrastructure/logger.js';
import { RunRepository } from './infrastructure/run-repository.js';
import { SettingsRepository } from './infrastructure/settings-repository.js';
import { createServices } from './services.js';

export async function createContainer(env = readEnv()) {
  const logger = createLogger();
  const database = openDatabase(env.databasePath);
  const services = await createServices({
    env,
    logger,
    settingsRepository: new SettingsRepository(database),
    runRepository: new RunRepository(database),
  });
  return { env, logger, ...services, close: () => database.close() };
}
