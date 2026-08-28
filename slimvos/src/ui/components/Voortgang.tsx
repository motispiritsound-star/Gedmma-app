import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { kleur, duur, ruimte, tekst } from '../thema';
import { Icoon } from '../VakIcoon';

const AnimatedView = Animated.View;

interface BalkProps {
  fractie: number;
  kleurVoor?: string;
  achtergrond?: string;
  hoogte?: number;
  label?: string;
  /** Zonder animatie bij lijsten met veel balken tegelijk. */
  stil?: boolean;
}

/** Voortgangsbalk die naar zijn nieuwe waarde toe groeit in plaats van te springen. */
export function Balk({ fractie, kleurVoor = kleur.merk, achtergrond = kleur.grondDiep, hoogte = 12, label, stil }: BalkProps) {
  const doel = Math.min(1, Math.max(0, Number.isFinite(fractie) ? fractie : 0));
  const waarde = useRef(new Animated.Value(stil ? doel : 0)).current;

  useEffect(() => {
    if (stil) {
      waarde.setValue(doel);
      return;
    }
    Animated.timing(waarde, { toValue: doel, duration: duur.traag, useNativeDriver: false }).start();
  }, [doel, stil, waarde]);

  const breedte = waarde.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View>
      {label ? <Text style={[tekst.klein, { marginBottom: ruimte.xs }]}>{label}</Text> : null}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.round(doel * 100), min: 0, max: 100 }}
        style={[styles.spoor, { height: hoogte, borderRadius: hoogte, backgroundColor: achtergrond }]}
      >
        <AnimatedView style={{ width: breedte, height: '100%', backgroundColor: kleurVoor, borderRadius: hoogte }} />
      </View>
    </View>
  );
}

interface RingProps {
  fractie: number;
  formaat?: number;
  dikte?: number;
  kleurVoor?: string;
  midden?: React.ReactNode;
}

/** Voortgangsring, voor het dagdoel op het startscherm. */
export function Ring({ fractie, formaat = 92, dikte = 10, kleurVoor = kleur.merk, midden }: RingProps) {
  const doel = Math.min(1, Math.max(0, Number.isFinite(fractie) ? fractie : 0));
  const straal = (formaat - dikte) / 2;
  const omtrek = 2 * Math.PI * straal;

  return (
    <View style={{ width: formaat, height: formaat, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={formaat} height={formaat} style={StyleSheet.absoluteFill}>
        <G rotation={-90} origin={`${formaat / 2}, ${formaat / 2}`}>
          <Circle
            cx={formaat / 2}
            cy={formaat / 2}
            r={straal}
            stroke={kleur.grondDiep}
            strokeWidth={dikte}
            fill="none"
          />
          <Circle
            cx={formaat / 2}
            cy={formaat / 2}
            r={straal}
            stroke={kleurVoor}
            strokeWidth={dikte}
            strokeLinecap="round"
            strokeDasharray={`${omtrek}`}
            strokeDashoffset={omtrek * (1 - doel)}
            fill="none"
          />
        </G>
      </Svg>
      {midden}
    </View>
  );
}

interface SterrenProps {
  aantal: number;
  van?: number;
  formaat?: number;
}

export function Sterren({ aantal, van = 3, formaat = 15 }: SterrenProps) {
  return (
    <View
      style={styles.sterren}
      accessible
      accessibilityLabel={`${aantal} van de ${van} sterren`}
    >
      {Array.from({ length: van }, (_, i) => (
        <Icoon key={i} soort="ster" formaat={formaat} kleur={i < aantal ? kleur.goud : kleur.rand} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  spoor: { overflow: 'hidden', width: '100%' },
  sterren: { flexDirection: 'row', gap: 2 },
});
