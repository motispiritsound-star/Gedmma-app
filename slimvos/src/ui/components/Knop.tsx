import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { kleur, knopRand, KNOPDIEPTE, radius, RAAKVLAK, ruimte, tekst } from '../thema';

export type KnopSoort = 'merk' | 'zacht' | 'rand' | 'goed' | 'fout' | 'slot' | 'kaal';

interface Props {
  titel: string;
  onPress: () => void;
  soort?: KnopSoort;
  uitgeschakeld?: boolean;
  bezig?: boolean;
  links?: React.ReactNode;
  rechts?: React.ReactNode;
  klein?: boolean;
  style?: StyleProp<ViewStyle>;
  toelichting?: string;
  testID?: string;
}

const vlakken: Record<KnopSoort, { bg: string; tekst: string; rand?: string }> = {
  merk: { bg: kleur.merk, tekst: '#FFFFFF' },
  zacht: { bg: kleur.merkZacht, tekst: kleur.merkDieper },
  rand: { bg: kleur.kaart, tekst: kleur.tekst, rand: kleur.rand },
  goed: { bg: kleur.goed, tekst: '#FFFFFF' },
  fout: { bg: kleur.fout, tekst: '#FFFFFF' },
  slot: { bg: kleur.slot, tekst: '#FFFFFF' },
  kaal: { bg: 'transparent', tekst: kleur.tekstZacht },
};

/**
 * Knop met een donkere rand eronder die verdwijnt als je hem indrukt. Dat is
 * wat een knop op een telefoon tastbaar maakt: je ziet hem zakken.
 */
export function Knop({
  titel,
  onPress,
  soort = 'merk',
  uitgeschakeld,
  bezig,
  links,
  rechts,
  klein,
  style,
  toelichting,
  testID,
}: Props) {
  const uit = !!(uitgeschakeld || bezig);
  const zak = useRef(new Animated.Value(0)).current;
  const diepte = soort === 'kaal' ? 0 : klein ? 3 : KNOPDIEPTE;

  const beweeg = (naar: number) =>
    Animated.timing(zak, { toValue: naar, duration: 70, useNativeDriver: true }).start();

  const vlak = vlakken[soort];
  const inhoud = bezig ? (
    <ActivityIndicator color={vlak.tekst} />
  ) : (
    <View style={styles.inhoud}>
      {links}
      <Text style={[styles.titel, klein && styles.titelKlein, { color: vlak.tekst }]} numberOfLines={2}>
        {titel}
      </Text>
      {rechts}
    </View>
  );

  return (
    <View
      style={[
        styles.sokkel,
        { backgroundColor: uit ? 'transparent' : knopRand[soort], paddingBottom: diepte },
        klein && styles.sokkelKlein,
        uit && styles.uit,
        style,
      ]}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={toelichting ? `${titel}. ${toelichting}` : titel}
        accessibilityState={{ disabled: uit }}
        disabled={uit}
        onPressIn={() => beweeg(diepte)}
        onPressOut={() => beweeg(0)}
        onPress={onPress}
      >
        <Animated.View style={{ transform: [{ translateY: zak }] }}>
          {soort === 'merk' ? (
            <LinearGradient
              colors={[kleur.merk, kleur.merkDonker]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.vlak, klein && styles.vlakKlein]}
            >
              {inhoud}
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.vlak,
                klein && styles.vlakKlein,
                { backgroundColor: vlak.bg },
                vlak.rand ? { borderWidth: 2, borderColor: vlak.rand } : null,
              ]}
            >
              {inhoud}
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sokkel: { borderRadius: radius.l, overflow: 'hidden' },
  sokkelKlein: { borderRadius: radius.m },
  vlak: {
    minHeight: RAAKVLAK,
    paddingHorizontal: ruimte.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.l,
  },
  vlakKlein: { minHeight: 44, paddingHorizontal: ruimte.l, borderRadius: radius.m },
  uit: { opacity: 0.4 },
  inhoud: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  titel: { ...tekst.subkop, fontSize: 18, textAlign: 'center', letterSpacing: 0.2 },
  titelKlein: { fontSize: 15 },
});
