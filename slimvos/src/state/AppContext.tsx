import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Groep } from '../core/types';
import { metBadges, nieuweBadges } from '../core/engine/badges';
import { nieuwProfiel, verwerkRonde, type Profiel } from '../core/engine/profiel';
import type { Sessie } from '../core/engine/sessie';
import { koop as koopItem, kiesAvatar as kiesAvatarPuur } from '../core/engine/winkel';
import { aantalTeHerhalen, teHerhalen } from '../core/engine/herhalen';
import type { Vraag } from '../core/types';
import type { Aanmeldgegevens, Ouder } from '../core/account/types';
import {
  gratisAbonnement,
  heeftToegang,
  huidigeStatus,
  hervat,
  magOefenen,
  maxProfielen,
  type Abonnement,
  type Oordeel,
} from '../core/abonnement/toegang';
import type { PlanId } from '../core/abonnement/plannen';
import { lokaleAuth } from './auth';
import { demoAankoop } from './aankoop';
import {
  bewaarActiefId,
  bewaarProfielen,
  laadActiefId,
  laadProfielen,
  wisAlles,
} from './opslag';

interface AppState {
  klaar: boolean;
  profielen: Profiel[];
  profiel: Profiel | null;
  ouder: Ouder | null;
  abonnement: Abonnement;
  premium: boolean;
  verseBadges: string[];

  maakProfiel: (naam: string, groep: Groep, avatar: string) => Promise<Profiel | null>;
  kiesProfiel: (id: string) => Promise<void>;
  verwijderProfiel: (id: string) => Promise<void>;
  rondeKlaar: (sessie: Sessie) => Promise<{ nieuweBadges: string[] }>;
  werkProfielBij: (wijziging: Partial<Profiel>) => Promise<void>;
  koop: (itemId: string) => Promise<void>;
  kiesAvatar: (itemId: string) => Promise<void>;
  verwijderAlles: () => Promise<void>;
  vergeetVerseBadges: () => void;

  magDitOefenen: (onderwerpId: string) => Oordeel;
  ruimteVoorProfiel: boolean;
  /** Vragen die voor dit onderwerp weer aan de beurt zijn. */
  herhalingenVoor: (onderwerpId: string) => Vraag[];
  /** Hoeveel vragen er in totaal klaarstaan om te herhalen. */
  aantalHerhalingen: number;

  registreer: (gegevens: Aanmeldgegevens) => Promise<void>;
  logIn: (email: string, wachtwoord: string) => Promise<void>;
  logUit: () => Promise<void>;
  werkOuderBij: (wijziging: Partial<Ouder>) => Promise<void>;
  verwijderAccount: () => Promise<void>;

  koopAbonnement: (plan: PlanId, metProef: boolean) => Promise<string>;
  zegAbonnementOp: () => Promise<string>;
  hervatAbonnement: () => Promise<void>;
  herstelAankopen: () => Promise<string>;
}

const Context = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [klaar, setKlaar] = useState(false);
  const [profielen, setProfielen] = useState<Profiel[]>([]);
  const [actiefId, setActiefId] = useState<string | null>(null);
  const [ouder, setOuder] = useState<Ouder | null>(null);
  const [verseBadges, setVerseBadges] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [opgeslagen, id, huidige] = await Promise.all([
        laadProfielen(),
        laadActiefId(),
        lokaleAuth.huidigeOuder(),
      ]);
      setProfielen(opgeslagen);
      setActiefId(id && opgeslagen.some((p) => p.id === id) ? id : (opgeslagen[0]?.id ?? null));
      setOuder(huidige);
      setKlaar(true);
    })();
  }, []);

  const profiel = useMemo(() => profielen.find((p) => p.id === actiefId) ?? null, [profielen, actiefId]);

  // Het abonnement hangt aan het ouderaccount. Zonder account geldt de gratis versie.
  const abonnement = useMemo(
    () => huidigeStatus(ouder?.abonnement ?? gratisAbonnement()),
    [ouder],
  );
  const premium = useMemo(() => heeftToegang(abonnement), [abonnement]);

  const bewaar = useCallback(async (lijst: Profiel[]) => {
    setProfielen(lijst);
    await bewaarProfielen(lijst);
  }, []);

  const vervang = useCallback(
    async (bijgewerkt: Profiel) => {
      await bewaar(profielen.map((p) => (p.id === bijgewerkt.id ? bijgewerkt : p)));
    },
    [profielen, bewaar],
  );

  const bewaarOuder = useCallback(async (nieuwe: Ouder) => {
    setOuder(nieuwe);
    await lokaleAuth.bewaarOuder(nieuwe);
  }, []);

  const ruimteVoorProfiel = profielen.length < maxProfielen(abonnement);

  const maakProfiel = useCallback(
    async (naam: string, groep: Groep, avatar: string) => {
      if (!ruimteVoorProfiel) return null;
      const p = nieuwProfiel(naam, groep, avatar);
      await bewaar([...profielen, p]);
      setActiefId(p.id);
      await bewaarActiefId(p.id);
      return p;
    },
    [profielen, bewaar, ruimteVoorProfiel],
  );

  const kiesProfiel = useCallback(async (id: string) => {
    setActiefId(id);
    await bewaarActiefId(id);
  }, []);

  const verwijderProfiel = useCallback(
    async (id: string) => {
      const rest = profielen.filter((p) => p.id !== id);
      await bewaar(rest);
      if (actiefId === id) {
        const nieuw = rest[0]?.id ?? null;
        setActiefId(nieuw);
        await bewaarActiefId(nieuw);
      }
    },
    [profielen, bewaar, actiefId],
  );

  const rondeKlaar = useCallback(
    async (sessie: Sessie) => {
      if (!profiel) return { nieuweBadges: [] };
      const verwerkt = verwerkRonde(profiel, sessie);
      const verse = nieuweBadges(verwerkt);
      await vervang(metBadges(verwerkt));
      setVerseBadges(verse);
      return { nieuweBadges: verse };
    },
    [profiel, vervang],
  );

  const werkProfielBij = useCallback(
    async (wijziging: Partial<Profiel>) => {
      if (profiel) await vervang({ ...profiel, ...wijziging });
    },
    [profiel, vervang],
  );

  const koop = useCallback(
    async (itemId: string) => {
      if (profiel) await vervang(koopItem(profiel, itemId));
    },
    [profiel, vervang],
  );

  const kiesAvatar = useCallback(
    async (itemId: string) => {
      if (profiel) await vervang(kiesAvatarPuur(profiel, itemId));
    },
    [profiel, vervang],
  );

  const verwijderAlles = useCallback(async () => {
    await wisAlles();
    setProfielen([]);
    setActiefId(null);
  }, []);

  const magDitOefenen = useCallback(
    (onderwerpId: string) => magOefenen(abonnement, onderwerpId, profiel?.vandaag.buitenGratisVak ?? 0),
    [abonnement, profiel],
  );

  const herhalingenVoor = useCallback(
    (onderwerpId: string) =>
      teHerhalen(profiel?.herhaalbak ?? [], { onderwerpId }).map((i) => i.vraag),
    [profiel],
  );

  const aantalHerhalingen = useMemo(() => aantalTeHerhalen(profiel?.herhaalbak ?? []), [profiel]);

  const registreer = useCallback(async (gegevens: Aanmeldgegevens) => {
    setOuder(await lokaleAuth.registreer(gegevens));
  }, []);

  const logIn = useCallback(async (email: string, wachtwoord: string) => {
    setOuder(await lokaleAuth.logIn(email, wachtwoord));
  }, []);

  const logUit = useCallback(async () => {
    await lokaleAuth.logUit();
    setOuder(null);
  }, []);

  const werkOuderBij = useCallback(
    async (wijziging: Partial<Ouder>) => {
      if (ouder) await bewaarOuder({ ...ouder, ...wijziging });
    },
    [ouder, bewaarOuder],
  );

  const verwijderAccount = useCallback(async () => {
    await lokaleAuth.verwijderAccount();
    setOuder(null);
  }, []);

  const koopAbonnement = useCallback(
    async (plan: PlanId, metProef: boolean) => {
      if (!ouder) throw new Error('Maak eerst een ouderaccount aan.');
      const uitkomst = await demoAankoop.koop(ouder.abonnement, plan, metProef);
      await bewaarOuder({ ...ouder, abonnement: uitkomst.abonnement });
      return uitkomst.melding;
    },
    [ouder, bewaarOuder],
  );

  const zegAbonnementOp = useCallback(async () => {
    if (!ouder) return '';
    const uitkomst = await demoAankoop.opzeggen(ouder.abonnement);
    await bewaarOuder({ ...ouder, abonnement: uitkomst.abonnement });
    return uitkomst.melding;
  }, [ouder, bewaarOuder]);

  const hervatAbonnement = useCallback(async () => {
    if (ouder) await bewaarOuder({ ...ouder, abonnement: hervat(ouder.abonnement) });
  }, [ouder, bewaarOuder]);

  const herstelAankopen = useCallback(async () => {
    const uitkomst = await demoAankoop.herstel(ouder?.abonnement ?? gratisAbonnement());
    return uitkomst.melding;
  }, [ouder]);

  const waarde = useMemo<AppState>(
    () => ({
      klaar,
      profielen,
      profiel,
      ouder,
      abonnement,
      premium,
      verseBadges,
      maakProfiel,
      kiesProfiel,
      verwijderProfiel,
      rondeKlaar,
      werkProfielBij,
      koop,
      kiesAvatar,
      verwijderAlles,
      vergeetVerseBadges: () => setVerseBadges([]),
      magDitOefenen,
      ruimteVoorProfiel,
      herhalingenVoor,
      aantalHerhalingen,
      registreer,
      logIn,
      logUit,
      werkOuderBij,
      verwijderAccount,
      koopAbonnement,
      zegAbonnementOp,
      hervatAbonnement,
      herstelAankopen,
    }),
    [
      klaar, profielen, profiel, ouder, abonnement, premium, verseBadges,
      maakProfiel, kiesProfiel, verwijderProfiel, rondeKlaar, werkProfielBij, koop, kiesAvatar,
      verwijderAlles, magDitOefenen, ruimteVoorProfiel, herhalingenVoor, aantalHerhalingen,
      registreer, logIn, logUit, werkOuderBij,
      verwijderAccount, koopAbonnement, zegAbonnementOp, hervatAbonnement, herstelAankopen,
    ],
  );

  return <Context.Provider value={waarde}>{children}</Context.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useApp moet binnen <AppProvider> gebruikt worden');
  return ctx;
}
