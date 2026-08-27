import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { JOB_DESCRIPTION_MIN, JOB_MAX_PHOTOS } from '@khidma/shared';
import { Button, Field, StepProgress, Txt } from '@/components/ui';
import { useJobDraft } from '@/store/draft-job';
import { colors, radius, spacing } from '@/theme';
import { WIZARD_STEPS } from './category';

export default function DetailsStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useJobDraft();
  const [touched, setTouched] = useState(false);

  const titleValid = draft.title.trim().length >= 8;
  const descriptionValid = draft.description.trim().length >= JOB_DESCRIPTION_MIN;
  const canContinue = titleValid && descriptionValid;

  async function addPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: JOB_MAX_PHOTOS - draft.photoUrls.length,
    });
    if (result.canceled) return;

    // The picker hands back local file URIs; a real upload step replaces these
    // with hosted URLs before the job is posted.
    draft.update({
      photoUrls: [...draft.photoUrls, ...result.assets.map((asset) => asset.uri)].slice(
        0,
        JOB_MAX_PHOTOS,
      ),
    });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: draft.categoryName ?? t('job.newTitle') }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <StepProgress current={2} total={WIZARD_STEPS} />
          <Txt variant="caption" color={colors.textMuted}>
            {t('job.stepOf', { current: 2, total: WIZARD_STEPS })}
          </Txt>
          <Txt variant="title">{t('job.detailsTitle')}</Txt>
        </View>

        <Field
          label={t('job.titleLabel')}
          placeholder={t('job.titlePlaceholder')}
          value={draft.title}
          onChangeText={(title) => draft.update({ title })}
          error={touched && !titleValid ? t('errors.tooShort', { min: 8 }) : null}
          maxLength={120}
        />

        <Field
          label={t('job.descriptionLabel')}
          placeholder={t('job.descriptionPlaceholder')}
          hint={t('job.descriptionHint', { min: JOB_DESCRIPTION_MIN })}
          value={draft.description}
          onChangeText={(description) => draft.update({ description })}
          error={
            touched && !descriptionValid
              ? t('errors.tooShort', { min: JOB_DESCRIPTION_MIN })
              : null
          }
          multiline
          maxLength={4000}
        />

        <View style={styles.photos}>
          <Txt variant="bodyStrong">{t('job.photosLabel')}</Txt>
          <Txt variant="caption" color={colors.textMuted}>
            {t('job.photosHint')}
          </Txt>

          <View style={styles.photoRow}>
            {draft.photoUrls.map((uri) => (
              <View key={uri} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photo} />
                <Pressable
                  accessibilityLabel={t('common.delete')}
                  style={styles.photoRemove}
                  onPress={() =>
                    draft.update({ photoUrls: draft.photoUrls.filter((entry) => entry !== uri) })
                  }
                >
                  <Ionicons name="close" size={14} color={colors.textInverse} />
                </Pressable>
              </View>
            ))}

            {draft.photoUrls.length < JOB_MAX_PHOTOS ? (
              <Pressable
                accessibilityRole="button"
                style={styles.photoAdd}
                onPress={() => void addPhoto()}
              >
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Txt variant="caption" color={colors.primary} align="center">
                  {t('job.addPhoto')}
                </Txt>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Button
          title={t('common.next')}
          onPress={() => {
            setTouched(true);
            if (canContinue) router.push('/post/location');
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.sm },
  photos: { gap: spacing.xs },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  photoWrapper: { position: 'relative' },
  photo: { width: 84, height: 84, borderRadius: radius.sm },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 84,
    height: 84,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: spacing.xs,
  },
});
