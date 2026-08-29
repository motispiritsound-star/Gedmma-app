import { Text, View } from 'react-native';
import {
  bindsAdults,
  rulesFor,
  translate,
  validateAgreement,
  type AgeBand,
  type FamilyAgreement,
  type Locale,
} from '@focusfamily/domain';
import { styles } from '@/lib/theme';

/**
 * "What applies to me", rendered the same way for a parent and for a child.
 * If an agreement asks nothing of the grown-ups, this screen says so out loud
 * rather than hiding it.
 */
export function AgreementList({
  agreement,
  memberId,
  ageBand,
  locale,
}: {
  agreement: FamilyAgreement;
  memberId: string;
  ageBand: AgeBand;
  locale: Locale;
}) {
  const mine = rulesFor(agreement, { memberId, ageBand });
  const issues = validateAgreement(agreement);
  const adultRules = agreement.rules.filter(bindsAdults);

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.title} accessibilityRole="header">
        {agreement.title}
      </Text>

      {issues.length > 0 ? (
        <View style={[styles.notice, styles.noticeWarm]} testID="agreement-issues">
          {issues.map((issue) => (
            <Text key={`${issue.code}-${issue.context ?? ''}`} style={styles.body}>
              {translate(locale, issue.messageKey)}
            </Text>
          ))}
        </View>
      ) : (
        <View style={[styles.notice, styles.noticeGood]} testID="agreement-ok">
          <Text style={styles.body} testID="adult-rule-count">
            {adultRules.length}
          </Text>
        </View>
      )}

      {mine.map((rule) => (
        <View key={rule.id} style={styles.card} testID={`rule-${rule.id}`}>
          <Text style={styles.cardTitle}>{rule.text}</Text>
          <Text style={styles.body}>
            {rule.startsAt && rule.endsAt ? `${rule.startsAt}–${rule.endsAt}` : ''}
          </Text>
          {rule.repairText ? <Text style={styles.body}>{rule.repairText}</Text> : null}
        </View>
      ))}

      {mine.length === 0 ? (
        <Text style={styles.body} testID="no-rules">
          {translate(locale, 'baseline.active')}
        </Text>
      ) : null}
    </View>
  );
}
