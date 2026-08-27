import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { formatIce } from '@khidma/shared';
import { Badge, Card, Divider, Loader, Rating, Txt } from '@/components/ui';
import { usePublicApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { formatDate, formatDuration } from '@/utils/format';
import { colors, radius, spacing } from '@/theme';

interface PublicPro {
  id: string;
  displayName: string;
  bio: string;
  logoUrl: string | null;
  yearsExperience: number;
  teamSize: number;
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  ratingAverage: number;
  ratingCount: number;
  jobsWon: number;
  medianResponseMinutes: number | null;
  createdAt: string;
  ice: string | null;
  baseCity: { nameFr: string; nameAr: string; nameEn: string; slug: string };
  trades: { isPrimary: boolean; category: { slug: string; nameFr: string; nameAr: string; nameEn: string; icon: string } }[];
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  proReply: string | null;
  author: { firstName: string | null };
  job: { title: string };
}

export default function ProProfile() {
  const { t } = useTranslation();
  const api = usePublicApi();
  const locale = useSession((state) => state.locale);
  const { id } = useLocalSearchParams<{ id: string }>();

  const pro = useQuery({
    queryKey: ['pro', id],
    queryFn: () => api<{ pro: PublicPro }>(`/v1/pros/${id}`),
  });
  const reviews = useQuery({
    queryKey: ['pro-reviews', id],
    queryFn: () => api<{ items: Review[] }>(`/v1/pros/${id}/reviews`, { query: { limit: 20 } }),
  });

  if (pro.isLoading) return <Loader label={t('common.loading')} />;
  if (!pro.data) return null;

  const profile = pro.data.pro;
  const responseTime = formatDuration(profile.medianResponseMinutes, locale);
  const tradeName = (trade: PublicPro['trades'][number]) =>
    locale === 'ar'
      ? trade.category.nameAr
      : locale === 'en'
        ? trade.category.nameEn
        : trade.category.nameFr;

  return (
    <>
      <Stack.Screen options={{ title: profile.displayName }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <View style={styles.header}>
            {profile.logoUrl ? (
              <Image source={{ uri: profile.logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoFallback}>
                <Ionicons name="business" size={26} color={colors.primary} />
              </View>
            )}
            <View style={styles.headerText}>
              <Txt variant="heading">{profile.displayName}</Txt>
              <Rating value={profile.ratingAverage} count={profile.ratingCount} />
              {profile.verificationStatus === 'VERIFIED' ? (
                <Badge
                  label={t('pro.verification.VERIFIED')}
                  tone="success"
                  icon="shield-checkmark"
                />
              ) : null}
            </View>
          </View>

          <Divider />

          <View style={styles.factRow}>
            <Fact icon="briefcase-outline" label={t('pro.jobsWon', { count: profile.jobsWon })} />
            {responseTime ? (
              <Fact icon="time-outline" label={t('common.respondsIn', { duration: responseTime })} />
            ) : null}
            <Fact
              icon="calendar-outline"
              label={t('pro.since', { year: new Date(profile.createdAt).getFullYear() })}
            />
          </View>
        </Card>

        <Card>
          <Txt variant="subheading">{t('pro.bio')}</Txt>
          <Txt variant="body" color={colors.textMuted}>
            {profile.bio}
          </Txt>

          <Txt variant="subheading">{t('pro.trades')}</Txt>
          <View style={styles.chips}>
            {profile.trades.map((trade) => (
              <Badge
                key={trade.category.slug}
                label={tradeName(trade)}
                tone={trade.isPrimary ? 'success' : 'neutral'}
              />
            ))}
          </View>

          {/* The ICE is public information in Morocco, and showing it lets a
              customer check the business against the official register. */}
          {profile.ice ? (
            <>
              <Divider />
              <Txt variant="caption" color={colors.textSubtle}>
                {t('pro.ice')}: {formatIce(profile.ice)}
              </Txt>
            </>
          ) : null}
        </Card>

        <View style={styles.section}>
          <Txt variant="heading">{t('common.reviews', { count: profile.ratingCount })}</Txt>
          {(reviews.data?.items ?? []).length === 0 ? (
            <Card>
              <Txt variant="body" color={colors.textMuted}>
                {t('review.noReviews')}
              </Txt>
            </Card>
          ) : (
            (reviews.data?.items ?? []).map((review) => (
              <Card key={review.id}>
                <View style={styles.reviewHeader}>
                  <Txt variant="bodyStrong">{review.author.firstName ?? '—'}</Txt>
                  <Txt variant="caption" color={colors.textSubtle}>
                    {formatDate(review.createdAt, locale)}
                  </Txt>
                </View>
                <Rating value={review.rating} size={13} />
                <Txt variant="body" color={colors.textMuted}>
                  {review.comment}
                </Txt>
                {review.proReply ? (
                  <View style={styles.reply}>
                    <Txt variant="caption" color={colors.primaryDark}>
                      {review.proReply}
                    </Txt>
                  </View>
                ) : null}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

function Fact({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Txt variant="caption" color={colors.textMuted}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  headerText: { flex: 1, gap: spacing.xs },
  logo: { width: 60, height: 60, borderRadius: radius.md },
  logoFallback: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factRow: { gap: spacing.sm },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  section: { gap: spacing.md },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reply: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
});
