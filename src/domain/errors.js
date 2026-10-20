export class ValidationError extends Error {
  name = 'ValidationError';
}

export class NotConfiguredError extends Error {
  name = 'NotConfiguredError';

  constructor() {
    super('Configure seus interesses antes de buscar as trends.');
  }
}

export class CollectionInProgressError extends Error {
  name = 'CollectionInProgressError';

  constructor() {
    super('Já existe uma busca de trends em andamento.');
  }
}

export class TrendSourceError extends Error {
  name = 'TrendSourceError';
}

export class MatchingError extends Error {
  name = 'MatchingError';
}
