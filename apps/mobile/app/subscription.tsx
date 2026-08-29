import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  PRICING_NOTICE_DAYS,
  TRIAL_CREDITS,
  TRIAL_DURATION_DAYS,
  applyVat,
  type BillingPeriod,
} from '@buurklus/shared';
import { Badge, Button, Card, Divider, Loader, Txt } from '@/components/ui';
import { useApi, usePublicApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { ApiError } from '@/api/client';
import { formatDate, formatMoney } from '@/utils/format';
import type { PlanRef, ProDashboard } from '@/api/types';
import { colors, radius, spacing } from '@/theme';

export default function Subscription() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const publicApi = usePublicApi();
  const queryClient = useQueryClient();
  const locale = useSession((state) => state.locale);
  const [period, setPeriod] = useState<BillingPeriod>('MONTHLY');

  const plans = useQuery({
    queryKey: ['plans', locale],
    queryFn: () => publicApi<{ plans: PlanRef[] }>('/v1/catalog/plans'),
  });

  const dashboard = useQuery({
    queryKey: ['pro-dashboard'],
    queryFn: () => api<ProDashboard>('/v1/pros/me/dashboard'),
  });

  const subscribe = useMutation({
    mutationFn: (planSlug: string) =>
      api<{ redirectUrl: string | null }>('/v1/subscriptions', {
        method: 'POST',
        body: { planSlug, period, paymentMethod: 'IDEAL' },
      }),
    onSuccess: async () => {
      // With a live gateway the response carries a redirect URL to open; in
      // development, and for an offline method, the mock adapter settles at once.
      await queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      router.back();
    },
    onError: (caught) =>
      Alert.alert(
        t('common.somethingWentWrong'),
        caught instanceof ApiError ? caught.message : t('errors.unknown'),
      ),
  });

  const cancel = useMutation({
    mutationFn: () =>
      api('/v1/subscriptions/cancel', { method: 'POST', body: { atPeriodEnd: true } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] }),
  });

  if (plans.isLoading) return <Loader label={t('common.loading')} />;

  const current = dashboard.data?.subscription;
  const offered = plans.data?.plans ?? [];

  /**
   * Nothing on offer costs anything. Read from the prices the API returned
   * rather than a flag in the app, so the screen cannot claim the platform is
   * free after the paid plans have been switched back on server-side.
   */
  const everythingIsFree =
    offered.length > 0 &&
    offered.every((plan) => plan.monthlyPriceCents === 0 && plan.yearlyPriceCents === 0);

  if (everythingIsFree) {
    const total = current?.monthlyCredits ?? offered[0]?.monthlyCredits ?? 0;
    return (
      <>
        {/* "Subscription" would be the wrong word for a screen that has none. */}
        <Stack.Screen options={{ title: t('subscription.free.screenTitle') }} />
        <ScrollView contentContainerStyle={styles.container}>
          <Card>
            <Badge label={t('subscription.free.badge')} tone="accent" icon="gift" />
            <Txt variant="title">{t('subscription.free.title')}</Txt>
            <Txt variant="body" color={colors.textMuted}>
              {t('subscription.free.body')}
            </Txt>

            {current ? (
              <>
                <Divider />
                <Txt variant="bodyStrong">
                  {t('subscription.free.quota', {
                    remaining: current.creditsRemaining,
                    total,
                  })}
                </Txt>
                <Txt variant="caption" color={colors.textMuted}>
                  {t('subscription.free.renews', {
                    total,
                    date: formatDate(current.currentPeriodEnd, locale),
                  })}
                </Txt>
              </>
            ) : null}
          </Card>

          <Card>
            <Txt variant="heading">{t('subscription.free.laterTitle')}</Txt>
            <Txt variant="body" color={colors.textMuted}>
              {t('subscription.free.later', { days: PRICING_NOTICE_DAYS })}
            </Txt>
            <Txt variant="caption" color={colors.textSubtle}>
              {t('subscription.free.noPayment')}
            </Txt>
          </Card>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('subscription.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Txt variant="title">{t('subscription.chooseTitle')}</Txt>
          <Txt variant="body" color={colors.textMuted}>
            {t('subscription.chooseSubtitle')}
          </Txt>
        </View>

        {current?.status === 'TRIALING' ? (
          <View style={styles.trialBanner}>
            <Ionicons name="gift-outline" size={20} color={colors.accent} />
            <View style={styles.trialText}>
              <Txt variant="bodyStrong">
                {t('subscription.trialTitle', { days: TRIAL_DURATION_DAYS })}
              </Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {t('subscription.trialBody', { credits: TRIAL_CREDITS })}
              </Txt>
            </View>
          </View>
        ) : null}

        {/* Monthly / yearly toggle. Yearly is ten months, so it is worth surfacing. */}
        <View style={styles.periodToggle}>
          {(['MONTHLY', 'YEARLY'] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: period === option }}
              onPress={() => setPeriod(option)}
              style={[styles.periodOption, period === option && styles.periodOptionActive]}
            >
              <Txt
                variant="bodyStrong"
                align="center"
                color={period === option ? colors.textInverse : colors.text}
              >
                {t(option === 'MONTHLY' ? 'subscription.monthly' : 'subscription.yearly')}
              </Txt>
            </Pressable>
          ))}
        </View>
        {period === 'YEARLY' ? (
          <Badge label={t('subscription.yearlySaving')} tone="accent" icon="pricetag" />
        ) : null}

        {offered.map((plan) => {
          const netCents =
            period === 'YEARLY' ? plan.yearlyPriceCents : plan.monthlyPriceCents;
          const gross = applyVat(netCents).grossCents;
          const isCurrent = current?.planSlug === plan.slug && current.grantsAccess;

          return (
            <Card key={plan.slug} style={plan.featured ? styles.featuredCard : undefined}>
              <View style={styles.planHeader}>
                <View style={styles.planTitle}>
                  <Txt variant="heading">{plan.name}</Txt>
                  <Txt variant="caption" color={colors.textMuted}>
                    {plan.tagline}
                  </Txt>
                </View>
                {isCurrent ? <Badge label={t('subscription.currentPlan')} tone="success" /> : null}
              </View>

              <View style={styles.priceRow}>
                <Txt variant="display" color={colors.primaryDark}>
                  {formatMoney(netCents, locale)}
                </Txt>
                <Txt variant="caption" color={colors.textMuted}>
                  {t(period === 'YEARLY' ? 'subscription.perYear' : 'subscription.perMonth')}{' '}
                  {t('subscription.excludingVat')}
                </Txt>
              </View>
              <Txt variant="caption" color={colors.textSubtle}>
                {formatMoney(gross, locale)} {t('subscription.includingVat')}
              </Txt>

              <Divider />

              <View style={styles.perks}>
                {plan.perks.map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Txt variant="body" style={styles.perkText}>
                      {perk}
                    </Txt>
                  </View>
                ))}
              </View>

              <Button
                title={isCurrent ? t('subscription.currentPlan') : t('subscription.choosePlan')}
                variant={plan.featured && !isCurrent ? 'primary' : 'secondary'}
                disabled={isCurrent}
                loading={subscribe.isPending && subscribe.variables === plan.slug}
                onPress={() => subscribe.mutate(plan.slug)}
              />
            </Card>
          );
        })}

        <Txt variant="caption" color={colors.textSubtle}>
          {t('subscription.vatNotice')}
        </Txt>

        {current && current.grantsAccess && !current.cancelAtPeriodEnd ? (
          <Button
            title={t('subscription.cancel')}
            variant="danger"
            loading={cancel.isPending}
            onPress={() =>
              Alert.alert(t('subscription.cancel'), t('subscription.cancelConfirm'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.confirm'), style: 'destructive', onPress: () => cancel.mutate() },
              ])
            }
          />
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.sm },
  trialBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  trialText: { flex: 1, gap: 2 },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  periodOption: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill },
  periodOptionActive: { backgroundColor: colors.primary },
  featuredCard: { borderColor: colors.primary, borderWidth: 1.5 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  planTitle: { flex: 1, gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  perks: { gap: spacing.sm },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  perkText: { flex: 1 },
});
