import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@khidma/shared';
import { colors, radius, spacing } from '../theme';
import { formatDistanceLabel, formatMoney, formatRelative } from '../utils/format-helpers';
import type { JobSummary, Lead, Quote } from '../api/types';
import { Badge, Card, Rating, Txt } from './ui';

const URGENCY_TONE = {
  URGENT: 'danger',
  WITHIN_WEEK: 'warning',
  WITHIN_MONTH: 'neutral',
  FLEXIBLE: 'neutral',
} as const;

const STATUS_TONE = {
  DRAFT: 'neutral',
  OPEN: 'warning',
  QUOTED: 'accent',
  AWARDED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
} as const;

function budgetLabel(job: JobSummary, locale: Locale): string | null {
  if (job.budgetMinCentimes == null && job.budgetMaxCentimes == null) return null;
  if (job.budgetMinCentimes != null && job.budgetMaxCentimes != null) {
    if (job.budgetMinCentimes === job.budgetMaxCentimes) {
      return formatMoney(job.budgetMinCentimes, locale);
    }
    return `${formatMoney(job.budgetMinCentimes, locale)} – ${formatMoney(job.budgetMaxCentimes, locale)}`;
  }
  return formatMoney(job.budgetMinCentimes ?? job.budgetMaxCentimes, locale);
}

/** The customer's own job, on the "my jobs" list. */
export function JobCard({
  job,
  locale,
  onPress,
}: {
  job: JobSummary;
  locale: Locale;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const budget = budgetLabel(job, locale);

  return (
    <Card onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.categoryChip}>
          <Ionicons name={job.category.icon as never} size={16} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Txt variant="subheading" numberOfLines={2}>
            {job.title}
          </Txt>
          <Txt variant="caption" color={colors.textMuted}>
            {job.category.name} · {job.city.name}
          </Txt>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Badge label={t(`job.status.${job.status}`)} tone={STATUS_TONE[job.status]} />
        {budget ? <Badge label={budget} tone="neutral" icon="pricetag-outline" /> : null}
      </View>

      <View style={styles.footerRow}>
        <Txt variant="caption" color={colors.primaryDark}>
          {job.quoteCount > 0
            ? t('job.quotesReceived', { count: job.quoteCount })
            : t('job.noQuotesYet')}
        </Txt>
        <Txt variant="caption" color={colors.textSubtle}>
          {formatRelative(job.publishedAt ?? job.createdAt, locale)}
        </Txt>
      </View>
    </Card>
  );
}

/** A job as it appears to a professional in the lead feed. */
export function LeadCard({
  lead,
  locale,
  onPress,
}: {
  lead: Lead;
  locale: Locale;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const budget = budgetLabel(lead, locale);

  return (
    <Card onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.categoryChip}>
          <Ionicons name={lead.category.icon as never} size={16} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Txt variant="subheading" numberOfLines={2}>
            {lead.title}
          </Txt>
          <Txt variant="caption" color={colors.textMuted}>
            {lead.city.name}
            {lead.district ? ` · ${lead.district}` : ''}
            {/* Coordinates are city-level, so anything under a kilometre is
                noise — "0 m" would claim a precision we do not have. */}
            {lead.distanceKm != null && lead.distanceKm >= 1
              ? ` · ${formatDistanceLabel(lead.distanceKm, locale)}`
              : ''}
          </Txt>
        </View>
      </View>

      <Txt variant="body" color={colors.textMuted} numberOfLines={3}>
        {lead.description}
      </Txt>

      <View style={styles.metaRow}>
        <Badge label={t(`job.urgency.${lead.urgency}`)} tone={URGENCY_TONE[lead.urgency]} />
        {budget ? <Badge label={budget} tone="neutral" icon="pricetag-outline" /> : null}
        {lead.myQuote ? <Badge label={t('quote.pending')} tone="success" icon="checkmark" /> : null}
      </View>

      <View style={styles.footerRow}>
        <Txt variant="caption" color={colors.textSubtle}>
          {t('job.quotesReceived', { count: lead.quoteCount })}
        </Txt>
        <Txt variant="caption" color={colors.textSubtle}>
          {formatRelative(lead.publishedAt ?? lead.createdAt, locale)}
        </Txt>
      </View>
    </Card>
  );
}

/** A quote as the customer sees it, with the professional behind it. */
export function QuoteCard({
  quote,
  locale,
  onPress,
}: {
  quote: Quote;
  locale: Locale;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const pro = quote.pro;

  return (
    <Card onPress={onPress}>
      <View style={styles.headerRow}>
        {pro?.logoUrl ? (
          <Image source={{ uri: pro.logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoFallback}>
            <Ionicons name="business-outline" size={18} color={colors.primary} />
          </View>
        )}
        <View style={styles.headerText}>
          <Txt variant="subheading" numberOfLines={1}>
            {pro?.displayName ?? t('quote.title')}
          </Txt>
          {pro ? (
            <View style={styles.proMetaRow}>
              <Rating value={pro.ratingAverage} count={pro.ratingCount} size={12} />
              {pro.verificationStatus === 'VERIFIED' ? (
                <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
              ) : null}
            </View>
          ) : null}
        </View>
        <Txt variant="heading" color={colors.primaryDark}>
          {formatMoney(quote.amountCentimes, locale)}
        </Txt>
      </View>

      <Txt variant="body" color={colors.textMuted} numberOfLines={3}>
        {quote.message}
      </Txt>

      <View style={styles.metaRow}>
        <Badge
          label={quote.isEstimate ? t('quote.estimate') : t('quote.fixedPrice')}
          tone={quote.isEstimate ? 'neutral' : 'success'}
        />
        {quote.estimatedDurationDays ? (
          <Badge
            label={t('common.days', { count: quote.estimatedDurationDays })}
            tone="neutral"
            icon="time-outline"
          />
        ) : null}
        {quote.includesSiteVisit ? (
          <Badge label={t('quote.includesSiteVisit')} tone="accent" icon="home-outline" />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  categoryChip: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 40, height: 40, borderRadius: radius.sm },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
