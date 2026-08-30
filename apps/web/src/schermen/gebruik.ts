/** Kleine hooks die het ophalen van gegevens en het tonen van fouten regelen. */
import { useCallback, useEffect, useState } from 'react';
import { verzoek, type Verzoekopties } from '../api/client.ts';
import { useApp } from '../context/App.tsx';
import { toonFout, type Foutmelding } from '../context/fouten.ts';

export type Haaltoestand<T> = {
  gegevens: T | null;
  bezig: boolean;
  fout: Foutmelding | null;
  opnieuw: () => void;
};

/** Haalt gegevens op zodra het pad verandert; annuleert netjes bij navigeren. */
export function useHaal<T>(pad: string | null, opties: Verzoekopties = {}): Haaltoestand<T> {
  const { t, taal } = useApp();
  const [gegevens, zetGegevens] = useState<T | null>(null);
  const [bezig, zetBezig] = useState(pad !== null);
  const [fout, zetFout] = useState<Foutmelding | null>(null);
  const [teller, zetTeller] = useState(0);

  useEffect(() => {
    if (!pad) {
      zetBezig(false);
      return;
    }
    const controle = new AbortController();
    zetBezig(true);
    zetFout(null);

    void (async () => {
      try {
        const antwoord = await verzoek<T>(pad, { ...opties, taal, signaal: controle.signal });
        if (!controle.signal.aborted) zetGegevens(antwoord);
      } catch (foutje) {
        if (!controle.signal.aborted) zetFout(toonFout(foutje, t));
      } finally {
        if (!controle.signal.aborted) zetBezig(false);
      }
    })();

    return () => controle.abort();
    // `opties` bewust buiten de afhankelijkheden: die is per render nieuw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pad, taal, teller]);

  const opnieuw = useCallback(() => zetTeller((waarde) => waarde + 1), []);
  return { gegevens, bezig, fout, opnieuw };
}

/** Voert een schrijfactie uit met nette bezig- en foutafhandeling. */
export function useActie() {
  const { t, taal } = useApp();
  const [bezig, zetBezig] = useState(false);
  const [fout, zetFout] = useState<Foutmelding | null>(null);

  const voerUit = useCallback(
    async <T,>(pad: string, opties: Verzoekopties = {}): Promise<T | null> => {
      zetBezig(true);
      zetFout(null);
      try {
        return await verzoek<T>(pad, { ...opties, taal });
      } catch (foutje) {
        zetFout(toonFout(foutje, t));
        return null;
      } finally {
        zetBezig(false);
      }
    },
    [t, taal],
  );

  return { voerUit, bezig, fout, wisFout: () => zetFout(null) };
}

/** Eerste en laatste dag van het huidige boekjaar, als beginwaarde voor filters. */
export function huidigJaar(): { vanaf: string; tot: string } {
  const jaar = new Date().getUTCFullYear();
  return { vanaf: `${jaar}-01-01`, tot: `${jaar}-12-31` };
}

export function vandaag(): string {
  return new Date().toISOString().slice(0, 10);
}
