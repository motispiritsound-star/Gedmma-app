import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { formatDutchPhone } from '@buurklus/shared';
import { Badge, Button, Card, Divider, EmptyState, Loader, Txt } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { formatDate, formatMoney, formatRelative } from '@/utils/format';
import type { ProDashboard, ProJobDetail } from '@/api/types';
import { colors, spacing } from '@/theme';

export default function LeadDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const locale = useSession((state) => state.locale);
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api<{ job: ProJobDetail; viewer: 'PRO' }>(`/v1/jobs/${id}`),
  });

  const dashboard = useQuery({
    queryKey: ['pro-dashboard'],
    queryFn: () => api<ProDashboard>('/v1/pros/me/dashboard'),
  });

  if (isLoading) return <Loader label={t('common.loading')} />;
  if (error || !data) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title={t('common.somethingWentWrong')}
        action={<Button title={t('common.retry')} onPress={() => void refetch()} />}
      />
    );
  }

  const job = data.job;
  const credits = dashboard.data?.subscription?.creditsRemaining ?? 0;
  const budget =
    job.budgetMinCents != null || job.budgetMaxCents != null
      ? [job.budgetMinCents, job.budgetMaxCents]
          .filter((value): value is number => value != null)
          .map((value) => formatMoney(value, locale))
          .join(' – ')
      : null;

  return (
    <>
      <Stack.Screen options={{ title: t('job.reference', { reference: job.reference }) }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Txt variant="heading">{job.title}</Txt>
          <View style={styles.badges}>
            <Badge label={job.category.name} tone="success" />
            <Badge label={t(`job.urgency.${job.urgency}`)} tone="warning" />
            {budget ? <Badge label={budget} tone="neutral" icon="pricetag-outline" /> : null}
          </View>
          <Divider />
          <Txt variant="body" color={colors.textMuted}>
            {job.description}
          </Txt>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSubtle} />
            <Txt variant="caption" color={colors.textMuted}>
              {[job.city.name, job.district].filter(Boolean).join(' · ')}
            </Txt>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color={colors.textSubtle} />
            <Txt variant="caption" color={colors.textMuted}>
              {t('job.quotesReceived', { count: job.quoteCount })} ·{' '}
              {formatRelative(job.publishedAt ?? job.createdAt, locale)}
            </Txt>
          </View>
          {job.preferredStartDate ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSubtle} />
              <Txt variant="caption" color={colors.textMuted}>
                {formatDate(job.preferredStartDate, locale)}
              </Txt>
            </View>
          ) : null}
        </Card>

        {/* The address and phone arrive only once this pro has won the job. */}
        {job.isAwardedToMe ? (
          <Card>
            <Txt variant="subheading">{t('quote.accepted')}</Txt>
            {job.addressLine ? (
              <View style={styles.metaRow}>
                <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                <Txt variant="body">{job.addressLine}</Txt>
              </View>
            ) : null}
            {job.contactPhone ? (
              <Button
                title={formatDutchPhone(job.contactPhone)}
                icon="call-outline"
                onPress={() => void Linking.openURL(`tel:${job.contactPhone}`)}
              />
            ) : null}
          </Card>
        ) : null}

        {job.myQuote ? (
          <Card>
            <View style={styles.quoteRow}>
              <Txt variant="subheading" style={styles.quoteLabel}>
                {t('quote.title')}
              </Txt>
              <Txt variant="heading" color={colors.primaryDark}>
                {formatMoney(job.myQuote.amountCents, locale)}
              </Txt>
            </View>
            <Txt variant="body" color={colors.textMuted}>
              {job.myQuote.message}
            </Txt>
            <Badge
              label={t('quote.validUntil', { date: formatDate(job.myQuote.validUntil, locale) })}
              tone="neutral"
            />
          </Card>
        ) : (
          <View style={styles.cta}>
            <Txt variant="caption" color={colors.textMuted}>
              {t('quote.creditCost', { remaining: credits })}
            </Txt>
            <Button
              title={t('quote.sendTitle')}
              onPress={() => router.push(`/lead/${id}/quote`)}
              disabled={credits <= 0}
            />
            {credits <= 0 ? (
              <Button
                title={t('subscription.chooseTitle')}
                variant="secondary"
                onPress={() => router.push('/subscription')}
              />
            ) : null}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  quoteLabel: { flex: 1 },
  cta: { gap: spacing.sm },
});
