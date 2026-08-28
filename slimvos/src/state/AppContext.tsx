import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Groep } from '../core/types';
import { metBadges, nieuweBadges } from '../core/engine/badges';
import { nieuwProfiel, verwerkRonde, type Profiel } from '../core/engine/profiel';
import type { Sessie } from '../core/engine/sessie';
import { koop as koopItem, kiesAvatar as kiesAvatarPuur } from '../core/engine/winkel';
import { bewaarActiefId, bewaarProfielen, laadActiefId, laadProfielen, wisAlles } from './opslag';

interface AppState {
  klaar: boolean;
  profielen: Profiel[];
  profiel: Profiel | null;
  /** Badges die net verdiend zijn en nog gevierd moeten worden. */
  verseBadges: string[];
  maakProfiel: (naam: string, groep: Groep, avatar: string) => Promise<Profiel>;
  kiesProfiel: (id: string) => Promise<void>;
  rondeKlaar: (sessie: Sessie) => Promise<{ nieuweBadges: string[] }>;
  werkProfielBij: (wijziging: Partial<Profiel>) => Promise<void>;
  koop: (itemId: string) => Promise<void>;
  kiesAvatar: (itemId: string) => Promise<void>;
  verwijderAlles: () => Promise<void>;
  vergeetVerseBadges: () => void;
}

const Context = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [klaar, setKlaar] = useState(false);
  const [profielen, setProfielen] = useState<Profiel[]>([]);
  const [actiefId, setActiefId] = useState<string | null>(null);
  const [verseBadges, setVerseBadges] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [opgeslagen, id] = await Promise.all([laadProfielen(), laadActiefId()]);
      setProfielen(opgeslagen);
      setActiefId(id && opgeslagen.some((p) => p.id === id) ? id : (opgeslagen[0]?.id ?? null));
      setKlaar(true);
    })();
  }, []);

  const profiel = useMemo(
    () => profielen.find((p) => p.id === actiefId) ?? null,
    [profielen, actiefId],
  );

  const bewaar = useCallback(async (lijst: Profiel[]) => {
    setProfielen(lijst);
    await bewaarProfielen(lijst);
  }, []);

  const vervang = useCallback(
    async (bijgewerkt: Profiel) => {
      const lijst = profielen.map((p) => (p.id === bijgewerkt.id ? bijgewerkt : p));
      await bewaar(lijst);
    },
    [profielen, bewaar],
  );

  const maakProfiel = useCallback(
    async (naam: string, groep: Groep, avatar: string) => {
      const p = nieuwProfiel(naam, groep, avatar);
      await bewaar([...profielen, p]);
      setActiefId(p.id);
      await bewaarActiefId(p.id);
      return p;
    },
    [profielen, bewaar],
  );

  const kiesProfiel = useCallback(async (id: string) => {
    setActiefId(id);
    await bewaarActiefId(id);
  }, []);

  const rondeKlaar = useCallback(
    async (sessie: Sessie) => {
      if (!profiel) return { nieuweBadges: [] };
      const verwerkt = verwerkRonde(profiel, sessie);
      const verse = nieuweBadges(verwerkt);
      const metNieuweBadges = metBadges(verwerkt);
      await vervang(metNieuweBadges);
      setVerseBadges(verse);
      return { nieuweBadges: verse };
    },
    [profiel, vervang],
  );

  const werkProfielBij = useCallback(
    async (wijziging: Partial<Profiel>) => {
      if (!profiel) return;
      await vervang({ ...profiel, ...wijziging });
    },
    [profiel, vervang],
  );

  const koop = useCallback(
    async (itemId: string) => {
      if (!profiel) return;
      await vervang(koopItem(profiel, itemId));
    },
    [profiel, vervang],
  );

  const kiesAvatar = useCallback(
    async (itemId: string) => {
      if (!profiel) return;
      await vervang(kiesAvatarPuur(profiel, itemId));
    },
    [profiel, vervang],
  );

  const verwijderAlles = useCallback(async () => {
    await wisAlles();
    setProfielen([]);
    setActiefId(null);
  }, []);

  const waarde = useMemo<AppState>(
    () => ({
      klaar,
      profielen,
      profiel,
      verseBadges,
      maakProfiel,
      kiesProfiel,
      rondeKlaar,
      werkProfielBij,
      koop,
      kiesAvatar,
      verwijderAlles,
      vergeetVerseBadges: () => setVerseBadges([]),
    }),
    [klaar, profielen, profiel, verseBadges, maakProfiel, kiesProfiel, rondeKlaar, werkProfielBij, koop, kiesAvatar, verwijderAlles],
  );

  return <Context.Provider value={waarde}>{children}</Context.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useApp moet binnen <AppProvider> gebruikt worden');
  return ctx;
}
