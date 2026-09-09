import {
  useFonts as useBaloo,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  useFonts as useNunito,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

/**
 * De lettertypen worden meegeleverd met de app, niet van internet gehaald.
 * Daardoor werkt de typografie ook zonder verbinding en flitst er niets.
 */
export function useAppFonts(): boolean {
  const [baloo] = useBaloo({ Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold });
  const [nunito] = useNunito({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold });
  return baloo && nunito;
}
