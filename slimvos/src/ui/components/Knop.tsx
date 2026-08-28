import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { kleur, radius, RAAKVLAK, ruimte, schaduw, tekst } from '../thema';

export type KnopSoort = 'merk' | 'zacht' | 'rand' | 'goed' | 'fout' | 'kaal';

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

const vlakken: Record<Exclude<KnopSoort, 'merk'>, { bg: string; tekst: string; rand?: string }> = {
  zacht: { bg: kleur.merkZacht, tekst: kleur.merkDieper, rand: kleur.merkRand },
  rand: { bg: kleur.kaart, tekst: kleur.tekst, rand: kleur.rand },
  goed: { bg: kleur.goed, tekst: '#FFFFFF' },
  fout: { bg: kleur.fout, tekst: '#FFFFFF' },
  kaal: { bg: 'transparent', tekst: kleur.tekstZacht },
};

/** Knop met een korte indrukbeweging; dat maakt tikken op een telefoon voelbaar. */
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
  const schaal = useRef(new Animated.Value(1)).current;

  const veer = (naar: number) =>
    Animated.spring(schaal, { toValue: naar, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const inhoud = (
    <View style={styles.inhoud}>
      {links}
      <Text
        style={[
          styles.titel,
          klein && styles.titelKlein,
          { color: soort === 'merk' ? '#FFFFFF' : vlakken[soort].tekst },
        ]}
        numberOfLines={2}
      >
        {titel}
      </Text>
      {rechts}
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: schaal }] }, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={toelichting ? `${titel}. ${toelichting}` : titel}
        accessibilityState={{ disabled: uit }}
        disabled={uit}
        onPressIn={() => veer(0.965)}
        onPressOut={() => veer(1)}
        onPress={onPress}
        style={[styles.raam, klein && styles.raamKlein, uit && styles.uit]}
      >
        {soort === 'merk' ? (
          <LinearGradient
            colors={[kleur.merk, kleur.merkDonker]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.vlak, klein && styles.vlakKlein]}
          >
            {bezig ? <ActivityIndicator color="#FFFFFF" /> : inhoud}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.vlak,
              klein && styles.vlakKlein,
              { backgroundColor: vlakken[soort].bg },
              vlakken[soort].rand ? { borderWidth: 2, borderColor: vlakken[soort].rand } : null,
            ]}
          >
            {bezig ? <ActivityIndicator color={vlakken[soort].tekst} /> : inhoud}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  raam: { borderRadius: radius.l, overflow: 'hidden', ...schaduw.klein },
  raamKlein: { borderRadius: radius.m },
  vlak: {
    minHeight: RAAKVLAK,
    paddingHorizontal: ruimte.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.l,
  },
  vlakKlein: { minHeight: 44, paddingHorizontal: ruimte.l, borderRadius: radius.m },
  uit: { opacity: 0.42 },
  inhoud: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  titel: { ...tekst.subkop, fontSize: 18, textAlign: 'center' },
  titelKlein: { fontSize: 15 },
});
