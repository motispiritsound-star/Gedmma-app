import React, { useEffect, useRef, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Updates from 'expo-updates';
import { I18nextProvider } from 'react-i18next';
import i18n, { applyDirection, initI18n } from '@/i18n';
import { useSession } from '@/store/session';
import { colors } from '@/theme';
import { Loader } from '@/components/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // Mobile networks drop often; refetching on focus keeps lists honest.
      refetchOnWindowFocus: true,
    },
  },
});

export default function RootLayout() {
  const hydrate = useSession((state) => state.hydrate);
  const hydrated = useSession((state) => state.hydrated);
  const locale = useSession((state) => state.locale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    void (async () => {
      await initI18n(locale);
      setReady(true);
    })();
  }, [hydrated, locale]);

  // Switching to or from Arabic changes the layout direction, and React Native
  // only applies that to native views after a reload. Reload at most once per
  // mount: if the flip does not take on this platform, retrying would loop.
  const hasReloadedForDirection = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const needsReload = applyDirection(locale);
    if (!needsReload || __DEV__ || hasReloadedForDirection.current) return;

    hasReloadedForDirection.current = true;
    void Updates.reloadAsync().catch(() => {
      // Nothing to reload (Expo Go, a bare build without expo-updates): the
      // direction still applies on the next launch.
    });
  }, [locale, ready]);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Loader />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { fontSize: 17, fontWeight: '600', color: colors.text },
              headerTintColor: colors.primary,
              contentStyle: { backgroundColor: colors.background },
              // Push animation follows the reading direction in Arabic.
              animation: I18nManager.isRTL ? 'slide_from_left' : 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(customer)" options={{ headerShown: false }} />
            <Stack.Screen name="(pro)" options={{ headerShown: false }} />
            <Stack.Screen name="post" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
