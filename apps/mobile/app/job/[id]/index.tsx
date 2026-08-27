import React from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, Divider, EmptyState, Loader, Txt } from '@/components/ui';
import { QuoteCard } from '@/components/cards';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { ApiError } from '@/api/client';
import { formatDate, formatMoney, formatRelative } from '@/utils/format';
import { pickName } from '@/utils/format';
import type { CustomerJobDetail } from '@/api/types';
import { colors, spacing } from '@/theme';

interface JobResponse {
  job: CustomerJobDetail;
  viewer: 'CUSTOMER' | 'PRO';
}

export default function JobDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const locale = useSession((state) => state.locale);
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api<JobResponse>(`/v1/jobs/${id}`),
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['job', id] }),
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] }),
    ]);
  };

  const accept = useMutation({
    mutationFn: (quoteId: string) =>
      api(`/v1/jobs/${id}/quotes/${quoteId}/accept`, { method: 'POST' }),
    onSuccess: invalidate,
    onError: (caught) =>
      Alert.alert(t('common.somethingWentWrong'), caught instanceof ApiError ? caught.message : ''),
  });

  const cancel = useMutation({
    mutationFn: () => api(`/v1/jobs/${id}/cancel`, { method: 'POST', body: {} }),
    onSuccess: invalidate,
  });

  const complete = useMutation({
    mutationFn: () => api(`/v1/jobs/${id}/complete`, { method: 'POST' }),
    onSuccess: invalidate,
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
  const isOpen = job.status === 'OPEN' || job.status === 'QUOTED';
  const budget =
    job.budgetMinCentimes != null || job.budgetMaxCentimes != null
      ? [job.budgetMinCentimes, job.budgetMaxCentimes]
          .filter((value): value is number => value != null)
          .map((value) => formatMoney(value, locale))
          .join(' – ')
      : null;

  function confirmAccept(quoteId: string, proName: string) {
    Alert.alert(t('quote.accept'), `${proName}\n\n${t('quote.acceptConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: () => accept.mutate(quoteId) },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: t('job.reference', { reference: job.reference }) }} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />
        }
      >
        <Card>
          <Txt variant="heading">{job.title}</Txt>
          <View style={styles.badges}>
            <Badge label={t(`job.status.${job.status}`)} tone={isOpen ? 'warning' : 'success'} />
            <Badge label={t(`job.urgency.${job.urgency}`)} tone="neutral" />
            {budget ? <Badge label={budget} tone="neutral" icon="pricetag-outline" /> : null}
          </View>
          <Divider />
          <Txt variant="body" color={colors.textMuted}>
            {job.description}
          </Txt>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSubtle} />
            <Txt variant="caption" color={colors.textMuted}>
              {[pickName(job.city, locale), job.district].filter(Boolean).join(' · ')}
            </Txt>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="eye-outline" size={16} color={colors.textSubtle} />
            <Txt variant="caption" color={colors.textMuted}>
              {job.viewCount} · {formatRelative(job.publishedAt ?? job.createdAt, locale)}
            </Txt>
          </View>
          {job.expiresAt && isOpen ? (
            <View style={styles.metaRow}>
              <Ionicons name="hourglass-outline" size={16} color={colors.textSubtle} />
              <Txt variant="caption" color={colors.textMuted}>
                {formatDate(job.expiresAt, locale)}
              </Txt>
            </View>
          ) : null}
        </Card>

        <View style={styles.section}>
          <Txt variant="heading">
            {job.quoteCount > 0
              ? t('job.quotesReceived', { count: job.quoteCount })
              : t('job.noQuotesYet')}
          </Txt>

          {job.quotes.length === 0 ? (
            <Card>
              <Txt variant="body" color={colors.textMuted}>
                {t('job.waitingForQuotes')}
              </Txt>
            </Card>
          ) : (
            job.quotes.map((quote) => {
              const isAwarded = job.awardedQuoteId === quote.id;
              return (
                <View key={quote.id} style={styles.quoteBlock}>
                  <QuoteCard
                    quote={quote}
                    locale={locale}
                    onPress={() => quote.pro && router.push(`/pro/${quote.pro.id}`)}
                  />
                  {isAwarded ? (
                    <Badge label={t('quote.accepted')} tone="success" icon="checkmark-circle" />
                  ) : quote.status === 'PENDING' && isOpen ? (
                    <View style={styles.quoteActions}>
                      <Button
                        title={t('quote.accept')}
                        size="md"
                        loading={accept.isPending}
                        onPress={() =>
                          confirmAccept(quote.id, quote.pro?.displayName ?? t('quote.title'))
                        }
                      />
                      <Button
                        title={t('quote.message')}
                        variant="secondary"
                        size="md"
                        onPress={() => router.push('/(customer)/messages')}
                      />
                    </View>
                  ) : (
                    <Badge label={t(`job.status.${job.status}`)} tone="neutral" />
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          {job.status === 'AWARDED' ? (
            <Button
              title={t('job.markComplete')}
              onPress={() =>
                Alert.alert(t('job.markComplete'), t('job.markCompleteConfirm'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.confirm'), onPress: () => complete.mutate() },
                ])
              }
              loading={complete.isPending}
            />
          ) : null}

          {job.status === 'COMPLETED' ? (
            <Button title={t('job.leaveReview')} onPress={() => router.push(`/job/${id}/review`)} />
          ) : null}

          {isOpen ? (
            <Button
              title={t('job.cancelJob')}
              variant="danger"
              loading={cancel.isPending}
              onPress={() =>
                Alert.alert(t('job.cancelJob'), t('job.cancelJobConfirm'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.confirm'), style: 'destructive', onPress: () => cancel.mutate() },
                ])
              }
            />
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { gap: spacing.md },
  quoteBlock: { gap: spacing.sm },
  quoteActions: { flexDirection: 'row', gap: spacing.sm },
});
