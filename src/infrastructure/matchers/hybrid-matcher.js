import { byRank } from '../../domain/trend.js';

export class HybridMatcher {
  #primary;
  #fallback;
  #logger;

  constructor({ primary, fallback, logger }) {
    this.#primary = primary;
    this.#fallback = fallback;
    this.#logger = logger;
    this.name = `${primary.name}+${fallback.name}`;
    this.label = `${primary.label} + ${fallback.label.toLowerCase()}`;
  }

  async match(trends, interests) {
    const fallbackResult = await this.#fallback.match(trends, interests);
    try {
      const primaryResult = await this.#primary.match(trends, interests);
      return { strategy: this.name, matches: mergeMatches(primaryResult.matches, fallbackResult.matches) };
    } catch (error) {
      const warning = `${this.#primary.label} indisponível (${error.message}). Usando apenas ${this.#fallback.label.toLowerCase()}.`;
      this.#logger.warn(warning);
      return { ...fallbackResult, warning };
    }
  }
}

function mergeMatches(preferred, complementary) {
  return preferred.map((group, index) => ({
    interest: group.interest,
    trends: unionByName(complementary[index].trends, group.trends),
  }));
}

function unionByName(base, overriding) {
  return [...new Map([...base, ...overriding].map((trend) => [trend.name, trend])).values()].sort(byRank);
}
