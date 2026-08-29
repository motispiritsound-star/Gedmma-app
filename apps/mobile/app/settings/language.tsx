import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORTED_LOCALES, type Locale } from '@buurklus/shared';
import { Txt } from '@/components/ui';
import { useSession } from '@/store/session';
import { colors, radius, spacing } from '@/theme';

export default function LanguageSettings() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = useSession((state) => state.locale);
  const setLocale = useSession((state) => state.setLocale);

  async function choose(next: Locale) {
    if (next === locale) return;
    await setLocale(next);
    await i18n.changeLanguage(next);
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: t('language.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Txt variant="body" color={colors.textMuted}>
          {t('language.subtitle')}
        </Txt>

        <View style={styles.list}>
          {SUPPORTED_LOCALES.map((code) => (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected: locale === code }}
              onPress={() => void choose(code as Locale)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Txt variant="body" style={styles.rowLabel}>
                {t(`language.${code}`)}
              </Txt>
              {locale === code ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              ) : (
                <Ionicons name="ellipse-outline" size={22} color={colors.borderStrong} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  list: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.background },
  rowLabel: { flex: 1 },
});
