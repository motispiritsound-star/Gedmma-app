import { useCallback, useEffect, useState } from 'react';
import * as Speech from 'expo-speech';
import { voorleesTekst } from '../core/voorlezen';

export { voorleesTekst };

/**
 * Vragen laten voorlezen.
 *
 * Voor groep 3 en voor kinderen met dyslexie is dit het verschil tussen wel of
 * niet mee kunnen doen: het rekenen of de topografie is niet het probleem, het
 * lezen van de vraag is dat. De stem zit in het toestel, dus dit werkt offline
 * en kost niets.
 */
export function useVoorlezer() {
  const [leestVoor, setLeestVoor] = useState(false);

  // Stoppen zodra het scherm verdwijnt, anders praat hij door op het volgende.
  useEffect(() => () => {
    Speech.stop().catch(() => {});
  }, []);

  const lees = useCallback((tekst: string) => {
    Speech.stop().catch(() => {});
    if (!tekst.trim()) return;
    setLeestVoor(true);
    Speech.speak(tekst, {
      language: 'nl-NL',
      rate: 0.92,
      onDone: () => setLeestVoor(false),
      onStopped: () => setLeestVoor(false),
      onError: () => setLeestVoor(false),
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop().catch(() => {});
    setLeestVoor(false);
  }, []);

  return { lees, stop, leestVoor };
}
