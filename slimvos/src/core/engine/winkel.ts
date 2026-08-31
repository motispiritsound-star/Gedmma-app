import type { Profiel } from './profiel';
import { AVATARS } from './profiel';

export interface WinkelItem {
  id: string;
  emoji: string;
  naam: string;
  prijs: number;
}

/**
 * Alles wat je kunt kopen is cosmetisch en met munten uit het oefenen zelf.
 * Er zit bewust geen echte-geld-winkel in: kinderen kunnen niets uitgeven.
 */
export const WINKEL: WinkelItem[] = AVATARS.map((emoji, i) => ({
  id: emoji,
  emoji,
  naam: [
    'Vos', 'Uil', 'Panda', 'Koala', 'Kikker', 'Eenhoorn',
    'Octopus', 'Dino', 'Bij', 'Leeuw', 'Pinguïn', 'Vlinder',
  ][i] ?? `Avatar ${i + 1}`,
  // Het maatje dat je bij de start koos heb je al; de rest verdien je.
  prijs: 25 + i * 25,
}));

export function kanKopen(profiel: Profiel, item: WinkelItem): boolean {
  return !profiel.bezit.includes(item.id) && profiel.munten >= item.prijs;
}

export function koop(profiel: Profiel, itemId: string): Profiel {
  const item = WINKEL.find((w) => w.id === itemId);
  if (!item) throw new Error(`Onbekend item: ${itemId}`);
  if (profiel.bezit.includes(itemId)) return profiel;
  if (profiel.munten < item.prijs) throw new Error('Niet genoeg munten');
  return {
    ...profiel,
    munten: profiel.munten - item.prijs,
    bezit: [...profiel.bezit, itemId],
    avatar: item.emoji,
  };
}

export function kiesAvatar(profiel: Profiel, itemId: string): Profiel {
  if (!profiel.bezit.includes(itemId)) return profiel;
  return { ...profiel, avatar: itemId };
}
