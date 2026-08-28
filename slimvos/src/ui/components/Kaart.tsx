import type React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { kleur, radius, ruimte, schaduw } from '../thema';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Kaart({ children, onPress, style, accessibilityLabel }: Props) {
  if (!onPress) return <View style={[styles.kaart, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.kaart, pressed && styles.ingedrukt, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kaart: {
    backgroundColor: kleur.kaart,
    borderRadius: radius.l,
    padding: ruimte.l,
    borderWidth: 1,
    borderColor: kleur.rand,
    ...schaduw,
  },
  ingedrukt: { transform: [{ scale: 0.99 }], opacity: 0.92 },
});
