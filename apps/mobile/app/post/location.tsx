import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { PROPERTY_TYPES, type PropertyType } from '@buurklus/shared';
import { Button, Field, StepProgress, Txt } from '@/components/ui';
import { usePublicApi } from '@/hooks/use-api';
import { useJobDraft } from '@/store/draft-job';
import { useSession } from '@/store/session';
import type { CityRef } from '@/api/types';
import { colors, radius, spacing, textStart } from '@/theme';
import { WIZARD_STEPS } from './category';

export default function LocationStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = usePublicApi();
  const locale = useSession((state) => state.locale);
  const draft = useJobDraft();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');

  const { data } = useQuery({
    queryKey: ['cities', locale],
    queryFn: () => api<{ cities: CityRef[] }>('/v1/catalog/cities'),
  });

  const cities = data?.cities ?? [];
  const filtered = useMemo(() => {
    const query = cityQuery.trim().toLocaleLowerCase();
    if (!query) return cities;
    return cities.filter(
      (city) =>
        city.name.toLocaleLowerCase().includes(query) ||
        city.provinceName.toLocaleLowerCase().includes(query),
    );
  }, [cities, cityQuery]);

  return (
    <>
      <Stack.Screen options={{ title: t('job.locationTitle') }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <StepProgress current={3} total={WIZARD_STEPS} />
          <Txt variant="caption" color={colors.textMuted}>
            {t('job.stepOf', { current: 3, total: WIZARD_STEPS })}
          </Txt>
          <Txt variant="title">{t('job.locationTitle')}</Txt>
        </View>

        <View style={styles.field}>
          <Txt variant="bodyStrong">{t('job.cityLabel')}</Txt>
          <Pressable
            accessibilityRole="button"
            style={styles.select}
            onPress={() => setPickerOpen(true)}
          >
            <Txt variant="body" color={draft.cityName ? colors.text : colors.textSubtle}>
              {draft.cityName ?? t('job.cityPlaceholder')}
            </Txt>
            <Ionicons name="chevron-down" size={18} color={colors.textSubtle} />
          </Pressable>
        </View>

        <Field
          label={t('job.districtLabel')}
          placeholder={t('job.districtPlaceholder')}
          value={draft.district}
          onChangeText={(district) => draft.update({ district })}
          optional
          optionalLabel={t('common.optional')}
        />

        <Field
          label={t('job.addressLabel')}
          hint={t('job.addressHint')}
          value={draft.addressLine}
          onChangeText={(addressLine) => draft.update({ addressLine })}
          optional
          optionalLabel={t('common.optional')}
        />

        <View style={styles.field}>
          <Txt variant="bodyStrong">{t('job.propertyTypeLabel')}</Txt>
          <View style={styles.chips}>
            {PROPERTY_TYPES.map((type) => {
              const selected = draft.propertyType === type;
              return (
                <Pressable
                  key={type}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() =>
                    draft.update({ propertyType: selected ? null : (type as PropertyType) })
                  }
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Txt variant="caption" color={selected ? colors.textInverse : colors.text}>
                    {t(`job.propertyType.${type}`)}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          title={t('common.next')}
          onPress={() => router.push('/post/schedule')}
          disabled={!draft.citySlug}
        />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Txt variant="heading">{t('job.cityLabel')}</Txt>
            <Pressable onPress={() => setPickerOpen(false)} accessibilityLabel={t('common.close')}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textSubtle} />
            <TextInput
              value={cityQuery}
              onChangeText={setCityQuery}
              placeholder={t('common.search')}
              placeholderTextColor={colors.textSubtle}
              style={[styles.searchInput, { textAlign: textStart() }]}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(city) => city.slug}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={styles.cityRow}
                onPress={() => {
                  draft.update({ citySlug: item.slug, cityName: item.name });
                  setPickerOpen(false);
                  setCityQuery('');
                }}
              >
                <View style={styles.cityText}>
                  <Txt variant="body">{item.name}</Txt>
                  <Txt variant="caption" color={colors.textMuted}>
                    {item.provinceName}
                  </Txt>
                </View>
                {draft.citySlug === item.slug ? (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                ) : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.sm },
  field: { gap: spacing.xs },
  select: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },

  modal: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.xxl },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cityText: { flex: 1, gap: 2 },
});
