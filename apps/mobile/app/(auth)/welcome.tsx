import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORTED_LOCALES, type Locale } from '@khidma/shared';
import { Button, Card, Txt } from '@/components/ui';
import { useSession } from '@/store/session';
import { colors, radius, spacing } from '@/theme';

export default function Welcome() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useSession((state) => state.locale);
  const setLocale = useSession((state) => state.setLocale);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Language first: someone who reads only Arabic must be able to switch
          before reading anything else on the screen. */}
      <View style={styles.localeRow}>
        {SUPPORTED_LOCALES.map((code) => (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityState={{ selected: locale === code }}
            onPress={() => void setLocale(code as Locale)}
            style={[styles.localeChip, locale === code && styles.localeChipActive]}
          >
            <Txt
              variant="caption"
              color={locale === code ? colors.textInverse : colors.textMuted}
              align="center"
            >
              {t(`language.${code}`)}
            </Txt>
          </Pressable>
        ))}
      </View>

      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="construct" size={34} color={colors.textInverse} />
        </View>
        <Txt variant="display">{t('onboarding.welcomeTitle')}</Txt>
        <Txt variant="body" color={colors.textMuted}>
          {t('onboarding.welcomeSubtitle')}
        </Txt>
      </View>

      <View style={styles.roles}>
        <Txt variant="heading">{t('onboarding.roleTitle')}</Txt>
        <Txt variant="caption" color={colors.textMuted}>
          {t('onboarding.roleSubtitle')}
        </Txt>

        <Card onPress={() => router.push({ pathname: '/(auth)/phone', params: { role: 'CUSTOMER' } })}>
          <View style={styles.roleRow}>
            <View style={styles.roleIcon}>
              <Ionicons name="home-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.roleText}>
              <Txt variant="subheading">{t('onboarding.customerTitle')}</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {t('onboarding.customerDescription')}
              </Txt>
            </View>
          </View>
        </Card>

        <Card onPress={() => router.push({ pathname: '/(auth)/phone', params: { role: 'PRO' } })}>
          <View style={styles.roleRow}>
            <View style={[styles.roleIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="hammer-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.roleText}>
              <Txt variant="subheading">{t('onboarding.proTitle')}</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {t('onboarding.proDescription')}
              </Txt>
            </View>
          </View>
        </Card>
      </View>

      <Button
        title={t('onboarding.getStarted')}
        onPress={() => router.push({ pathname: '/(auth)/phone', params: { role: 'CUSTOMER' } })}
        style={{ marginBottom: insets.bottom + spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.xxl, flexGrow: 1 },
  localeRow: { flexDirection: 'row', gap: spacing.xs, alignSelf: 'flex-end' },
  localeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 64,
  },
  localeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  hero: { gap: spacing.md },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  roles: { gap: spacing.md },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: { flex: 1, gap: 2 },
});
