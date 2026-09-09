import AsyncStorage from '@react-native-async-storage/async-storage';
import { migreerProfiel, type Profiel } from '../core/engine/profiel';

const SLEUTEL = 'slimvos.profielen.v1';
const ACTIEF = 'slimvos.actiefProfiel.v1';

/**
 * Alle voortgang staat op het toestel zelf. Er gaat geen enkel gegeven van een
 * kind naar een server; dat scheelt niet alleen kosten, het maakt de app ook
 * bruikbaar zonder internet en houdt de AVG-verplichtingen minimaal.
 */
export async function laadProfielen(): Promise<Profiel[]> {
  try {
    const ruw = await AsyncStorage.getItem(SLEUTEL);
    if (!ruw) return [];
    const lijst = JSON.parse(ruw);
    if (!Array.isArray(lijst)) return [];
    return lijst.map(migreerProfiel).filter((p): p is Profiel => p !== null);
  } catch {
    return [];
  }
}

export async function bewaarProfielen(profielen: Profiel[]): Promise<void> {
  await AsyncStorage.setItem(SLEUTEL, JSON.stringify(profielen));
}

export async function laadActiefId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIEF);
  } catch {
    return null;
  }
}

export async function bewaarActiefId(id: string | null): Promise<void> {
  if (id === null) await AsyncStorage.removeItem(ACTIEF);
  else await AsyncStorage.setItem(ACTIEF, id);
}

export async function wisAlles(): Promise<void> {
  await AsyncStorage.multiRemove([SLEUTEL, ACTIEF]);
}
