import { StyleSheet, Text, View } from 'react-native';
import { kleur, ruimte, tekst } from '../thema';

interface Props {
  fractie: number;
  kleurVoor?: string;
  label?: string;
  hoogte?: number;
}

export function Balk({ fractie, kleurVoor = kleur.primair, label, hoogte = 12 }: Props) {
  const breedte = `${Math.round(Math.min(1, Math.max(0, fractie)) * 100)}%` as const;
  return (
    <View>
      {label ? <Text style={[tekst.klein, styles.label]}>{label}</Text> : null}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.round(fractie * 100), min: 0, max: 100 }}
        style={[styles.spoor, { height: hoogte, borderRadius: hoogte }]}
      >
        <View style={{ width: breedte, height: '100%', backgroundColor: kleurVoor, borderRadius: hoogte }} />
      </View>
    </View>
  );
}

interface SterrenProps {
  aantal: number;
  van?: number;
  formaat?: number;
}

export function Sterren({ aantal, van = 3, formaat = 16 }: SterrenProps) {
  return (
    <Text
      accessibilityLabel={`${aantal} van de ${van} sterren`}
      style={{ fontSize: formaat, letterSpacing: 1 }}
    >
      {'★'.repeat(aantal)}
      <Text style={{ color: kleur.rand }}>{'★'.repeat(Math.max(0, van - aantal))}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  spoor: { backgroundColor: kleur.rand, overflow: 'hidden' },
  label: { marginBottom: ruimte.xs },
});
