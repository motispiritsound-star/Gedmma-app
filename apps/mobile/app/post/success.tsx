import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, Txt } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export default function PostSuccess() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, reference } = useLocalSearchParams<{ id: string; reference: string }>();

  return (
    <>
      {/* No back arrow: the wizard is finished and its draft has been cleared. */}
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View style={styles.container}>
        <View style={styles.icon}>
          <Ionicons name="checkmark" size={40} color={colors.textInverse} />
        </View>

        <Txt variant="title" align="center">
          {t('job.publishedTitle')}
        </Txt>
        <Txt variant="body" color={colors.textMuted} align="center">
          {t('job.publishedBody')}
        </Txt>
        <Txt variant="caption" color={colors.textSubtle} align="center">
          {t('job.reference', { reference })}
        </Txt>

        <View style={styles.actions}>
          <Button title={t('common.done')} onPress={() => router.replace(`/job/${id}`)} />
          <Button
            title={t('job.myJobs')}
            variant="secondary"
            onPress={() => router.replace('/(customer)/jobs')}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  icon: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xl },
});
