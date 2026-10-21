import { parseTimes } from '../domain/schedule.js';
import { resolveFromRoot } from './paths.js';

const DEFAULTS = Object.freeze({
  port: 3000,
  host: '127.0.0.1',
  databasePath: 'data/trend-getter.db',
  scheduleTimes: '08:00,20:00',
  trendProvider: 'auto',
  matcher: 'auto',
  anthropicModel: 'claude-opus-5-5',
  historyLimit: 60,
});

export function readEnv(source = process.env) {
  return Object.freeze({
    port: toPositiveInteger(source.PORT, DEFAULTS.port),
    host: source.HOST || DEFAULTS.host,
    databasePath: resolveFromRoot(source.DATABASE_PATH || DEFAULTS.databasePath),
    autoSearch: source.AUTO_SEARCH === 'true',
    scheduleTimes: parseTimes(source.SCHEDULE_TIMES || DEFAULTS.scheduleTimes),
    trendProvider: pickOption('TREND_PROVIDER', source.TREND_PROVIDER, ['auto', 'trends24', 'x'], DEFAULTS.trendProvider),
    xBearerToken: source.X_BEARER_TOKEN || '',
    matcher: pickOption('MATCHER', source.MATCHER, ['auto', 'keyword', 'ai'], DEFAULTS.matcher),
    anthropicApiKey: source.ANTHROPIC_API_KEY || '',
    anthropicModel: source.ANTHROPIC_MODEL || DEFAULTS.anthropicModel,
    historyLimit: toPositiveInteger(source.HISTORY_LIMIT, DEFAULTS.historyLimit),
  });
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function pickOption(name, value, options, fallback) {
  if (!value) {
    return fallback;
  }
  if (!options.includes(value)) {
    throw new Error(`${name} inválido: "${value}". Use um destes valores: ${options.join(', ')}.`);
  }
  return value;
}
