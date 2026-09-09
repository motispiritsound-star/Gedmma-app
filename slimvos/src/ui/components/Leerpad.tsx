import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import type { Onderwerp } from '../../core/types';
import type { Beheersing } from '../../core/engine/beheersing';
import { useBewegingBeperkt } from '../beweging';
import { kleur, kleurVoorVak, radius, ruimte, schaduw, tekst } from '../thema';
import { Icoon } from '../VakIcoon';
import { Sterren } from './Voortgang';

export interface PadKnoop {
  onderwerp: Onderwerp;
  beheersing: Beheersing;
  open: boolean;
  /** Het onderwerp dat de app nu aanraadt; krijgt de nadruk. */
  aanbevolen: boolean;
}

interface Props {
  knopen: PadKnoop[];
  onKies: (knoop: PadKnoop) => void;
}

const KNOOP = 76;
const RING = 5;
const ZIJSTAP = [0, 46, 0, -46];

/**
 * De onderwerpen als route in plaats van als lijst. Een kind ziet in één blik
 * waar het is, wat het al beheerst en wat het volgende stapje is — dat werkt
 * beter dan een rij kaarten die allemaal even belangrijk lijken.
 */
export function Leerpad({ knopen, onKies }: Props) {
  return (
    <View style={styles.pad}>
      <View style={styles.lijn} pointerEvents="none" />
      {knopen.map((knoop, i) => (
        <Knoop key={knoop.onderwerp.id} knoop={knoop} verschuiving={ZIJSTAP[i % ZIJSTAP.length]} onKies={onKies} />
      ))}
    </View>
  );
}

function Knoop({
  knoop,
  verschuiving,
  onKies,
}: {
  knoop: PadKnoop;
  verschuiving: number;
  onKies: (knoop: PadKnoop) => void;
}) {
  const { onderwerp, beheersing, open, aanbevolen } = knoop;
  const kl = kleurVoorVak(onderwerp.vak);
  const beperkt = useBewegingBeperkt();
  const wip = useRef(new Animated.Value(0)).current;
  const zak = useRef(new Animated.Value(0)).current;
  const begonnen = beheersing.goed + beheersing.fout > 0;

  // Het aanbevolen onderwerp wipt zachtjes op en neer, zodat het oog er
  // vanzelf heen gaat zonder dat er iets knippert.
  useEffect(() => {
    if (!aanbevolen || beperkt) {
      wip.setValue(0);
      return;
    }
    const lus = Animated.loop(
      Animated.sequence([
        Animated.timing(wip, { toValue: -6, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(wip, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    lus.start();
    return () => lus.stop();
  }, [aanbevolen, beperkt, wip]);

  const straal = (KNOOP - RING) / 2;
  const omtrek = 2 * Math.PI * straal;
  const vulling = beheersing.niveau / 5;

  return (
    <View style={[styles.knoopRij, { transform: [{ translateX: verschuiving }] }]}>
      {aanbevolen ? (
        <Animated.View style={[styles.bubbel, { transform: [{ translateY: wip }] }]}>
          <Text style={styles.bubbelTekst}>Start hier</Text>
          <View style={styles.bubbelPunt} />
        </Animated.View>
      ) : null}

      <Animated.View style={{ transform: [{ translateY: Animated.add(aanbevolen ? wip : new Animated.Value(0), zak) }] }}>
        <Pressable
          testID={`knoop-${onderwerp.id}`}
          accessibilityRole="button"
          accessibilityLabel={
            open
              ? `${onderwerp.naam}, niveau ${beheersing.niveau} van 5, ${beheersing.sterren} van 3 sterren`
              : `${onderwerp.naam}, op slot`
          }
          onPressIn={() => Animated.timing(zak, { toValue: 4, duration: 70, useNativeDriver: true }).start()}
          onPressOut={() => Animated.timing(zak, { toValue: 0, duration: 70, useNativeDriver: true }).start()}
          onPress={() => onKies(knoop)}
          style={styles.knoopVlak}
        >
          <Svg width={KNOOP} height={KNOOP} style={StyleSheet.absoluteFill}>
            <G rotation={-90} origin={`${KNOOP / 2}, ${KNOOP / 2}`}>
              <Circle cx={KNOOP / 2} cy={KNOOP / 2} r={straal} stroke={kleur.grondDiep} strokeWidth={RING} fill="none" />
              {open && begonnen ? (
                <Circle
                  cx={KNOOP / 2}
                  cy={KNOOP / 2}
                  r={straal}
                  stroke={kl.van}
                  strokeWidth={RING}
                  strokeLinecap="round"
                  strokeDasharray={`${omtrek}`}
                  strokeDashoffset={omtrek * (1 - vulling)}
                  fill="none"
                />
              ) : null}
            </G>
          </Svg>
          <View
            style={[
              styles.bol,
              { backgroundColor: !open ? kleur.grondDiep : begonnen ? kl.van : kleur.kaart },
              open && !begonnen ? styles.bolLeeg : null,
              aanbevolen ? schaduw.midden : schaduw.klein,
            ]}
          >
            {!open ? (
              <Icoon soort="slot" formaat={22} kleur={kleur.tekstZacht} />
            ) : (
              <Text style={[styles.bolCijfer, { color: begonnen ? '#FFFFFF' : kleur.tekstZacht }]}>
                {beheersing.niveau}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>

      <View style={styles.onder}>
        <Text style={[tekst.bodyVet, styles.naam]} numberOfLines={2}>
          {onderwerp.naam}
        </Text>
        {open ? <Sterren aantal={beheersing.sterren} formaat={13} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { alignItems: 'center', paddingVertical: ruimte.l },
  lijn: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    width: 5,
    borderRadius: 5,
    backgroundColor: kleur.rand,
    opacity: 0.7,
  },
  knoopRij: { alignItems: 'center', marginBottom: ruimte.xl, width: 150 },
  knoopVlak: { width: KNOOP, height: KNOOP, alignItems: 'center', justifyContent: 'center' },
  bol: {
    width: KNOOP - RING * 2 - 6,
    height: KNOOP - RING * 2 - 6,
    borderRadius: radius.rond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolLeeg: { borderWidth: 2, borderColor: kleur.rand },
  bolCijfer: { ...tekst.cijfer, fontSize: 24 },
  // De naam krijgt de grondkleur als achtergrond, zodat de padlijn er niet
  // dwars doorheen loopt.
  onder: {
    alignItems: 'center',
    gap: 3,
    marginTop: ruimte.s,
    backgroundColor: kleur.grond,
    paddingHorizontal: ruimte.s,
    paddingVertical: 2,
    borderRadius: radius.s,
  },
  naam: { textAlign: 'center', fontSize: 14 },
  bubbel: {
    backgroundColor: kleur.kaart,
    borderWidth: 2,
    borderColor: kleur.merk,
    borderRadius: radius.m,
    paddingHorizontal: ruimte.m,
    paddingVertical: 5,
    marginBottom: ruimte.s,
    ...schaduw.klein,
  },
  bubbelTekst: { ...tekst.label, color: kleur.merkDieper },
  bubbelPunt: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    width: 12,
    height: 12,
    backgroundColor: kleur.kaart,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: kleur.merk,
    transform: [{ rotate: '45deg' }],
  },
});
