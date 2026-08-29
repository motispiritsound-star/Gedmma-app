import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, EmptyState, Loader, Txt } from '@/components/ui';
import { JobCard } from '@/components/cards';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import type { JobSummary, Page } from '@/api/types';
import { colors, spacing } from '@/theme';

export default function MyJobs() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const locale = useSession((state) => state.locale);

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => api<Page<JobSummary>>('/v1/jobs/mine', { query: { limit: 30 } }),
  });

  if (isLoading) return <Loader label={t('common.loading')} />;

  if (error) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title={t('common.somethingWentWrong')}
        body={error instanceof Error ? error.message : undefined}
        action={<Button title={t('common.retry')} onPress={() => void refetch()} />}
      />
    );
  }

  const jobs = data?.items ?? [];

  return (
    <FlatList
      data={jobs}
      keyExtractor={(job) => job.id}
      contentContainerStyle={[styles.list, jobs.length === 0 && styles.listEmpty]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      renderItem={({ item }) => (
        <JobCard job={item} locale={locale} onPress={() => router.push(`/job/${item.id}`)} />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title={t('job.noJobsTitle')}
          body={t('job.noJobsBody')}
          action={<Button title={t('home.postJobCta')} onPress={() => router.push('/post/category')} />}
        />
      }
      ListHeaderComponent={
        jobs.length > 0 ? (
          <Txt variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
            {t('job.quotesReceived', {
              count: jobs.reduce((total, job) => total + job.quoteCount, 0),
            })}
          </Txt>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
});
