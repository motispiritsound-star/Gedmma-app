import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, EmptyState, Loader, Txt } from '@/components/ui';
import { LeadCard } from '@/components/cards';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { ApiError } from '@/api/client';
import type { Lead, Page, ProDashboard } from '@/api/types';
import { colors, spacing } from '@/theme';

export default function Leads() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const locale = useSession((state) => state.locale);

  const dashboard = useQuery({
    queryKey: ['pro-dashboard'],
    queryFn: () => api<ProDashboard>('/v1/pros/me/dashboard'),
  });

  const leads = useQuery({
    queryKey: ['leads'],
    queryFn: () => api<Page<Lead>>('/v1/pros/me/leads', { query: { limit: 30 } }),
    // A pro whose subscription lapsed gets 402; the paywall below explains it
    // rather than the list retrying forever.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 402) && failureCount < 2,
  });

  const subscription = dashboard.data?.subscription;

  if (leads.isLoading) return <Loader label={t('common.loading')} />;

  if (leads.error instanceof ApiError && leads.error.status === 402) {
    return (
      <EmptyState
        icon="lock-closed-outline"
        title={t('subscription.outOfCreditsTitle')}
        body={leads.error.message}
        action={
          <Button title={t('subscription.chooseTitle')} onPress={() => router.push('/subscription')} />
        }
      />
    );
  }

  const items = leads.data?.items ?? [];

  return (
    <FlatList
      data={items}
      keyExtractor={(lead) => lead.id}
      contentContainerStyle={[styles.list, items.length === 0 && styles.listEmpty]}
      refreshControl={
        <RefreshControl
          refreshing={leads.isRefetching}
          onRefresh={() => {
            void leads.refetch();
            void dashboard.refetch();
          }}
          tintColor={colors.primary}
        />
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListHeaderComponent={
        subscription ? (
          <View style={styles.creditsBar}>
            <Txt variant="caption" color={colors.textMuted}>
              {/* Credits carry over, so the balance can exceed the monthly
                  quota; showing "154 of 150" would read as a bug. */}
              {subscription.creditsRemaining > subscription.monthlyCredits
                ? t('pro.creditsRemaining', { count: subscription.creditsRemaining })
                : t('pro.creditsOf', {
                    remaining: subscription.creditsRemaining,
                    total: subscription.monthlyCredits,
                  })}
            </Txt>
            {subscription.creditsRemaining <= 3 ? (
              <Badge label={t('subscription.chooseTitle')} tone="warning" icon="alert-circle" />
            ) : null}
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <LeadCard lead={item} locale={locale} onPress={() => router.push(`/lead/${item.id}`)} />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="briefcase-outline"
          title={t('pro.leadsEmpty')}
          body={t('pro.leadsEmptyBody')}
          action={
            <Button
              title={t('pro.trades')}
              variant="secondary"
              onPress={() => router.push('/pro-onboarding')}
            />
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  creditsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
