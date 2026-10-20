import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTrends24Html } from '../src/infrastructure/providers/trends24-parser.js';

const html = `
  <h3 class=title data-timestamp=1792496381.719>Tue Oct 20 2026 11:39:41 GMT+0000</h3>
  <ol class=trend-card__list>
    <li><span class=trend-name><a href="https://twitter.com/search?q=Felca" class=trend-link>Felca</a><span class=tweet-count data-count=""></span></span></li>
    <li><span class=trend-name><a href="https://twitter.com/search?q=%23TomandJerry" class=trend-link>#Tom&amp;Jerry</a><span class=tweet-count data-count="125000"></span></span></li>
    <li><span class=trend-name><a href="https://twitter.com/search?q=Caf%C3%A9" class=trend-link>Caf&#233; com Leite</a><span class=tweet-count data-count=""></span></span></li>
  </ol>
  <h3 class=title data-timestamp=1792493289.14>Tue Oct 20 2026 10:48:09 GMT+0000</h3>
  <ol class=trend-card__list>
    <li><span class=trend-name><a href="https://twitter.com/search?q=Antiga" class=trend-link>Antiga</a></span></li>
  </ol>
`;

test('lê apenas o cartão mais recente, com posição, nome e volume', () => {
  const trends = parseTrends24Html(html);
  assert.deepEqual(
    trends.map(({ rank, name, tweetCount }) => ({ rank, name, tweetCount })),
    [
      { rank: 1, name: 'Felca', tweetCount: null },
      { rank: 2, name: '#Tom&Jerry', tweetCount: 125000 },
      { rank: 3, name: 'Café com Leite', tweetCount: null },
    ],
  );
});

test('monta o link de busca no X', () => {
  const [, second] = parseTrends24Html(html);
  assert.equal(second.url, 'https://x.com/search?q=%23Tom%26Jerry');
});

test('retorna lista vazia quando o layout não é reconhecido', () => {
  assert.deepEqual(parseTrends24Html('<html><body>sem trends</body></html>'), []);
});
