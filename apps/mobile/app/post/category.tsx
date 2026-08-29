import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Loader, StepProgress, Txt } from '@/components/ui';
import { usePublicApi } from '@/hooks/use-api';
import { useJobDraft } from '@/store/draft-job';
import { useSession } from '@/store/session';
import type { CategoryNode } from '@/api/types';
import { colors, forwardIcon, radius, spacing } from '@/theme';

export const WIZARD_STEPS = 5;

export default function CategoryStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = usePublicApi();
  const locale = useSession((state) => state.locale);
  const update = useJobDraft((state) => state.update);
  const { parent } = useLocalSearchParams<{ parent?: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api<{ categories: CategoryNode[] }>('/v1/catalog/categories'),
  });

  const categories = data?.categories ?? [];
  const selectedParent = parent ? categories.find((row) => row.slug === parent) : undefined;
  // Trades with sub-trades ask a second question; the rest go straight through.
  const options: Pick<CategoryNode, 'slug' | 'name' | 'icon'>[] = selectedParent
    ? selectedParent.children
    : categories;

  function choose(slug: string, name: string, hasChildren: boolean) {
    if (hasChildren) {
      router.push({ pathname: '/post/category', params: { parent: slug } });
      return;
    }
    update({
      categorySlug: slug,
      categoryName: name,
      parentCategorySlug: selectedParent?.slug ?? null,
    });
    router.push('/post/details');
  }

  if (isLoading) return <Loader label={t('common.loading')} />;

  return (
    <>
      <Stack.Screen options={{ title: t('job.newTitle') }} />
      <FlatList
        data={options}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <StepProgress current={1} total={WIZARD_STEPS} />
            <Txt variant="caption" color={colors.textMuted}>
              {t('job.stepOf', { current: 1, total: WIZARD_STEPS })}
            </Txt>
            <Txt variant="title">
              {selectedParent ? t('job.subcategoryTitle') : t('job.categoryTitle')}
            </Txt>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          // Only top-level rows carry children; sub-trades are always leaves.
          const hasChildren = (item as CategoryNode).children?.length > 0;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => choose(item.slug, item.name, hasChildren)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.icon}>
                <Ionicons name={item.icon as never} size={20} color={colors.primary} />
              </View>
              <Txt variant="body" style={styles.label}>
                {item.name}
              </Txt>
              <Ionicons name={forwardIcon()} size={18} color={colors.textSubtle} />
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  pressed: { backgroundColor: colors.primarySurface },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
