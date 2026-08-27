import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, Divider, Txt } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useJobDraft } from '@/store/draft-job';
import { useSession } from '@/store/session';
import { ApiError, NetworkError } from '@/api/client';
import { formatMoney } from '@/utils/format';
import type { JobSummary } from '@/api/types';
import { colors, spacing } from '@/theme';

export default function ReviewStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const locale = useSession((state) => state.locale);
  const draft = useJobDraft();
  const reset = useJobDraft((state) => state.reset);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setSubmitting(true);
    setError(null);

    try {
      const { job } = await api<{ job: JobSummary }>('/v1/jobs', {
        method: 'POST',
        body: draft.toPayload(),
      });

      await queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      reset();
      router.replace({ pathname: '/post/success', params: { id: job.id, reference: job.reference } });
    } catch (caught) {
      setError(
        caught instanceof NetworkError
          ? t('errors.network')
          : caught instanceof ApiError
            ? caught.message
            : t('errors.unknown'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const budget =
    draft.budgetMinMad || draft.budgetMaxMad
      ? [draft.budgetMinMad, draft.budgetMaxMad]
          .filter(Boolean)
          .map((value) => formatMoney(Number(value) * 100, locale))
          .join(' – ')
      : null;

  return (
    <>
      <Stack.Screen options={{ title: t('job.reviewTitle') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Txt variant="heading">{draft.title}</Txt>
          <View style={styles.badges}>
            {draft.categoryName ? <Badge label={draft.categoryName} tone="success" /> : null}
            <Badge label={t(`job.urgency.${draft.urgency}`)} tone="warning" />
            {budget ? <Badge label={budget} tone="neutral" icon="pricetag-outline" /> : null}
          </View>
          <Divider />
          <Txt variant="body" color={colors.textMuted}>
            {draft.description}
          </Txt>
        </Card>

        <Card>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Txt variant="body" style={styles.rowText}>
              {[draft.cityName, draft.district].filter(Boolean).join(' · ')}
            </Txt>
          </View>
          {draft.propertyType ? (
            <View style={styles.row}>
              <Ionicons name="home-outline" size={18} color={colors.primary} />
              <Txt variant="body" style={styles.rowText}>
                {t(`job.propertyType.${draft.propertyType}`)}
              </Txt>
            </View>
          ) : null}
          {draft.photoUrls.length > 0 ? (
            <View style={styles.row}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Txt variant="body" style={styles.rowText}>
                {draft.photoUrls.length}
              </Txt>
            </View>
          ) : null}
        </Card>

        {error ? (
          <Txt variant="caption" color={colors.danger}>
            {error}
          </Txt>
        ) : null}

        <Button
          title={submitting ? t('job.publishing') : t('job.publish')}
          onPress={() => void publish()}
          loading={submitting}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowText: { flex: 1 },
});
