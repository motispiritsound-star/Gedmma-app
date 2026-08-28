import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_FORMS, isValidKvk, type LegalForm } from '@buurklus/shared';
import { Badge, Button, Card, Field, Txt } from '@/components/ui';
import { useApi, usePublicApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { ApiError } from '@/api/client';
import type { CategoryNode, CityRef } from '@/api/types';
import { colors, radius, spacing } from '@/theme';

function MultiSelect<T extends { slug: string; name: string }>({
  options,
  selected,
  onToggle,
  max,
}: {
  options: T[];
  selected: string[];
  onToggle: (slug: string) => void;
  max: number;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const isSelected = selected.includes(option.slug);
        const atLimit = !isSelected && selected.length >= max;
        return (
          <Pressable
            key={option.slug}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled: atLimit }}
            disabled={atLimit}
            onPress={() => onToggle(option.slug)}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
              atLimit && styles.chipDisabled,
            ]}
          >
            <Txt variant="caption" color={isSelected ? colors.textInverse : colors.text}>
              {option.name}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const publicApi = usePublicApi();
  const queryClient = useQueryClient();
  const locale = useSession((state) => state.locale);
  const reloadUser = useSession((state) => state.reloadUser);

  const [displayName, setDisplayName] = useState('');
  const [legalForm, setLegalForm] = useState<LegalForm>('EENMANSZAAK');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [teamSize, setTeamSize] = useState('1');
  const [baseCity, setBaseCity] = useState<string | null>(null);
  const [trades, setTrades] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [kvk, setKvk] = useState('');
  const [vatId, setVatId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => publicApi<{ categories: CategoryNode[] }>('/v1/catalog/categories'),
  });
  const citiesQuery = useQuery({
    queryKey: ['cities', locale],
    queryFn: () => publicApi<{ cities: CityRef[] }>('/v1/catalog/cities'),
  });

  const tradeOptions = useMemo(
    () => (categoriesQuery.data?.categories ?? []).flatMap((parent) => [parent, ...parent.children]),
    [categoriesQuery.data],
  );
  const cityOptions = citiesQuery.data?.cities ?? [];

  // Every business registered in the Netherlands has a KvK number, including a
  // one-person zzp business, so there is one rule rather than a branch.
  const identifierValid = isValidKvk(kvk);

  const canSubmit =
    displayName.trim().length >= 2 &&
    bio.trim().length >= 40 &&
    baseCity != null &&
    trades.length >= 1 &&
    cities.length >= 1 &&
    identifierValid;

  const save = useMutation({
    mutationFn: () =>
      api('/v1/pros/me', {
        method: 'PUT',
        body: {
          displayName: displayName.trim(),
          legalForm,
          bio: bio.trim(),
          yearsExperience: Number.parseInt(yearsExperience, 10) || 0,
          teamSize: Number.parseInt(teamSize, 10) || 1,
          baseCitySlug: baseCity,
          serviceRadiusKm: 40,
          categorySlugs: trades,
          citySlugs: cities,
          kvk,
          vatId: vatId.trim() || undefined,
        },
      }),
    onSuccess: async () => {
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
      router.replace('/(pro)/leads');
    },
    onError: (caught) =>
      setError(caught instanceof ApiError ? caught.message : t('errors.unknown')),
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('pro.onboardingTitle') }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Txt variant="body" color={colors.textMuted}>
          {t('pro.onboardingSubtitle')}
        </Txt>

        <Field
          label={t('pro.displayName')}
          placeholder={t('pro.displayNamePlaceholder')}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <View style={styles.field}>
          <Txt variant="bodyStrong">{t('pro.legalForm')}</Txt>
          <View style={styles.chips}>
            {LEGAL_FORMS.map((form) => (
              <Pressable
                key={form}
                accessibilityRole="radio"
                accessibilityState={{ selected: legalForm === form }}
                onPress={() => setLegalForm(form as LegalForm)}
                style={[styles.chip, legalForm === form && styles.chipSelected]}
              >
                <Txt
                  variant="caption"
                  color={legalForm === form ? colors.textInverse : colors.text}
                >
                  {form.replace(/_/g, ' ')}
                </Txt>
              </Pressable>
            ))}
          </View>
        </View>

        <Field
          label={t('pro.bio')}
          placeholder={t('pro.bioPlaceholder')}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={2000}
          hint={t('errors.tooShort', { min: 40 })}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Field
              label={t('pro.yearsExperience')}
              value={yearsExperience}
              onChangeText={(value) => setYearsExperience(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.rowItem}>
            <Field
              label={t('pro.teamSize')}
              value={teamSize}
              onChangeText={(value) => setTeamSize(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Txt variant="bodyStrong">{t('pro.trades')}</Txt>
          <Txt variant="caption" color={colors.textMuted}>
            {t('pro.tradesHint')}
          </Txt>
          <MultiSelect
            options={tradeOptions}
            selected={trades}
            max={15}
            onToggle={(slug) =>
              setTrades((current) =>
                current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug],
              )
            }
          />
        </View>

        <View style={styles.field}>
          <Txt variant="bodyStrong">{t('pro.baseCity')}</Txt>
          <MultiSelect
            options={cityOptions.slice(0, 20)}
            selected={baseCity ? [baseCity] : []}
            max={1}
            onToggle={(slug) => {
              setBaseCity(slug);
              // The base city is always part of the coverage area.
              setCities((current) => (current.includes(slug) ? current : [...current, slug]));
            }}
          />
        </View>

        <View style={styles.field}>
          <Txt variant="bodyStrong">{t('pro.coverage')}</Txt>
          <MultiSelect
            options={cityOptions.slice(0, 20)}
            selected={cities}
            max={60}
            onToggle={(slug) =>
              setCities((current) =>
                current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug],
              )
            }
          />
        </View>

        <Card>
          <Txt variant="subheading">{t('pro.identifiers')}</Txt>
          <Txt variant="caption" color={colors.textMuted}>
            {t('pro.identifiersHint')}
          </Txt>

          <Field
            label={t('pro.kvk')}
            value={kvk}
            onChangeText={(value) => setKvk(value.replace(/\D/g, '').slice(0, 8))}
            keyboardType="number-pad"
            style={{ textAlign: 'left', writingDirection: 'ltr' }}
          />

          <Field
            label={t('pro.vatId')}
            value={vatId}
            onChangeText={(value) => setVatId(value.toUpperCase().slice(0, 14))}
            autoCapitalize="characters"
            optional
            optionalLabel={t('common.optional')}
            style={{ textAlign: 'left', writingDirection: 'ltr' }}
          />

          {identifierValid ? (
            <Badge label={t('common.verified')} tone="success" icon="shield-checkmark" />
          ) : null}
        </Card>

        {error ? (
          <Txt variant="caption" color={colors.danger}>
            {error}
          </Txt>
        ) : null}

        <Button
          title={t('common.save')}
          onPress={() => save.mutate()}
          loading={save.isPending}
          disabled={!canSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  field: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.4 },
});
