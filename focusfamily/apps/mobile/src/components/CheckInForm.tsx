import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  conflictLevels,
  moodLevels,
  translate,
  type ConflictLevel,
  type Locale,
  type MoodLevel,
} from '@focusfamily/domain';
import { styles } from '@/lib/theme';
import { SourceBadge } from './SourceBadge';
import { ui } from '@/lib/strings';

/**
 * Three questions, warm wording, nothing clinical. The note stays on the
 * device unless the person taps "share with the family".
 */
export function CheckInForm({
  locale,
  onSubmit,
}: {
  locale: Locale;
  onSubmit: (value: {
    mood: MoodLevel;
    conflict: ConflictLevel;
    sharedWithFamily: boolean;
  }) => void;
}) {
  const [mood, setMood] = useState<MoodLevel>(3);
  const [conflict, setConflict] = useState<ConflictLevel>('none');
  const [shared, setShared] = useState(false);

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.title} accessibilityRole="header">
        {translate(locale, 'checkin.title')}
      </Text>
      <Text style={styles.subtitle}>{translate(locale, 'checkin.intro')}</Text>
      <SourceBadge kind="self_reported" locale={locale} explain />

      <Text style={styles.cardTitle}>{translate(locale, 'checkin.mood')}</Text>
      {moodLevels.map((level) => (
        <Pressable
          key={level}
          accessibilityRole="radio"
          accessibilityState={{ selected: mood === level }}
          testID={`mood-${level}`}
          style={mood === level ? styles.button : styles.buttonSecondary}
          onPress={() => setMood(level)}
        >
          <Text style={mood === level ? styles.buttonText : styles.buttonSecondaryText}>
            {translate(locale, `checkin.mood.${level}`)}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.cardTitle}>{translate(locale, 'checkin.conflict')}</Text>
      {conflictLevels.map((level) => (
        <Pressable
          key={level}
          accessibilityRole="radio"
          accessibilityState={{ selected: conflict === level }}
          testID={`conflict-${level}`}
          style={conflict === level ? styles.button : styles.buttonSecondary}
          onPress={() => setConflict(level)}
        >
          <Text style={conflict === level ? styles.buttonText : styles.buttonSecondaryText}>
            {translate(locale, `checkin.conflict.${level}`)}
          </Text>
        </Pressable>
      ))}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: shared }}
        testID="share-toggle"
        style={styles.buttonSecondary}
        onPress={() => setShared((value) => !value)}
      >
        <Text style={styles.buttonSecondaryText}>{translate(locale, 'checkin.share')}</Text>
      </Pressable>
      <Text style={styles.body}>{translate(locale, 'checkin.private_note')}</Text>

      <Pressable
        accessibilityRole="button"
        testID="checkin-submit"
        style={styles.button}
        onPress={() => onSubmit({ mood, conflict, sharedWithFamily: shared })}
      >
        <Text style={styles.buttonText}>{ui(locale, 'save')}</Text>
      </Pressable>
    </View>
  );
}
