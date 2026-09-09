import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { kleur, radius, ruimte, schaduw } from '../thema';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  hoogte?: 'klein' | 'midden' | 'groot';
  testID?: string;
}

export function Kaart({ children, onPress, style, accessibilityLabel, hoogte = 'klein', testID }: Props) {
  const schaal = useRef(new Animated.Value(1)).current;
  const basis = [styles.kaart, schaduw[hoogte], style];

  if (!onPress) {
    return (
      <View testID={testID} style={basis}>
        {children}
      </View>
    );
  }

  const veer = (naar: number) =>
    Animated.spring(schaal, { toValue: naar, useNativeDriver: true, speed: 40, bounciness: 5 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: schaal }] }}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => veer(0.98)}
        onPressOut={() => veer(1)}
        onPress={onPress}
        style={basis}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  kaart: {
    backgroundColor: kleur.kaart,
    borderRadius: radius.l,
    padding: ruimte.l,
    borderWidth: 1,
    borderColor: kleur.randZacht,
  },
});
