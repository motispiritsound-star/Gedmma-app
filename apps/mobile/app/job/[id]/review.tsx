import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field, Txt } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { ApiError } from '@/api/client';
import { colors, spacing } from '@/theme';

const AXES = ['quality', 'punctuality', 'price', 'communication'] as const;

function StarPicker({
  value,
  onChange,
  size = 30,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="radio"
          accessibilityState={{ selected: value >= star }}
          accessibilityLabel={`${star}/5`}
          onPress={() => onChange(star)}
          hitSlop={6}
        >
          <Ionicons
            name={value >= star ? 'star' : 'star-outline'}
            size={size}
            color={value >= star ? colors.warning : colors.borderStrong}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function LeaveReview() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [rating, setRating] = useState(0);
  const [axes, setAxes] = useState<Record<(typeof AXES)[number], number>>({
    quality: 0,
    punctuality: 0,
    price: 0,
    communication: 0,
  });
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      api(`/v1/jobs/${id}/review`, {
        method: 'POST',
        body: {
          rating,
          // Only the axes the customer actually rated are sent.
          qualityRating: axes.quality || undefined,
          punctualityRating: axes.punctuality || undefined,
          priceRating: axes.price || undefined,
          communicationRating: axes.communication || undefined,
          comment: comment.trim(),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['job', id] });
      router.back();
    },
    onError: (caught) =>
      setError(caught instanceof ApiError ? caught.message : t('errors.unknown')),
  });

  const canSubmit = rating > 0 && comment.trim().length >= 10;

  return (
    <>
      <Stack.Screen options={{ title: t('review.title') }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Txt variant="body" color={colors.textMuted}>
          {t('review.subtitle')}
        </Txt>

        <View style={styles.overall}>
          <Txt variant="bodyStrong" align="center">
            {t('review.overall')}
          </Txt>
          <StarPicker value={rating} onChange={setRating} />
        </View>

        {AXES.map((axis) => (
          <View key={axis} style={styles.axisRow}>
            <Txt variant="body" style={styles.axisLabel}>
              {t(`review.${axis}`)}
            </Txt>
            <StarPicker
              size={20}
              value={axes[axis]}
              onChange={(next) => setAxes((current) => ({ ...current, [axis]: next }))}
            />
          </View>
        ))}

        <Field
          label={t('review.comment')}
          placeholder={t('review.commentPlaceholder')}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={1500}
          error={error}
        />

        <Button
          title={t('review.submit')}
          onPress={() => submit.mutate()}
          loading={submit.isPending}
          disabled={!canSubmit}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  overall: { gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.md },
  starRow: { flexDirection: 'row', gap: spacing.xs },
  axisRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  axisLabel: { flex: 1 },
});
