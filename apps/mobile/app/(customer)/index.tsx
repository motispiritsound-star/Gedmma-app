import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Loader, Txt } from '@/components/ui';
import { usePublicApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { useJobDraft } from '@/store/draft-job';
import type { CategoryNode } from '@/api/types';
import { colors, radius, shadow, spacing, textStart } from '@/theme';

export default function CustomerHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = usePublicApi();
  const user = useSession((state) => state.user);
  const locale = useSession((state) => state.locale);
  const resetDraft = useJobDraft((state) => state.reset);
  const updateDraft = useJobDraft((state) => state.update);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api<{ categories: CategoryNode[] }>('/v1/catalog/categories'),
  });

  const categories = data?.categories ?? [];

  /** Searching matches parent and child trades alike. */
  const results = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return [];
    const flat = categories.flatMap((parent) => [parent, ...parent.children]);
    return flat.filter((entry) => entry.name.toLocaleLowerCase().includes(query)).slice(0, 8);
  }, [categories, search]);

  function startJob(categorySlug: string, categoryName: string, parentSlug?: string) {
    resetDraft();
    updateDraft({ categorySlug, categoryName, parentCategorySlug: parentSlug ?? null });
    router.push('/post/details');
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greeting}>
        <Txt variant="caption" color={colors.textMuted}>
          {user?.firstName
            ? t('home.greeting', { name: user.firstName })
            : t('home.greetingAnonymous')}
        </Txt>
        <Txt variant="title">{t('home.tagline')}</Txt>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textSubtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={colors.textSubtle}
          style={[styles.searchInput, { textAlign: textStart() }]}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} accessibilityLabel={t('common.close')}>
            <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
          </Pressable>
        ) : null}
      </View>

      {results.length > 0 ? (
        <View style={styles.results}>
          {results.map((entry) => (
            <Pressable
              key={entry.slug}
              style={styles.resultRow}
              onPress={() => startJob(entry.slug, entry.name)}
            >
              <Ionicons name={entry.icon as never} size={18} color={colors.primary} />
              <Txt variant="body">{entry.name}</Txt>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        style={styles.cta}
        onPress={() => {
          resetDraft();
          router.push('/post/category');
        }}
        accessibilityRole="button"
      >
        <View style={styles.ctaText}>
          <Txt variant="subheading" color={colors.textInverse}>
            {t('home.postJobCta')}
          </Txt>
          <Txt variant="caption" color={colors.primarySoft}>
            {t('home.postJobSubtitle')}
          </Txt>
        </View>
        <View style={styles.ctaIcon}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </View>
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Txt variant="heading">{t('home.popularTitle')}</Txt>
          <Pressable onPress={() => router.push('/post/category')}>
            <Txt variant="caption" color={colors.primary}>
              {t('common.seeAll')}
            </Txt>
          </Pressable>
        </View>

        {isLoading ? (
          <Loader />
        ) : (
          <View style={styles.grid}>
            {categories.slice(0, 8).map((category) => (
              <Pressable
                key={category.slug}
                style={styles.tile}
                onPress={() => {
                  resetDraft();
                  updateDraft({ parentCategorySlug: category.slug });
                  router.push({ pathname: '/post/category', params: { parent: category.slug } });
                }}
                accessibilityRole="button"
              >
                <View style={styles.tileIcon}>
                  <Ionicons name={category.icon as never} size={22} color={colors.primary} />
                </View>
                <Txt variant="caption" align="center" numberOfLines={2}>
                  {category.name}
                </Txt>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Txt variant="heading">{t('home.howItWorksTitle')}</Txt>
        {([1, 2, 3] as const).map((step) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Txt variant="bodyStrong" color={colors.primary} align="center">
                {step}
              </Txt>
            </View>
            <View style={styles.stepText}>
              <Txt variant="bodyStrong">{t(`home.step${step}Title`)}</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {t(`home.step${step}Body`)}
              </Txt>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  greeting: { gap: spacing.xs },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 50,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  results: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...(shadow.raised as object),
  },
  ctaText: { gap: 2, flex: 1 },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '23%',
    minWidth: 78,
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, gap: 2 },
});
