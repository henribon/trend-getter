const SEARCH_URL = 'https://x.com/search?q=';

export function createTrend({ name, rank, tweetCount = null }) {
  return { name, rank, tweetCount, url: `${SEARCH_URL}${encodeURIComponent(name)}` };
}

export function byRank(first, second) {
  return first.rank - second.rank;
}

export function countMatchedTrends(matches) {
  return new Set(matches.flatMap(({ trends }) => trends.map(({ name }) => name))).size;
}
