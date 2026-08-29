import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.paper },
          // Anyone who asks their device for less motion gets none from us.
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'FocusFamily' }} />
        <Stack.Screen name="agreements" options={{ title: 'Afspraken' }} />
        <Stack.Screen name="focus" options={{ title: 'Focusmoment' }} />
        <Stack.Screen name="checkin" options={{ title: 'Check-in' }} />
        <Stack.Screen name="data" options={{ title: 'Gegevens' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
