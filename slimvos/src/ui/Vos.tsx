import { useId } from 'react';
import Svg, { Circle, Ellipse, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Vos, de mascotte. Getekend als SVG in plaats van een plaatje, zodat hij op
 * elk scherm scherp blijft, niets weegt, en van uitdrukking kan wisselen.
 */
export type Uitdrukking = 'blij' | 'juich' | 'denk' | 'troost' | 'slaap' | 'wijs';

interface Props {
  uitdrukking?: Uitdrukking;
  formaat?: number;
  style?: StyleProp<ViewStyle>;
}

const VACHT_LICHT = '#FB8A4C';
const VACHT_DONKER = '#E2601F';
const OOR_BINNEN = '#C4410F';
const CREME = '#FFF3E4';
const DONKER = '#3A2415';

export function Vos({ uitdrukking = 'blij', formaat = 96, style }: Props) {
  // Elke vos krijgt een eigen id voor zijn kleurverloop. Staan er twee op één
  // pagina met dezelfde id, dan pakt de browser de verkeerde en valt de vulling
  // weg — dat leverde eerder een kop zonder gezicht op.
  const gradientId = `vacht-${useId().replace(/:/g, '')}`;
  const dicht = uitdrukking === 'juich' || uitdrukking === 'slaap';
  const kijktOpzij = uitdrukking === 'denk';
  const pupilX = kijktOpzij ? 3 : 0;

  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="Vos, je maatje">
      <Svg width={formaat} height={formaat} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={VACHT_LICHT} />
            <Stop offset="1" stopColor={VACHT_DONKER} />
          </LinearGradient>
        </Defs>

        {/* Oren */}
        <Path d="M20 40 L11 9 L41 22 Z" fill={`url(#${gradientId})`} />
        <Path d="M80 40 L89 9 L59 22 Z" fill={`url(#${gradientId})`} />
        <Path d="M22 34 L17 17 L34 24 Z" fill={OOR_BINNEN} />
        <Path d="M78 34 L83 17 L66 24 Z" fill={OOR_BINNEN} />

        {/* Kop */}
        <Path
          d="M14 47 C14 28 31 19 50 19 C69 19 86 28 86 47 C86 62 76 72 63 78 C58 83 54 88 50 88 C46 88 42 83 37 78 C24 72 14 62 14 47 Z"
          fill={`url(#${gradientId})`}
        />

        {/* Wangen en snuit */}
        <Path d="M50 46 C62 46 68 53 68 61 C68 71 60 80 50 88 C40 80 32 71 32 61 C32 53 38 46 50 46 Z" fill={CREME} />
        <Path d="M20 40 C25 36 30 35 34 36 C33 43 30 48 25 50 C21 48 19 44 20 40 Z" fill={CREME} opacity={0.75} />
        <Path d="M80 40 C75 36 70 35 66 36 C67 43 70 48 75 50 C79 48 81 44 80 40 Z" fill={CREME} opacity={0.75} />

        {/* Ogen */}
        {dicht ? (
          <G stroke={DONKER} strokeWidth={3.2} strokeLinecap="round" fill="none">
            <Path d="M31 45 Q37 39 43 45" />
            <Path d="M57 45 Q63 39 69 45" />
          </G>
        ) : (
          <G>
            <Ellipse cx={37} cy={44} rx={5.2} ry={6} fill={DONKER} />
            <Ellipse cx={63} cy={44} rx={5.2} ry={6} fill={DONKER} />
            <Circle cx={38.8 + pupilX} cy={41.8} r={1.9} fill="#FFFFFF" />
            <Circle cx={64.8 + pupilX} cy={41.8} r={1.9} fill="#FFFFFF" />
          </G>
        )}

        {/* Wenkbrauwen bij nadenken en bij wijsheid */}
        {uitdrukking === 'denk' ? (
          <G stroke={DONKER} strokeWidth={2.6} strokeLinecap="round">
            <Path d="M31 33 L44 30" />
            <Path d="M57 31 L69 34" />
          </G>
        ) : null}
        {uitdrukking === 'wijs' ? (
          <G stroke={DONKER} strokeWidth={2.6} strokeLinecap="round">
            <Path d="M31 32 L44 33" />
            <Path d="M57 33 L69 32" />
          </G>
        ) : null}

        {/* Neus */}
        <Path d="M50 56 C53.6 56 56 58 56 60.2 C56 62.6 53.4 64.4 50 64.4 C46.6 64.4 44 62.6 44 60.2 C44 58 46.4 56 50 56 Z" fill={DONKER} />

        {/* Mond */}
        {uitdrukking === 'juich' ? (
          <Path d="M42 69 Q50 80 58 69 Q50 73 42 69 Z" fill={DONKER} />
        ) : uitdrukking === 'troost' ? (
          <Path d="M43 71 Q50 75 57 71" stroke={DONKER} strokeWidth={2.8} strokeLinecap="round" fill="none" />
        ) : uitdrukking === 'slaap' ? (
          <Path d="M46 71 Q50 74 54 71" stroke={DONKER} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        ) : (
          <G stroke={DONKER} strokeWidth={2.8} strokeLinecap="round" fill="none">
            <Path d="M50 64 L50 68" />
            <Path d="M42 68 Q46 73 50 68" />
            <Path d="M50 68 Q54 73 58 68" />
          </G>
        )}

        {/* Snorharen */}
        <G stroke={DONKER} strokeWidth={1.5} strokeLinecap="round" opacity={0.5}>
          <Path d="M32 58 L22 56" />
          <Path d="M32 62 L22 63" />
          <Path d="M68 58 L78 56" />
          <Path d="M68 62 L78 63" />
        </G>
      </Svg>
    </View>
  );
}
