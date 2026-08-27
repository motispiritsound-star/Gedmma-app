import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, Field, StepProgress, Txt } from '@/components/ui';
import { usePublicApi } from '@/hooks/use-api';
import { useJobDraft } from '@/store/draft-job';
import { useSession } from '@/store/session';
import { formatMoney } from '@/utils/format';
import type { CategoryNode } from '@/api/types';
import { colors, spacing } from '@/theme';
import { WIZARD_STEPS } from './category';

export default function BudgetStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = usePublicApi();
  const locale = useSession((state) => state.locale);
  const draft = useJobDraft();

  const { data } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api<{ categories: CategoryNode[] }>('/v1/catalog/categories'),
  });

  /** Guidance for this trade, so a customer has a sense of the going rate. */
  const guidance = useMemo(() => {
    const flat = (data?.categories ?? []).flatMap((parent) => [parent, ...parent.children]);
    const match = flat.find((entry) => entry.slug === draft.categorySlug);
    if (!match?.typicalBudgetMinCentimes || !match.typicalBudgetMaxCentimes) return null;
    return t('job.budgetTypical', {
      min: formatMoney(match.typicalBudgetMinCentimes, locale),
      max: formatMoney(match.typicalBudgetMaxCentimes, locale),
    });
  }, [data, draft.categorySlug, locale, t]);

  const min = Number.parseInt(draft.budgetMinMad, 10);
  const max = Number.parseInt(draft.budgetMaxMad, 10);
  const inverted = Number.isFinite(min) && Number.isFinite(max) && min > max;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('job.budgetTitle') }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <StepProgress current={5} total={WIZARD_STEPS} />
          <Txt variant="caption" color={colors.textMuted}>
            {t('job.stepOf', { current: 5, total: WIZARD_STEPS })}
          </Txt>
          <Txt variant="title">{t('job.budgetTitle')}</Txt>
          <Txt variant="body" color={colors.textMuted}>
            {t('job.budgetHint')}
          </Txt>
        </View>

        {guidance ? (
          <View style={styles.guidance}>
            <Txt variant="caption" color={colors.primaryDark}>
              {guidance}
            </Txt>
          </View>
        ) : null}

        <Field
          label={t('job.budgetMin')}
          value={draft.budgetMinMad}
          onChangeText={(value) => draft.update({ budgetMinMad: value.replace(/\D/g, '') })}
          keyboardType="number-pad"
          optional
          optionalLabel={t('common.optional')}
          style={{ textAlign: 'left', writingDirection: 'ltr' }}
        />
        <Field
          label={t('job.budgetMax')}
          value={draft.budgetMaxMad}
          onChangeText={(value) => draft.update({ budgetMaxMad: value.replace(/\D/g, '') })}
          keyboardType="number-pad"
          error={inverted ? t('errors.budgetRange') : null}
          optional
          optionalLabel={t('common.optional')}
          style={{ textAlign: 'left', writingDirection: 'ltr' }}
        />

        <Button
          title={t('common.next')}
          onPress={() => router.push('/post/review')}
          disabled={inverted}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.sm },
  guidance: {
    backgroundColor: colors.primarySurface,
    borderRadius: spacing.md,
    padding: spacing.md,
  },
});
