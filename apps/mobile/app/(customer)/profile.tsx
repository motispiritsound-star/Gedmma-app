import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { formatDutchPhone } from '@buurklus/shared';
import { Card, Divider, Txt } from '@/components/ui';
import { SettingsRow } from '@/components/settings-row';
import { useSession } from '@/store/session';
import { colors, radius, spacing } from '@/theme';

export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useSession((state) => state.user);
  const locale = useSession((state) => state.locale);
  const signOut = useSession((state) => state.signOut);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  function confirmSignOut() {
    Alert.alert(t('auth.signOut'), t('auth.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/(auth)/welcome'));
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>
          <View style={styles.identityText}>
            <Txt variant="heading">{fullName || t('profile.personalInfo')}</Txt>
            <Txt variant="caption" color={colors.textMuted}>
              {user ? formatDutchPhone(user.phone) : ''}
            </Txt>
          </View>
        </View>
      </Card>

      {user?.role !== 'PRO' ? (
        <Card onPress={() => router.push('/pro-onboarding')}>
          <View style={styles.promoRow}>
            <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="hammer-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.identityText}>
              <Txt variant="subheading">{t('profile.becomePro')}</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {t('profile.becomeProBody')}
              </Txt>
            </View>
          </View>
        </Card>
      ) : null}

      <View style={styles.group}>
        <Txt variant="overline" color={colors.textMuted} style={styles.groupTitle}>
          {t('profile.settings')}
        </Txt>
        <View style={styles.groupBody}>
          <SettingsRow
            icon="person-outline"
            label={t('profile.personalInfo')}
            onPress={() => router.push('/settings/account')}
          />
          <Divider />
          <SettingsRow
            icon="language-outline"
            label={t('profile.language')}
            value={t(`language.${locale}`)}
            onPress={() => router.push('/settings/language')}
          />
          <Divider />
          <SettingsRow icon="notifications-outline" label={t('profile.notifications')} />
        </View>
      </View>

      <View style={styles.group}>
        <View style={styles.groupBody}>
          <SettingsRow icon="help-circle-outline" label={t('profile.help')} />
          <Divider />
          <SettingsRow
            icon="document-outline"
            label={t('profile.terms')}
            onPress={() => void Linking.openURL(`${SITE_URL}/voorwaarden/`)}
          />
          <Divider />
          <SettingsRow
            icon="lock-closed-outline"
            label={t('privacy.title')}
            onPress={() => router.push('/settings/privacy')}
          />
          <Divider />
          <SettingsRow
            icon="log-out-outline"
            label={t('auth.signOut')}
            tone="danger"
            onPress={confirmSignOut}
          />
        </View>
      </View>

      <Txt variant="caption" color={colors.textSubtle} align="center">
        {t('profile.version', { version: Constants.expoConfig?.version ?? '0.1.0' })}
      </Txt>
    </ScrollView>
  );
}

/** Where the published legal documents live. */
const SITE_URL = 'https://buurklus.nl';

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: 2 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  group: { gap: spacing.xs },
  groupTitle: { paddingHorizontal: spacing.xs },
  groupBody: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
