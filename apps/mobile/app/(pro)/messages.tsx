import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, Loader, Txt } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { formatRelative } from '@/utils/format';
import type { ConversationSummary, Page } from '@/api/types';
import { colors, spacing } from '@/theme';

export default function Conversations() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const locale = useSession((state) => state.locale);
  const user = useSession((state) => state.user);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api<Page<ConversationSummary>>('/v1/conversations', { query: { limit: 30 } }),
  });

  if (isLoading) return <Loader label={t('common.loading')} />;

  const conversations = data?.items ?? [];
  const isPro = user?.role === 'PRO';

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, conversations.length === 0 && styles.listEmpty]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => {
        const unread = isPro ? item.proUnread : item.customerUnread;
        const counterpartName = isPro
          ? (item.job.customer.firstName ?? t('common.appName'))
          : item.pro.displayName;
        const preview = item.messages[0];

        return (
          <Card onPress={() => router.push(`/conversation/${item.id}`)}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Txt variant="subheading" numberOfLines={1}>
                  {counterpartName}
                </Txt>
                <Txt variant="caption" color={colors.textMuted} numberOfLines={1}>
                  {t('messages.aboutJob', { title: item.job.title })}
                </Txt>
                {preview ? (
                  <Txt variant="caption" color={colors.textSubtle} numberOfLines={1}>
                    {preview.body}
                  </Txt>
                ) : null}
              </View>
              <View style={styles.rowMeta}>
                <Txt variant="caption" color={colors.textSubtle}>
                  {formatRelative(item.lastMessageAt ?? preview?.createdAt, locale)}
                </Txt>
                {unread > 0 ? <Badge label={String(unread)} tone="success" /> : null}
              </View>
            </View>
          </Card>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon="chatbubbles-outline"
          title={t('messages.empty')}
          body={t('messages.emptyBody')}
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
  rowMeta: { alignItems: 'flex-end', gap: spacing.xs },
});
