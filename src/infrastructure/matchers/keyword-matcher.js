import { compact, words } from '../../domain/text.js';

const MIN_PARTIAL_MATCH_LENGTH = 4;

export class KeywordMatcher {
  name = 'keyword';
  label = 'Palavras-chave';

  async match(trends, interests) {
    const searchableTrends = trends.map(toSearchable);
    return {
      strategy: this.name,
      matches: interests.map((interest) => matchInterest(interest, searchableTrends)),
    };
  }
}

function toSearchable(trend) {
  return { trend, joined: compact(trend.name), tokens: new Set(words(trend.name)) };
}

function matchInterest(interest, searchableTrends) {
  const terms = [interest.name, ...interest.keywords].map(createTerm).filter(Boolean);
  const trends = searchableTrends.flatMap((searchable) => {
    const term = terms.find((candidate) => candidate.matches(searchable));
    return term ? [{ ...searchable.trend, reason: `Contém "${term.label}"` }] : [];
  });
  return { interest: interest.name, trends };
}

function createTerm(label) {
  const joined = compact(label);
  if (!joined) {
    return null;
  }
  const tokens = words(label);
  const matches =
    joined.length >= MIN_PARTIAL_MATCH_LENGTH
      ? (searchable) => searchable.joined.includes(joined)
      : (searchable) => tokens.every((token) => searchable.tokens.has(token));
  return { label, matches };
}
