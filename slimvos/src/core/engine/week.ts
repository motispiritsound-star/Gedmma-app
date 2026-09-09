import { dagSleutel } from './punten';
import type { RondeLog } from './profiel';

export interface WeekDag {
  sleutel: string;
  /** Eén letter voor de strip: m, d, w, d, v, z, z. */
  letter: string;
  /** Volledige naam, voor schermlezers. */
  naam: string;
  vragen: number;
  isVandaag: boolean;
  isToekomst: boolean;
}

const NAMEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const DAG = 86400000;

/**
 * De huidige week, van maandag tot zondag. Een vaste week leest makkelijker
 * dan "de laatste zeven dagen": een kind ziet meteen welke dagen het nog kan
 * inhalen.
 */
export function weekOverzicht(geschiedenis: RondeLog[], nu = Date.now()): WeekDag[] {
  const vandaag = new Date(nu);
  const vandaagSleutel = dagSleutel(vandaag);
  // getDay() geeft 0 voor zondag; wij beginnen op maandag.
  const sindsMaandag = (vandaag.getDay() + 6) % 7;

  const perDag = new Map<string, number>();
  for (const ronde of geschiedenis) {
    const sleutel = dagSleutel(new Date(ronde.tijd));
    perDag.set(sleutel, (perDag.get(sleutel) ?? 0) + ronde.aantal);
  }

  return Array.from({ length: 7 }, (_, i) => {
    const datum = new Date(nu - (sindsMaandag - i) * DAG);
    const sleutel = dagSleutel(datum);
    const naam = NAMEN[datum.getDay()];
    return {
      sleutel,
      letter: naam.charAt(0),
      naam,
      vragen: perDag.get(sleutel) ?? 0,
      isVandaag: sleutel === vandaagSleutel,
      isToekomst: i > sindsMaandag,
    };
  });
}

/** Hoeveel dagen deze week er al geoefend is. */
export function dagenDezeWeek(geschiedenis: RondeLog[], nu = Date.now()): number {
  return weekOverzicht(geschiedenis, nu).filter((d) => d.vragen > 0).length;
}
