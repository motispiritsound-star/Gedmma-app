import { StyleSheet, Text, View } from 'react-native';
import { translate, type DataSourceKind, type Locale } from '@focusfamily/domain';
import { colors, spacing } from '@/lib/theme';

const dotColour: Record<DataSourceKind, string> = {
  os_verified: colors.accent,
  app_observed: colors.info,
  self_reported: colors.warm,
  simulated: colors.inkFaint,
};

/**
 * The mobile counterpart of the web source label. Same rule: no figure is ever
 * rendered without one of these next to it.
 */
export function SourceBadge({
  kind,
  confidence,
  locale,
  explain = false,
}: {
  kind: DataSourceKind;
  confidence?: string;
  locale: Locale;
  explain?: boolean;
}) {
  const label = translate(locale, `source.${kind}.label`);
  const confidenceText = confidence ? translate(locale, `confidence.${confidence}`) : null;

  return (
    <View>
      <View
        style={local.badge}
        accessibilityRole="text"
        accessibilityLabel={
          confidenceText ? `${label}, ${confidenceText}` : label
        }
        testID={`source-badge-${kind}`}
      >
        <View style={[local.dot, { backgroundColor: dotColour[kind] }]} />
        <Text style={local.text}>
          {label}
          {confidenceText ? ` · ${confidenceText}` : ''}
        </Text>
      </View>
      {explain ? (
        <Text style={local.explanation}>{translate(locale, `source.${kind}.explanation`)}</Text>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12, color: colors.inkSoft },
  explanation: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: spacing(0.5),
    lineHeight: 19,
  },
});
