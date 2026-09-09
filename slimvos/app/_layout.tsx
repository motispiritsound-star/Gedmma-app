import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/state/AppContext';
import { useAppFonts } from '../src/ui/fonts';
import { kleur, font } from '../src/ui/thema';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const fontsKlaar = useAppFonts();

  useEffect(() => {
    if (fontsKlaar) SplashScreen.hideAsync().catch(() => {});
  }, [fontsKlaar]);

  // Wachten tot de letters er zijn voorkomt dat de tekst eerst in een ander
  // lettertype verschijnt en daarna verspringt.
  if (!fontsKlaar) return <View style={{ flex: 1, backgroundColor: kleur.grond }} />;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: kleur.grond },
            headerTintColor: kleur.tekst,
            headerTitleStyle: { fontFamily: font.display, fontSize: 18 },
            headerBackTitle: 'Terug',
            contentStyle: { backgroundColor: kleur.grond },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welkom" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="vak/[vakId]" options={{ title: '' }} />
          <Stack.Screen name="oefenen/[onderwerpId]" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="film/[filmId]" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="abonnement" options={{ title: 'Slimvos Compleet', presentation: 'modal' }} />
          <Stack.Screen name="account/aanmelden" options={{ title: 'Account aanmaken' }} />
          <Stack.Screen name="account/inloggen" options={{ title: 'Inloggen' }} />
          <Stack.Screen name="account/wachtwoord" options={{ title: 'Wachtwoord vergeten' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
