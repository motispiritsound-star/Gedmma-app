import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { JOB_URGENCIES, type JobUrgency } from '@buurklus/shared';
import { Button, StepProgress, Txt } from '@/components/ui';
import { useJobDraft } from '@/store/draft-job';
import { colors, radius, spacing } from '@/theme';
import { WIZARD_STEPS } from './category';

const URGENCY_ICONS: Record<JobUrgency, keyof typeof Ionicons.glyphMap> = {
  URGENT: 'flash-outline',
  WITHIN_WEEK: 'calendar-outline',
  WITHIN_MONTH: 'calendar-number-outline',
  FLEXIBLE: 'infinite-outline',
};

export default function ScheduleStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useJobDraft();

  return (
    <>
      <Stack.Screen options={{ title: t('job.scheduleTitle') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <StepProgress current={4} total={WIZARD_STEPS} />
          <Txt variant="caption" color={colors.textMuted}>
            {t('job.stepOf', { current: 4, total: WIZARD_STEPS })}
          </Txt>
          <Txt variant="title">{t('job.scheduleTitle')}</Txt>
        </View>

        <View style={styles.options}>
          {JOB_URGENCIES.map((urgency) => {
            const selected = draft.urgency === urgency;
            return (
              <Pressable
                key={urgency}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => draft.update({ urgency: urgency as JobUrgency })}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                  <Ionicons
                    name={URGENCY_ICONS[urgency as JobUrgency]}
                    size={20}
                    color={selected ? colors.textInverse : colors.primary}
                  />
                </View>
                <Txt variant="body" style={styles.optionLabel}>
                  {t(`job.urgency.${urgency}`)}
                </Txt>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Button title={t('common.next')} onPress={() => router.push('/post/budget')} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.sm },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: colors.primary },
  optionLabel: { flex: 1 },
});
