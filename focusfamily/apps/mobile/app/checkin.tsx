import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CheckInForm } from '@/components/CheckInForm';
import { ui } from '@/lib/strings';
import { styles } from '@/lib/theme';

export default function CheckInScreen() {
  const [saved, setSaved] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <CheckInForm locale="nl" onSubmit={() => setSaved(true)} />
      {saved ? (
        <View style={[styles.notice, styles.noticeGood]}>
          <Text style={styles.body}>{ui('nl', 'saved')}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
