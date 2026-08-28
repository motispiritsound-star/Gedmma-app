import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { kleur, radius, RAAKVLAK, ruimte, schaduw } from '../thema';

type Soort = 'primair' | 'zacht' | 'rand' | 'goed' | 'fout';

interface Props {
  titel: string;
  onPress: () => void;
  soort?: Soort;
  uitgeschakeld?: boolean;
  bezig?: boolean;
  emoji?: string;
  style?: StyleProp<ViewStyle>;
  /** Wordt voorgelezen door VoiceOver/TalkBack als de titel te kort is. */
  toelichting?: string;
  testID?: string;
}

const achtergronden: Record<Soort, string> = {
  primair: kleur.primair,
  zacht: kleur.primairZacht,
  rand: kleur.kaart,
  goed: kleur.goed,
  fout: kleur.fout,
};

const tekstkleuren: Record<Soort, string> = {
  primair: '#FFFFFF',
  zacht: kleur.primair,
  rand: kleur.tekst,
  goed: '#FFFFFF',
  fout: '#FFFFFF',
};

export function Knop({ titel, onPress, soort = 'primair', uitgeschakeld, bezig, emoji, style, toelichting, testID }: Props) {
  const uit = uitgeschakeld || bezig;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={toelichting ? `${titel}. ${toelichting}` : titel}
      accessibilityState={{ disabled: !!uit }}
      disabled={uit}
      onPress={onPress}
      style={({ pressed }) => [
        styles.knop,
        { backgroundColor: achtergronden[soort] },
        soort === 'rand' && styles.metRand,
        pressed && !uit && styles.ingedrukt,
        uit && styles.uit,
        style,
      ]}
    >
      {bezig ? (
        <ActivityIndicator color={tekstkleuren[soort]} />
      ) : (
        <View style={styles.inhoud}>
          {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
          <Text style={[styles.titel, { color: tekstkleuren[soort] }]}>{titel}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  knop: {
    minHeight: RAAKVLAK,
    borderRadius: radius.l,
    paddingHorizontal: ruimte.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...schaduw,
  },
  metRand: { borderWidth: 2, borderColor: kleur.rand },
  ingedrukt: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  uit: { opacity: 0.45 },
  inhoud: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  emoji: { fontSize: 20 },
  titel: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
});
