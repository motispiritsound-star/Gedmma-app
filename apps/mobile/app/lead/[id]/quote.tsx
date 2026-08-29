import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { QUOTE_DEFAULT_VALIDITY_DAYS, QUOTE_MESSAGE_MIN } from '@buurklus/shared';
import { Button, Field, Txt } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { ApiError } from '@/api/client';
import { colors, radius, spacing } from '@/theme';

/** A labelled switch row, used for the two yes/no options on this form. */
function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
    >
      <View style={[styles.checkbox, value && styles.checkboxOn]}>
        {value ? <Ionicons name="checkmark" size={14} color={colors.textInverse} /> : null}
      </View>
      <Txt variant="body" style={styles.toggleLabel}>
        {label}
      </Txt>
    </Pressable>
  );
}

export default function SendQuote() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [isEstimate, setIsEstimate] = useState(false);
  const [includesSiteVisit, setIncludesSiteVisit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountValue = Number.parseInt(amount, 10);
  const canSubmit =
    Number.isFinite(amountValue) && amountValue >= 50 && message.trim().length >= QUOTE_MESSAGE_MIN;

  const submit = useMutation({
    mutationFn: () =>
      api<{ creditsRemaining: number }>(`/v1/jobs/${id}/quotes`, {
        method: 'POST',
        body: {
          amountEur: amountValue,
          isEstimate,
          message: message.trim(),
          estimatedDurationDays: Number.parseInt(durationDays, 10) || undefined,
          includesSiteVisit,
          validityDays: QUOTE_DEFAULT_VALIDITY_DAYS,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['lead', id] }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
        queryClient.invalidateQueries({ queryKey: ['my-quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] }),
      ]);
      router.back();
    },
    onError: (caught) => {
      if (caught instanceof ApiError && caught.status === 402) {
        // Out of credits, or the subscription lapsed: send them to the plans.
        setError(caught.message);
        router.push('/subscription');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : t('errors.unknown'));
    },
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('quote.sendTitle') }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field
          label={t('quote.amountLabel')}
          hint={t('quote.amountHint')}
          value={amount}
          onChangeText={(value) => setAmount(value.replace(/\D/g, ''))}
          keyboardType="number-pad"
          autoFocus
          style={{ textAlign: 'left', writingDirection: 'ltr' }}
        />

        <ToggleRow
          label={t('quote.isEstimateLabel')}
          value={isEstimate}
          onChange={setIsEstimate}
        />

        <Field
          label={t('quote.messageLabel')}
          placeholder={t('quote.messagePlaceholder')}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={2000}
          hint={t('errors.tooShort', { min: QUOTE_MESSAGE_MIN })}
        />

        <Field
          label={t('quote.durationLabel')}
          value={durationDays}
          onChangeText={(value) => setDurationDays(value.replace(/\D/g, ''))}
          keyboardType="number-pad"
          optional
          optionalLabel={t('common.optional')}
          style={{ textAlign: 'left', writingDirection: 'ltr' }}
        />

        <ToggleRow
          label={t('quote.siteVisitLabel')}
          value={includesSiteVisit}
          onChange={setIncludesSiteVisit}
        />

        {error ? (
          <Txt variant="caption" color={colors.danger}>
            {error}
          </Txt>
        ) : null}

        <Button
          title={t('quote.submit')}
          onPress={() => submit.mutate()}
          loading={submit.isPending}
          disabled={!canSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleLabel: { flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
