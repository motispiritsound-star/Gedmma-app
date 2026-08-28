import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/state/AppContext';
import { kleur } from '../src/ui/thema';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: kleur.achtergrond },
            headerTintColor: kleur.tekst,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: kleur.achtergrond },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welkom" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="vak/[vakId]" options={{ title: '' }} />
          <Stack.Screen
            name="oefenen/[onderwerpId]"
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
