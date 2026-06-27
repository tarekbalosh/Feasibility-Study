import { SECTORS } from '../src/config/sectors';

export function getSectorConfig(sector: string) {
  const config = SECTORS[sector];
  if (!config) {
    throw new Error(`Sector ${sector} not supported`);
  }
  return config;
}
