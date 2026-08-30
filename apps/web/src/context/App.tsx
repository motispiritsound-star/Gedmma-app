/**
 * De gedeelde toestand van de app: wie is aangemeld, in welke administratie
 * werkt hij, welke taal en welk thema. Bewust een enkele context met React's
 * eigen middelen; een state-bibliotheek voegt hier niets toe.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { kiesTaal, maakVertaler, type Sleutel, type Taal } from '@gedmma/i18n';
import { bijUitloggen, verzoek, type AdministratieAntwoord, type Ik } from '../api/client.ts';

export type Thema = 'systeem' | 'licht' | 'donker';

type AppToestand = {
  ik: Ik | null;
  bezig: boolean;
  taal: Taal;
  thema: Thema;
  administratieId: string | null;
  administratie: AdministratieAntwoord | null;
  t: (sleutel: Sleutel, variabelen?: Record<string, string | number>) => string;
  zetTaal: (taal: Taal) => void;
  zetThema: (thema: Thema) => void;
  kiesAdministratie: (id: string | null) => void;
  ververs: () => Promise<void>;
  magIk: (recht: string) => boolean;
  afmelden: () => Promise<void>;
};

const Context = createContext<AppToestand | null>(null);

const OPSLAG_TAAL = 'gedmma.taal';
const OPSLAG_THEMA = 'gedmma.thema';
const OPSLAG_ADMIN = 'gedmma.administratie';

function leesOpslag(sleutel: string): string | null {
  try {
    return globalThis.localStorage?.getItem(sleutel) ?? null;
  } catch {
    return null;
  }
}

function schrijfOpslag(sleutel: string, waarde: string | null): void {
  try {
    if (waarde === null) globalThis.localStorage?.removeItem(sleutel);
    else globalThis.localStorage?.setItem(sleutel, waarde);
  } catch {
    // Opslag kan geblokkeerd zijn; dat mag de app niet breken.
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ik, zetIk] = useState<Ik | null>(null);
  const [bezig, zetBezig] = useState(true);
  const [taal, zetTaalIntern] = useState<Taal>(
    () => (leesOpslag(OPSLAG_TAAL) as Taal | null) ?? kiesTaal(navigator.languages ?? ['nl']),
  );
  const [thema, zetThemaIntern] = useState<Thema>(() => (leesOpslag(OPSLAG_THEMA) as Thema | null) ?? 'systeem');
  const [administratieId, zetAdministratieId] = useState<string | null>(() => leesOpslag(OPSLAG_ADMIN));
  const [administratie, zetAdministratie] = useState<AdministratieAntwoord | null>(null);

  const t = useMemo(() => maakVertaler(taal), [taal]);

  // Thema toepassen op het document. 'systeem' laat de media query beslissen.
  useEffect(() => {
    const wortel = document.documentElement;
    if (thema === 'systeem') wortel.removeAttribute('data-thema');
    else wortel.setAttribute('data-thema', thema);
  }, [thema]);

  useEffect(() => {
    document.documentElement.lang = taal;
  }, [taal]);

  const ververs = useCallback(async () => {
    try {
      const antwoord = await verzoek<Ik>('/api/v1/auth/me', { taal });
      zetIk(antwoord);
      if (!antwoord.aangemeld) {
        zetAdministratie(null);
      }
    } catch {
      zetIk({ aangemeld: false });
    } finally {
      zetBezig(false);
    }
  }, [taal]);

  useEffect(() => {
    void ververs();
  }, [ververs]);

  useEffect(() => {
    bijUitloggen(() => {
      zetIk({ aangemeld: false });
      zetAdministratie(null);
    });
  }, []);

  // Zodra er een administratie gekozen is: gegevens en rechten ophalen.
  useEffect(() => {
    if (!administratieId || !ik?.aangemeld || !ik.gebruiker?.mfaVoldaan) {
      zetAdministratie(null);
      return;
    }
    let geannuleerd = false;
    void (async () => {
      try {
        const antwoord = await verzoek<AdministratieAntwoord>(`/api/v1/administraties/${administratieId}`, { taal });
        if (!geannuleerd) zetAdministratie(antwoord);
      } catch {
        if (!geannuleerd) {
          zetAdministratie(null);
          zetAdministratieId(null);
          schrijfOpslag(OPSLAG_ADMIN, null);
        }
      }
    })();
    return () => {
      geannuleerd = true;
    };
  }, [administratieId, ik, taal]);

  // Is er precies een administratie, kies die dan meteen.
  useEffect(() => {
    if (administratieId || !ik?.organisaties) return;
    const alle = ik.organisaties.flatMap((organisatie) => organisatie.administraties);
    if (alle.length === 1 && alle[0]) {
      zetAdministratieId(alle[0].id);
      schrijfOpslag(OPSLAG_ADMIN, alle[0].id);
    }
  }, [ik, administratieId]);

  const waarde = useMemo<AppToestand>(
    () => ({
      ik,
      bezig,
      taal,
      thema,
      administratieId,
      administratie,
      t,
      zetTaal: (nieuw) => {
        zetTaalIntern(nieuw);
        schrijfOpslag(OPSLAG_TAAL, nieuw);
      },
      zetThema: (nieuw) => {
        zetThemaIntern(nieuw);
        schrijfOpslag(OPSLAG_THEMA, nieuw);
      },
      kiesAdministratie: (id) => {
        zetAdministratieId(id);
        schrijfOpslag(OPSLAG_ADMIN, id);
      },
      ververs,
      magIk: (recht) => administratie?.rechten.includes(recht) ?? false,
      afmelden: async () => {
        await verzoek('/api/v1/auth/logout', { methode: 'POST' }).catch(() => undefined);
        zetIk({ aangemeld: false });
        zetAdministratie(null);
        zetAdministratieId(null);
        schrijfOpslag(OPSLAG_ADMIN, null);
      },
    }),
    [ik, bezig, taal, thema, administratieId, administratie, t, ververs],
  );

  return <Context.Provider value={waarde}>{children}</Context.Provider>;
}

export function useApp(): AppToestand {
  const waarde = useContext(Context);
  if (!waarde) throw new Error('useApp() moet binnen een AppProvider worden gebruikt.');
  return waarde;
}

/** Handige verkorting: het pad van de actieve administratie. */
export function useAdminPad(): string {
  const { administratieId } = useApp();
  return `/api/v1/administraties/${administratieId}`;
}
