import { ScrollView, Text, View } from 'react-native';
import { FORBIDDEN_CAPABILITIES, NOT_COLLECTED, translate } from '@focusfamily/domain';
import { createAdapter } from '@/native/screenTime';
import { USE_MOCK_SCREEN_TIME } from '@/lib/config';
import { ui } from '@/lib/strings';
import { styles } from '@/lib/theme';

const locale = 'nl' as const;

/**
 * The transparency screen. It reads its own capability list from the adapter
 * that is actually installed, so it cannot claim a capability the build does
 * not have.
 */
export default function DataScreen() {
  const adapter = createAdapter({ forceMock: USE_MOCK_SCREEN_TIME });
  const capabilities = adapter.capabilities();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {ui(locale, 'whatIsMeasured')}
      </Text>
      <Text style={styles.subtitle}>{ui(locale, 'everyoneSeesThis')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{capabilities.adapter}</Text>
        {capabilities.limitationKeys.map((key) => (
          <Text key={key} style={styles.body}>
            {translate(locale, key)}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{translate(locale, 'rights.not_collected.title')}</Text>
        {NOT_COLLECTED.map((item) => (
          <Text key={item} style={styles.body}>
            {item}
          </Text>
        ))}
      </View>

      <View style={[styles.notice, styles.noticeWarm]}>
        <Text style={styles.body}>{translate(locale, 'authz.capability_not_offered')}</Text>
        {FORBIDDEN_CAPABILITIES.map((capability) => (
          <Text key={capability} style={styles.body}>
            {capability}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
