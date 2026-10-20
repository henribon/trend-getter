import { createTrend } from '../../domain/trend.js';
import { decodeHtmlEntities } from './html-entities.js';

const LATEST_CARD = /<ol[^>]*class="?trend-card__list"?[^>]*>([\s\S]*?)<\/ol>/;
const LIST_ITEM = /<li[^>]*>([\s\S]*?)<\/li>/g;
const TREND_NAME = /class="?trend-link"?[^>]*>([^<]+)<\/a>/;
const TWEET_COUNT = /data-count="(\d+)"/;

export function parseTrends24Html(html) {
  const card = LATEST_CARD.exec(html)?.[1] ?? '';
  return [...card.matchAll(LIST_ITEM)]
    .map(([, item]) => ({ name: extractName(item), tweetCount: extractTweetCount(item) }))
    .filter(({ name }) => name)
    .map((entry, index) => createTrend({ ...entry, rank: index + 1 }));
}

function extractName(item) {
  const raw = TREND_NAME.exec(item)?.[1];
  return raw ? decodeHtmlEntities(raw).trim() : '';
}

function extractTweetCount(item) {
  const raw = TWEET_COUNT.exec(item)?.[1];
  return raw ? Number(raw) : null;
}
