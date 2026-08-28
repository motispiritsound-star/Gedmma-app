import type { LocalizedText } from '../locales.js';

/** The twelve provinces of the Netherlands. */
export const PROVINCES = [
  'DRENTHE',
  'FLEVOLAND',
  'FRIESLAND',
  'GELDERLAND',
  'GRONINGEN',
  'LIMBURG',
  'NOORD_BRABANT',
  'NOORD_HOLLAND',
  'OVERIJSSEL',
  'UTRECHT',
  'ZEELAND',
  'ZUID_HOLLAND',
] as const;

export type Province = (typeof PROVINCES)[number];

export const PROVINCE_NAMES: Record<Province, LocalizedText> = {
  DRENTHE: { nl: 'Drenthe', en: 'Drenthe' },
  FLEVOLAND: { nl: 'Flevoland', en: 'Flevoland' },
  FRIESLAND: { nl: 'Friesland', en: 'Friesland' },
  GELDERLAND: { nl: 'Gelderland', en: 'Gelderland' },
  GRONINGEN: { nl: 'Groningen', en: 'Groningen' },
  LIMBURG: { nl: 'Limburg', en: 'Limburg' },
  NOORD_BRABANT: { nl: 'Noord-Brabant', en: 'North Brabant' },
  NOORD_HOLLAND: { nl: 'Noord-Holland', en: 'North Holland' },
  OVERIJSSEL: { nl: 'Overijssel', en: 'Overijssel' },
  UTRECHT: { nl: 'Utrecht', en: 'Utrecht' },
  ZEELAND: { nl: 'Zeeland', en: 'Zeeland' },
  ZUID_HOLLAND: { nl: 'Zuid-Holland', en: 'South Holland' },
};

export interface CitySeed {
  slug: string;
  name: LocalizedText;
  province: Province;
  lat: number;
  lng: number;
  /** Rough population, used only to order pickers so big cities surface first. */
  population: number;
}

/**
 * The places Buurklus covers: every municipality above roughly 60,000 people,
 * plus the provincial capitals, so no province is left without a city in the
 * picker.
 */
export const CITIES: readonly CitySeed[] = [
  { slug: 'amsterdam', name: { nl: 'Amsterdam', en: 'Amsterdam' }, province: 'NOORD_HOLLAND', lat: 52.3676, lng: 4.9041, population: 921402 },
  { slug: 'rotterdam', name: { nl: 'Rotterdam', en: 'Rotterdam' }, province: 'ZUID_HOLLAND', lat: 51.9244, lng: 4.4777, population: 664311 },
  { slug: 'den-haag', name: { nl: 'Den Haag', en: 'The Hague' }, province: 'ZUID_HOLLAND', lat: 52.0705, lng: 4.3007, population: 566221 },
  { slug: 'utrecht', name: { nl: 'Utrecht', en: 'Utrecht' }, province: 'UTRECHT', lat: 52.0907, lng: 5.1214, population: 367984 },
  { slug: 'eindhoven', name: { nl: 'Eindhoven', en: 'Eindhoven' }, province: 'NOORD_BRABANT', lat: 51.4416, lng: 5.4697, population: 246443 },
  { slug: 'groningen', name: { nl: 'Groningen', en: 'Groningen' }, province: 'GRONINGEN', lat: 53.2194, lng: 6.5665, population: 240697 },
  { slug: 'tilburg', name: { nl: 'Tilburg', en: 'Tilburg' }, province: 'NOORD_BRABANT', lat: 51.5555, lng: 5.0913, population: 226094 },
  { slug: 'almere', name: { nl: 'Almere', en: 'Almere' }, province: 'FLEVOLAND', lat: 52.3508, lng: 5.2647, population: 224667 },
  { slug: 'breda', name: { nl: 'Breda', en: 'Breda' }, province: 'NOORD_BRABANT', lat: 51.5719, lng: 4.7683, population: 187642 },
  { slug: 'nijmegen', name: { nl: 'Nijmegen', en: 'Nijmegen' }, province: 'GELDERLAND', lat: 51.8126, lng: 5.8372, population: 182773 },
  { slug: 'apeldoorn', name: { nl: 'Apeldoorn', en: 'Apeldoorn' }, province: 'GELDERLAND', lat: 52.2112, lng: 5.9699, population: 165525 },
  { slug: 'haarlem', name: { nl: 'Haarlem', en: 'Haarlem' }, province: 'NOORD_HOLLAND', lat: 52.3874, lng: 4.6462, population: 165396 },
  { slug: 'arnhem', name: { nl: 'Arnhem', en: 'Arnhem' }, province: 'GELDERLAND', lat: 51.9851, lng: 5.8987, population: 165359 },
  { slug: 'enschede', name: { nl: 'Enschede', en: 'Enschede' }, province: 'OVERIJSSEL', lat: 52.2215, lng: 6.8937, population: 160979 },
  { slug: 'amersfoort', name: { nl: 'Amersfoort', en: 'Amersfoort' }, province: 'UTRECHT', lat: 52.1561, lng: 5.3878, population: 160902 },
  { slug: 'zaanstad', name: { nl: 'Zaanstad', en: 'Zaanstad' }, province: 'NOORD_HOLLAND', lat: 52.4389, lng: 4.8267, population: 158580 },
  { slug: 'den-bosch', name: { nl: "'s-Hertogenbosch", en: 'Den Bosch' }, province: 'NOORD_BRABANT', lat: 51.6978, lng: 5.3037, population: 158090 },
  { slug: 'zwolle', name: { nl: 'Zwolle', en: 'Zwolle' }, province: 'OVERIJSSEL', lat: 52.5168, lng: 6.0830, population: 132228 },
  { slug: 'zoetermeer', name: { nl: 'Zoetermeer', en: 'Zoetermeer' }, province: 'ZUID_HOLLAND', lat: 52.0575, lng: 4.4931, population: 126070 },
  { slug: 'leiden', name: { nl: 'Leiden', en: 'Leiden' }, province: 'ZUID_HOLLAND', lat: 52.1601, lng: 4.4970, population: 127046 },
  { slug: 'leeuwarden', name: { nl: 'Leeuwarden', en: 'Leeuwarden' }, province: 'FRIESLAND', lat: 53.2012, lng: 5.7999, population: 125983 },
  { slug: 'maastricht', name: { nl: 'Maastricht', en: 'Maastricht' }, province: 'LIMBURG', lat: 50.8514, lng: 5.6910, population: 121565 },
  { slug: 'dordrecht', name: { nl: 'Dordrecht', en: 'Dordrecht' }, province: 'ZUID_HOLLAND', lat: 51.8133, lng: 4.6901, population: 121344 },
  { slug: 'ede', name: { nl: 'Ede', en: 'Ede' }, province: 'GELDERLAND', lat: 52.0333, lng: 5.6667, population: 120000 },
  { slug: 'alphen-aan-den-rijn', name: { nl: 'Alphen aan den Rijn', en: 'Alphen aan den Rijn' }, province: 'ZUID_HOLLAND', lat: 52.1290, lng: 4.6550, population: 113000 },
  { slug: 'alkmaar', name: { nl: 'Alkmaar', en: 'Alkmaar' }, province: 'NOORD_HOLLAND', lat: 52.6324, lng: 4.7534, population: 111000 },
  { slug: 'emmen', name: { nl: 'Emmen', en: 'Emmen' }, province: 'DRENTHE', lat: 52.7792, lng: 6.9069, population: 107000 },
  { slug: 'delft', name: { nl: 'Delft', en: 'Delft' }, province: 'ZUID_HOLLAND', lat: 52.0116, lng: 4.3571, population: 104000 },
  { slug: 'venlo', name: { nl: 'Venlo', en: 'Venlo' }, province: 'LIMBURG', lat: 51.3704, lng: 6.1724, population: 102000 },
  { slug: 'deventer', name: { nl: 'Deventer', en: 'Deventer' }, province: 'OVERIJSSEL', lat: 52.2551, lng: 6.1639, population: 101000 },
  { slug: 'helmond', name: { nl: 'Helmond', en: 'Helmond' }, province: 'NOORD_BRABANT', lat: 51.4793, lng: 5.6570, population: 95000 },
  { slug: 'hilversum', name: { nl: 'Hilversum', en: 'Hilversum' }, province: 'NOORD_HOLLAND', lat: 52.2292, lng: 5.1669, population: 92000 },
  { slug: 'heerlen', name: { nl: 'Heerlen', en: 'Heerlen' }, province: 'LIMBURG', lat: 50.8882, lng: 5.9795, population: 87000 },
  { slug: 'amstelveen', name: { nl: 'Amstelveen', en: 'Amstelveen' }, province: 'NOORD_HOLLAND', lat: 52.3114, lng: 4.8701, population: 92000 },
  { slug: 'oss', name: { nl: 'Oss', en: 'Oss' }, province: 'NOORD_BRABANT', lat: 51.7650, lng: 5.5197, population: 93000 },
  { slug: 'purmerend', name: { nl: 'Purmerend', en: 'Purmerend' }, province: 'NOORD_HOLLAND', lat: 52.5050, lng: 4.9592, population: 82000 },
  { slug: 'schiedam', name: { nl: 'Schiedam', en: 'Schiedam' }, province: 'ZUID_HOLLAND', lat: 51.9192, lng: 4.3887, population: 79000 },
  { slug: 'roosendaal', name: { nl: 'Roosendaal', en: 'Roosendaal' }, province: 'NOORD_BRABANT', lat: 51.5308, lng: 4.4653, population: 77000 },
  { slug: 'gouda', name: { nl: 'Gouda', en: 'Gouda' }, province: 'ZUID_HOLLAND', lat: 52.0115, lng: 4.7104, population: 74000 },
  { slug: 'almelo', name: { nl: 'Almelo', en: 'Almelo' }, province: 'OVERIJSSEL', lat: 52.3564, lng: 6.6626, population: 73000 },
  { slug: 'vlaardingen', name: { nl: 'Vlaardingen', en: 'Vlaardingen' }, province: 'ZUID_HOLLAND', lat: 51.9123, lng: 4.3419, population: 73000 },
  { slug: 'assen', name: { nl: 'Assen', en: 'Assen' }, province: 'DRENTHE', lat: 52.9925, lng: 6.5649, population: 69000 },
  { slug: 'lelystad', name: { nl: 'Lelystad', en: 'Lelystad' }, province: 'FLEVOLAND', lat: 52.5185, lng: 5.4714, population: 81000 },
  { slug: 'middelburg', name: { nl: 'Middelburg', en: 'Middelburg' }, province: 'ZEELAND', lat: 51.4988, lng: 3.6136, population: 49000 },
  { slug: 'vlissingen', name: { nl: 'Vlissingen', en: 'Flushing' }, province: 'ZEELAND', lat: 51.4426, lng: 3.5736, population: 44000 },
  { slug: 'sneek', name: { nl: 'Sneek', en: 'Sneek' }, province: 'FRIESLAND', lat: 53.0326, lng: 5.6581, population: 34000 },
];

export const CITY_BY_SLUG: ReadonlyMap<string, CitySeed> = new Map(
  CITIES.map((city) => [city.slug, city]),
);

export function citiesInProvince(province: Province): CitySeed[] {
  return CITIES.filter((city) => city.province === province);
}
