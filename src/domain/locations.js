export const DEFAULT_LOCATION_ID = 'brazil';

export const LOCATIONS = Object.freeze([
  { id: 'worldwide', name: 'Mundo', woeid: 1, trends24Path: '' },
  { id: 'brazil', name: 'Brasil', woeid: 23424768, trends24Path: 'brazil' },
  { id: 'sao-paulo', name: 'São Paulo', woeid: 455827, trends24Path: 'brazil/sao-paulo' },
  { id: 'rio-de-janeiro', name: 'Rio de Janeiro', woeid: 455825, trends24Path: 'brazil/rio-de-janeiro' },
  { id: 'belo-horizonte', name: 'Belo Horizonte', woeid: 455821, trends24Path: 'brazil/belo-horizonte' },
  { id: 'brasilia', name: 'Brasília', woeid: 455819, trends24Path: 'brazil/brasilia' },
  { id: 'curitiba', name: 'Curitiba', woeid: 455822, trends24Path: 'brazil/curitiba' },
  { id: 'porto-alegre', name: 'Porto Alegre', woeid: 455823, trends24Path: 'brazil/porto-alegre' },
  { id: 'recife', name: 'Recife', woeid: 455824, trends24Path: 'brazil/recife' },
  { id: 'salvador', name: 'Salvador', woeid: 455826, trends24Path: 'brazil/salvador' },
  { id: 'fortaleza', name: 'Fortaleza', woeid: 455830, trends24Path: 'brazil/fortaleza' },
  { id: 'portugal', name: 'Portugal', woeid: 23424925, trends24Path: 'portugal' },
  { id: 'united-states', name: 'Estados Unidos', woeid: 23424977, trends24Path: 'united-states' },
]);

const LOCATIONS_BY_ID = new Map(LOCATIONS.map((location) => [location.id, location]));

export function findLocation(id) {
  return LOCATIONS_BY_ID.get(id) ?? null;
}
