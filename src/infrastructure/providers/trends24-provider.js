import { TrendSourceError } from '../../domain/errors.js';
import { requestSource } from './http-source.js';
import { parseTrends24Html } from './trends24-parser.js';

const BASE_URL = 'https://trends24.in';

const REQUEST_HEADERS = Object.freeze({
  Accept: 'text/html',
  'User-Agent': 'Mozilla/5.0 (compatible; TrendGetter/1.0)',
});

export class Trends24Provider {
  name = 'trends24';
  label = 'trends24.in';
  #fetch;
  #baseUrl;

  constructor({ fetch = globalThis.fetch, baseUrl = BASE_URL } = {}) {
    this.#fetch = fetch;
    this.#baseUrl = baseUrl;
  }

  async fetchTrends(location) {
    const path = location.trends24Path ? `${location.trends24Path}/` : '';
    const response = await requestSource({
      fetch: this.#fetch,
      url: `${this.#baseUrl}/${path}`,
      headers: REQUEST_HEADERS,
      label: this.label,
    });
    const trends = parseTrends24Html(await response.text());
    if (trends.length === 0) {
      throw new TrendSourceError('Nenhuma trend encontrada no trends24.in. O layout da página pode ter mudado.');
    }
    return trends;
  }
}
