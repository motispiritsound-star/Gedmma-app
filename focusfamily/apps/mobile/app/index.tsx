import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { translate } from '@focusfamily/domain';
import { SourceBadge } from '@/components/SourceBadge';
import { USE_MOCK_SCREEN_TIME } from '@/lib/config';
import { ui } from '@/lib/strings';
import { styles } from '@/lib/theme';

const locale = 'nl' as const;

export default function TodayScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {translate(locale, 'app.tagline')}
      </Text>
      <Text style={styles.subtitle}>{translate(locale, 'app.intro')}</Text>

      {USE_MOCK_SCREEN_TIME ? (
        <View style={[styles.notice, styles.noticeWarm]}>
          <Text style={styles.body}>{ui(locale, 'demoNotice')}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{ui(locale, 'whatIsMeasured')}</Text>
        <Text style={styles.body}>{ui(locale, 'everyoneSeesThis')}</Text>
        <SourceBadge kind="app_observed" locale={locale} explain />
        <SourceBadge kind="self_reported" locale={locale} explain />
        <SourceBadge kind="simulated" locale={locale} explain />
      </View>

      <View style={{ gap: 12 }}>
        <Link href="/focus" style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>{translate(locale, 'focus.start')}</Text>
        </Link>
        <Link href="/agreements" style={styles.buttonSecondary} accessibilityRole="button">
          <Text style={styles.buttonSecondaryText}>{ui(locale, 'agreements')}</Text>
        </Link>
        <Link href="/checkin" style={styles.buttonSecondary} accessibilityRole="button">
          <Text style={styles.buttonSecondaryText}>{ui(locale, 'checkin')}</Text>
        </Link>
        <Link href="/data" style={styles.buttonSecondary} accessibilityRole="button">
          <Text style={styles.buttonSecondaryText}>{ui(locale, 'data')}</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
