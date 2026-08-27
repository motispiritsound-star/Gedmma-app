import type { LocalizedText } from '../locales.js';

/** The twelve administrative regions of Morocco. */
export const REGIONS = [
  'TANGER_TETOUAN_AL_HOCEIMA',
  'ORIENTAL',
  'FES_MEKNES',
  'RABAT_SALE_KENITRA',
  'BENI_MELLAL_KHENIFRA',
  'CASABLANCA_SETTAT',
  'MARRAKECH_SAFI',
  'DRAA_TAFILALET',
  'SOUSS_MASSA',
  'GUELMIM_OUED_NOUN',
  'LAAYOUNE_SAKIA_EL_HAMRA',
  'DAKHLA_OUED_ED_DAHAB',
] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_NAMES: Record<Region, LocalizedText> = {
  TANGER_TETOUAN_AL_HOCEIMA: {
    fr: 'Tanger-Tétouan-Al Hoceïma',
    ar: 'طنجة تطوان الحسيمة',
    en: 'Tangier-Tetouan-Al Hoceima',
  },
  ORIENTAL: { fr: "L'Oriental", ar: 'الشرق', en: 'Oriental' },
  FES_MEKNES: { fr: 'Fès-Meknès', ar: 'فاس مكناس', en: 'Fes-Meknes' },
  RABAT_SALE_KENITRA: {
    fr: 'Rabat-Salé-Kénitra',
    ar: 'الرباط سلا القنيطرة',
    en: 'Rabat-Sale-Kenitra',
  },
  BENI_MELLAL_KHENIFRA: {
    fr: 'Béni Mellal-Khénifra',
    ar: 'بني ملال خنيفرة',
    en: 'Beni Mellal-Khenifra',
  },
  CASABLANCA_SETTAT: {
    fr: 'Casablanca-Settat',
    ar: 'الدار البيضاء سطات',
    en: 'Casablanca-Settat',
  },
  MARRAKECH_SAFI: { fr: 'Marrakech-Safi', ar: 'مراكش آسفي', en: 'Marrakech-Safi' },
  DRAA_TAFILALET: { fr: 'Drâa-Tafilalet', ar: 'درعة تافيلالت', en: 'Draa-Tafilalet' },
  SOUSS_MASSA: { fr: 'Souss-Massa', ar: 'سوس ماسة', en: 'Souss-Massa' },
  GUELMIM_OUED_NOUN: { fr: 'Guelmim-Oued Noun', ar: 'كلميم واد نون', en: 'Guelmim-Oued Noun' },
  LAAYOUNE_SAKIA_EL_HAMRA: {
    fr: 'Laâyoune-Sakia El Hamra',
    ar: 'العيون الساقية الحمراء',
    en: 'Laayoune-Sakia El Hamra',
  },
  DAKHLA_OUED_ED_DAHAB: {
    fr: 'Dakhla-Oued Ed-Dahab',
    ar: 'الداخلة وادي الذهب',
    en: 'Dakhla-Oued Ed-Dahab',
  },
};

export interface CitySeed {
  slug: string;
  name: LocalizedText;
  region: Region;
  lat: number;
  lng: number;
  /** Rough population, used only to order pickers so big cities surface first. */
  population: number;
}

export const CITIES: readonly CitySeed[] = [
  { slug: 'casablanca', name: { fr: 'Casablanca', ar: 'الدار البيضاء', en: 'Casablanca' }, region: 'CASABLANCA_SETTAT', lat: 33.5731, lng: -7.5898, population: 3359818 },
  { slug: 'fes', name: { fr: 'Fès', ar: 'فاس', en: 'Fes' }, region: 'FES_MEKNES', lat: 34.0331, lng: -5.0003, population: 1112072 },
  { slug: 'tanger', name: { fr: 'Tanger', ar: 'طنجة', en: 'Tangier' }, region: 'TANGER_TETOUAN_AL_HOCEIMA', lat: 35.7595, lng: -5.834, population: 1065601 },
  { slug: 'marrakech', name: { fr: 'Marrakech', ar: 'مراكش', en: 'Marrakech' }, region: 'MARRAKECH_SAFI', lat: 31.6295, lng: -7.9811, population: 928850 },
  { slug: 'sale', name: { fr: 'Salé', ar: 'سلا', en: 'Sale' }, region: 'RABAT_SALE_KENITRA', lat: 34.0531, lng: -6.7985, population: 890403 },
  { slug: 'meknes', name: { fr: 'Meknès', ar: 'مكناس', en: 'Meknes' }, region: 'FES_MEKNES', lat: 33.8935, lng: -5.5473, population: 632079 },
  { slug: 'rabat', name: { fr: 'Rabat', ar: 'الرباط', en: 'Rabat' }, region: 'RABAT_SALE_KENITRA', lat: 34.0209, lng: -6.8416, population: 577827 },
  { slug: 'oujda', name: { fr: 'Oujda', ar: 'وجدة', en: 'Oujda' }, region: 'ORIENTAL', lat: 34.6867, lng: -1.9114, population: 494252 },
  { slug: 'kenitra', name: { fr: 'Kénitra', ar: 'القنيطرة', en: 'Kenitra' }, region: 'RABAT_SALE_KENITRA', lat: 34.261, lng: -6.5802, population: 431282 },
  { slug: 'agadir', name: { fr: 'Agadir', ar: 'أكادير', en: 'Agadir' }, region: 'SOUSS_MASSA', lat: 30.4278, lng: -9.5981, population: 421844 },
  { slug: 'tetouan', name: { fr: 'Tétouan', ar: 'تطوان', en: 'Tetouan' }, region: 'TANGER_TETOUAN_AL_HOCEIMA', lat: 35.5785, lng: -5.3684, population: 380787 },
  { slug: 'temara', name: { fr: 'Témara', ar: 'تمارة', en: 'Temara' }, region: 'RABAT_SALE_KENITRA', lat: 33.9287, lng: -6.9067, population: 313510 },
  { slug: 'safi', name: { fr: 'Safi', ar: 'آسفي', en: 'Safi' }, region: 'MARRAKECH_SAFI', lat: 32.2994, lng: -9.2372, population: 308508 },
  { slug: 'mohammedia', name: { fr: 'Mohammédia', ar: 'المحمدية', en: 'Mohammedia' }, region: 'CASABLANCA_SETTAT', lat: 33.6861, lng: -7.3829, population: 208612 },
  { slug: 'khouribga', name: { fr: 'Khouribga', ar: 'خريبكة', en: 'Khouribga' }, region: 'BENI_MELLAL_KHENIFRA', lat: 32.8811, lng: -6.9063, population: 196196 },
  { slug: 'el-jadida', name: { fr: 'El Jadida', ar: 'الجديدة', en: 'El Jadida' }, region: 'CASABLANCA_SETTAT', lat: 33.2549, lng: -8.5079, population: 194934 },
  { slug: 'beni-mellal', name: { fr: 'Béni Mellal', ar: 'بني ملال', en: 'Beni Mellal' }, region: 'BENI_MELLAL_KHENIFRA', lat: 32.3373, lng: -6.3498, population: 192676 },
  { slug: 'nador', name: { fr: 'Nador', ar: 'الناظور', en: 'Nador' }, region: 'ORIENTAL', lat: 35.1681, lng: -2.9335, population: 161726 },
  { slug: 'taza', name: { fr: 'Taza', ar: 'تازة', en: 'Taza' }, region: 'FES_MEKNES', lat: 34.21, lng: -4.01, population: 148456 },
  { slug: 'settat', name: { fr: 'Settat', ar: 'سطات', en: 'Settat' }, region: 'CASABLANCA_SETTAT', lat: 33.0018, lng: -7.6166, population: 142250 },
  { slug: 'berrechid', name: { fr: 'Berrechid', ar: 'برشيد', en: 'Berrechid' }, region: 'CASABLANCA_SETTAT', lat: 33.2655, lng: -7.5877, population: 136634 },
  { slug: 'khemisset', name: { fr: 'Khémisset', ar: 'الخميسات', en: 'Khemisset' }, region: 'RABAT_SALE_KENITRA', lat: 33.8242, lng: -6.0658, population: 131542 },
  { slug: 'larache', name: { fr: 'Larache', ar: 'العرائش', en: 'Larache' }, region: 'TANGER_TETOUAN_AL_HOCEIMA', lat: 35.1932, lng: -6.1557, population: 125008 },
  { slug: 'guelmim', name: { fr: 'Guelmim', ar: 'كلميم', en: 'Guelmim' }, region: 'GUELMIM_OUED_NOUN', lat: 28.987, lng: -10.0574, population: 118318 },
  { slug: 'berkane', name: { fr: 'Berkane', ar: 'بركان', en: 'Berkane' }, region: 'ORIENTAL', lat: 34.9218, lng: -2.3199, population: 109237 },
  { slug: 'taourirt', name: { fr: 'Taourirt', ar: 'تاوريرت', en: 'Taourirt' }, region: 'ORIENTAL', lat: 34.4075, lng: -2.8975, population: 103398 },
  { slug: 'laayoune', name: { fr: 'Laâyoune', ar: 'العيون', en: 'Laayoune' }, region: 'LAAYOUNE_SAKIA_EL_HAMRA', lat: 27.1536, lng: -13.2033, population: 217732 },
  { slug: 'dakhla', name: { fr: 'Dakhla', ar: 'الداخلة', en: 'Dakhla' }, region: 'DAKHLA_OUED_ED_DAHAB', lat: 23.6848, lng: -15.958, population: 106277 },
  { slug: 'errachidia', name: { fr: 'Errachidia', ar: 'الرشيدية', en: 'Errachidia' }, region: 'DRAA_TAFILALET', lat: 31.9314, lng: -4.4245, population: 92374 },
  { slug: 'ouarzazate', name: { fr: 'Ouarzazate', ar: 'ورزازات', en: 'Ouarzazate' }, region: 'DRAA_TAFILALET', lat: 30.9335, lng: -6.937, population: 71067 },
  { slug: 'essaouira', name: { fr: 'Essaouira', ar: 'الصويرة', en: 'Essaouira' }, region: 'MARRAKECH_SAFI', lat: 31.5085, lng: -9.7595, population: 77966 },
  { slug: 'al-hoceima', name: { fr: 'Al Hoceïma', ar: 'الحسيمة', en: 'Al Hoceima' }, region: 'TANGER_TETOUAN_AL_HOCEIMA', lat: 35.2517, lng: -3.9372, population: 56716 },
  { slug: 'chefchaouen', name: { fr: 'Chefchaouen', ar: 'شفشاون', en: 'Chefchaouen' }, region: 'TANGER_TETOUAN_AL_HOCEIMA', lat: 35.1688, lng: -5.2636, population: 42786 },
  { slug: 'ifrane', name: { fr: 'Ifrane', ar: 'إفران', en: 'Ifrane' }, region: 'FES_MEKNES', lat: 33.5228, lng: -5.1106, population: 14659 },
];

export const CITY_BY_SLUG: ReadonlyMap<string, CitySeed> = new Map(
  CITIES.map((city) => [city.slug, city]),
);

export function citiesInRegion(region: Region): CitySeed[] {
  return CITIES.filter((city) => city.region === region);
}
