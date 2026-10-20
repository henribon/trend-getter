import { HybridMatcher } from './hybrid-matcher.js';
import { KeywordMatcher } from './keyword-matcher.js';

export async function createMatcher(env, logger) {
  const keywordMatcher = new KeywordMatcher();
  if (!shouldUseAi(env)) {
    return keywordMatcher;
  }
  const { ClaudeMatcher } = await import('./claude-matcher.js');
  return new HybridMatcher({
    primary: new ClaudeMatcher({ model: env.anthropicModel }),
    fallback: keywordMatcher,
    logger,
  });
}

function shouldUseAi(env) {
  return env.matcher === 'ai' || (env.matcher === 'auto' && Boolean(env.anthropicApiKey));
}
