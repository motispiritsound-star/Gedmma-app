import React from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { TRIAL_DURATION_DAYS } from '@buurklus/shared';
import { Badge, Button, Card, Divider, Loader, Txt } from '@/components/ui';
import { SettingsRow } from '@/components/settings-row';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { formatDate } from '@/utils/format';
import type { ProDashboard } from '@/api/types';
import { colors, radius, spacing } from '@/theme';

export default function Dashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const locale = useSession((state) => state.locale);
  const user = useSession((state) => state.user);
  const signOut = useSession((state) => state.signOut);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['pro-dashboard'],
    queryFn: () => api<ProDashboard>('/v1/pros/me/dashboard'),
  });

  if (isLoading) return <Loader label={t('common.loading')} />;

  const subscription = data?.subscription;
  const stats = data?.stats;
  // The balance carries over between months and can exceed the quota, so the
  // meter is scaled against whichever is larger and clamped at both ends.
  const creditScale = subscription
    ? Math.max(subscription.monthlyCredits, subscription.creditsRemaining, 1)
    : 1;
  const remainingRatio = subscription
    ? Math.min(1, Math.max(0, subscription.creditsRemaining / creditScale))
    : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />
      }
    >
      {subscription ? (
        <Card>
          <View style={styles.planHeader}>
            <View style={styles.planText}>
              <Txt variant="overline" color={colors.textMuted}>
                {t('subscription.currentPlan')}
              </Txt>
              <Txt variant="heading">{subscription.planName}</Txt>
            </View>
            {subscription.status === 'TRIALING' ? (
              <Badge
                label={t('subscription.trialTitle', { days: TRIAL_DURATION_DAYS })}
                tone="accent"
              />
            ) : subscription.monthlyPriceCents === 0 ? (
              // Nothing is being paid for, so "active" would say very little.
              <Badge label={t('subscription.free.badge')} tone="accent" />
            ) : (
              <Badge label={t(`job.status.${subscription.grantsAccess ? 'OPEN' : 'EXPIRED'}`)} tone={subscription.grantsAccess ? 'success' : 'danger'} />
            )}
          </View>

          <Txt variant="body">
            {subscription.creditsRemaining > subscription.monthlyCredits
              ? t('pro.creditsRemaining', { count: subscription.creditsRemaining })
              : t('pro.creditsOf', {
                  remaining: subscription.creditsRemaining,
                  total: subscription.monthlyCredits,
                })}
          </Txt>
          {/* Fills with what is left, not with what is spent. */}
          <View style={styles.meter}>
            <View style={[styles.meterFill, { width: `${remainingRatio * 100}%` }]} />
          </View>

          <Txt variant="caption" color={colors.textMuted}>
            {subscription.cancelAtPeriodEnd
              ? t('subscription.cancelAtPeriodEnd', {
                  date: formatDate(subscription.currentPeriodEnd, locale),
                })
              : subscription.status === 'TRIALING'
                ? t('subscription.trialEndsOn', {
                    date: formatDate(subscription.trialEndsAt ?? subscription.currentPeriodEnd, locale),
                  })
                : t('subscription.renewsOn', {
                    date: formatDate(subscription.currentPeriodEnd, locale),
                  })}
          </Txt>

          <Button
            title={t(
              subscription.monthlyPriceCents === 0
                ? 'subscription.free.screenTitle'
                : 'subscription.title',
            )}
            variant="secondary"
            size="md"
            onPress={() => router.push('/subscription')}
          />
        </Card>
      ) : (
        <Card>
          <Txt variant="heading">{t('subscription.chooseTitle')}</Txt>
          <Txt variant="body" color={colors.textMuted}>
            {t('subscription.chooseSubtitle')}
          </Txt>
          <Button title={t('subscription.choosePlan')} onPress={() => router.push('/subscription')} />
        </Card>
      )}

      <View style={styles.stats}>
        {(
          [
            ['pro.pendingQuotes', stats?.pendingQuotes ?? 0, 'time-outline'],
            ['pro.wonJobs', stats?.wonJobs ?? 0, 'trophy-outline'],
            ['pro.unreadMessages', stats?.unreadMessages ?? 0, 'chatbubble-outline'],
          ] as const
        ).map(([key, value, icon]) => (
          <View key={key} style={styles.statCard}>
            <Ionicons name={icon} size={20} color={colors.primary} />
            <Txt variant="title">{String(value)}</Txt>
            <Txt variant="caption" color={colors.textMuted} align="center" numberOfLines={2}>
              {t(key)}
            </Txt>
          </View>
        ))}
      </View>

      <View style={styles.group}>
        <SettingsRow
          icon="business-outline"
          label={t('pro.publicProfile')}
          onPress={() => router.push('/pro-onboarding')}
        />
        <Divider />
        <SettingsRow
          icon="receipt-outline"
          label={t('subscription.invoices')}
          onPress={() => router.push('/subscription')}
        />
        <Divider />
        <SettingsRow
          icon="language-outline"
          label={t('profile.language')}
          value={t(`language.${locale}`)}
          onPress={() => router.push('/settings/language')}
        />
        <Divider />
        <SettingsRow
          icon="person-outline"
          label={t('profile.personalInfo')}
          value={user?.firstName ?? undefined}
          onPress={() => router.push('/settings/account')}
        />
        <Divider />
        <SettingsRow
          icon="log-out-outline"
          label={t('auth.signOut')}
          tone="danger"
          onPress={() =>
            Alert.alert(t('auth.signOut'), t('auth.signOutConfirm'), [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('auth.signOut'),
                style: 'destructive',
                onPress: () => void signOut().then(() => router.replace('/(auth)/welcome')),
              },
            ])
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  planText: { flex: 1, gap: 2 },
  meter: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  meterFill: { height: 6, backgroundColor: colors.primary },

  stats: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  group: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
