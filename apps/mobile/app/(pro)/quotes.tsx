import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, Loader, Txt } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { formatMoney, formatRelative } from '@/utils/format';
import type { Page, Quote } from '@/api/types';
import { colors, spacing } from '@/theme';

type ProQuote = Quote & {
  job: {
    id: string;
    reference: string;
    title: string;
    status: string;
    awardedQuoteId: string | null;
    city: { nameFr: string; nameAr: string; nameEn: string; slug: string };
    category: { nameFr: string; nameAr: string; nameEn: string; slug: string; icon: string };
  };
};

const STATUS_TONE = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'neutral',
  WITHDRAWN: 'neutral',
  EXPIRED: 'neutral',
} as const;

const STATUS_KEY = {
  PENDING: 'quote.pending',
  ACCEPTED: 'quote.accepted',
  REJECTED: 'quote.rejected',
  WITHDRAWN: 'quote.withdrawn',
  EXPIRED: 'job.status.EXPIRED',
} as const;

export default function MyQuotes() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const locale = useSession((state) => state.locale);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['my-quotes'],
    queryFn: () => api<Page<ProQuote>>('/v1/pros/me/quotes', { query: { limit: 30 } }),
  });

  if (isLoading) return <Loader label={t('common.loading')} />;

  const quotes = data?.items ?? [];

  return (
    <FlatList
      data={quotes}
      keyExtractor={(quote) => quote.id}
      contentContainerStyle={[styles.list, quotes.length === 0 && styles.listEmpty]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      renderItem={({ item }) => (
        <Card onPress={() => router.push(`/lead/${item.job.id}`)}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Txt variant="subheading" numberOfLines={2}>
                {item.job.title}
              </Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {t('job.reference', { reference: item.job.reference })}
              </Txt>
            </View>
            <Txt variant="heading" color={colors.primaryDark}>
              {formatMoney(item.amountCentimes, locale)}
            </Txt>
          </View>

          <View style={styles.footer}>
            <Badge
              label={t(STATUS_KEY[item.status])}
              tone={STATUS_TONE[item.status]}
            />
            <Txt variant="caption" color={colors.textSubtle}>
              {formatRelative(item.createdAt, locale)}
            </Txt>
          </View>
        </Card>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title={t('quote.noQuotesTitle')}
          body={t('quote.noQuotesBody')}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowText: { flex: 1, gap: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
