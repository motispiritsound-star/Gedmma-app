import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { kleur } from '../thema';

const KLEUREN = [kleur.merk, kleur.goud, kleur.goed, '#3D7DF6', '#E0489B', '#7C5CD6'];

interface Props {
  /** Zet op true op het moment dat er iets te vieren valt. */
  actief: boolean;
  aantal?: number;
}

/**
 * Losse snippers die één keer naar beneden dwarrelen. Bewust kort en zonder
 * geluid: het moet een schouderklopje zijn, geen gokkast.
 */
export function Confetti({ actief, aantal = 28 }: Props) {
  const breedte = Dimensions.get('window').width;
  const voortgang = useRef(new Animated.Value(0)).current;

  const snippers = useMemo(
    () =>
      Array.from({ length: aantal }, (_, i) => ({
        id: i,
        x: Math.random() * breedte,
        vertraging: Math.random() * 350,
        draai: Math.random() * 4 - 2,
        formaat: 6 + Math.random() * 7,
        kleur: KLEUREN[i % KLEUREN.length],
      })),
    [aantal, breedte],
  );

  useEffect(() => {
    if (!actief) return;
    voortgang.setValue(0);
    Animated.timing(voortgang, {
      toValue: 1,
      duration: 1900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [actief, voortgang]);

  if (!actief) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {snippers.map((s) => {
        const val = voortgang.interpolate({ inputRange: [0, 1], outputRange: [-40, 720] });
        const zij = voortgang.interpolate({ inputRange: [0, 1], outputRange: [0, s.draai * 60] });
        const draai = voortgang.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${s.draai * 540}deg`] });
        const vervaag = voortgang.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={s.id}
            style={{
              position: 'absolute',
              left: s.x,
              width: s.formaat,
              height: s.formaat * 1.6,
              borderRadius: 2,
              backgroundColor: s.kleur,
              opacity: vervaag,
              transform: [{ translateY: val }, { translateX: zij }, { rotate: draai }],
            }}
          />
        );
      })}
    </View>
  );
}
