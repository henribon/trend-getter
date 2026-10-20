import { Trends24Provider } from './trends24-provider.js';
import { XApiTrendProvider } from './x-api-provider.js';

export function createTrendProvider(env) {
  const wantsXApi = env.trendProvider === 'x' || (env.trendProvider === 'auto' && Boolean(env.xBearerToken));
  if (!wantsXApi) {
    return new Trends24Provider();
  }
  if (!env.xBearerToken) {
    throw new Error('TREND_PROVIDER=x exige a variável X_BEARER_TOKEN.');
  }
  return new XApiTrendProvider({ bearerToken: env.xBearerToken });
}
