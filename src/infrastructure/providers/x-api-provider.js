import { TrendSourceError } from '../../domain/errors.js';
import { createTrend } from '../../domain/trend.js';
import { requestSource } from './http-source.js';

const API_URL = 'https://api.x.com/2/trends/by/woeid';
const MAX_TRENDS = 50;

export class XApiTrendProvider {
  name = 'x-api';
  label = 'API oficial do X';
  #fetch;
  #bearerToken;

  constructor({ bearerToken, fetch = globalThis.fetch }) {
    this.#bearerToken = bearerToken;
    this.#fetch = fetch;
  }

  async fetchTrends(location) {
    const response = await requestSource({
      fetch: this.#fetch,
      url: `${API_URL}/${location.woeid}?max_trends=${MAX_TRENDS}&trend.fields=trend_name,tweet_count`,
      headers: { Authorization: `Bearer ${this.#bearerToken}` },
      label: this.label,
    });
    const { data = [] } = await response.json();
    const trends = data
      .filter(({ trend_name: name }) => name)
      .map(({ trend_name: name, tweet_count: tweetCount }, index) =>
        createTrend({ name, tweetCount: tweetCount ?? null, rank: index + 1 }),
      );
    if (trends.length === 0) {
      throw new TrendSourceError('A API do X não retornou trends para este local.');
    }
    return trends;
  }
}
