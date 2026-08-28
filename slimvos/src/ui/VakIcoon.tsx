import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { kleurVoorVak } from './thema';

/** Getekende iconen per vak, zodat de app niet op emoji hoeft te leunen. */
interface Props {
  vak: string;
  formaat?: number;
  kleurOverschrijving?: string;
  style?: StyleProp<ViewStyle>;
}

export function VakIcoon({ vak, formaat = 32, kleurOverschrijving, style }: Props) {
  const c = kleurOverschrijving ?? kleurVoorVak(vak).van;
  const dun = { stroke: c, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <View style={style} accessible={false}>
      <Svg width={formaat} height={formaat} viewBox="0 0 32 32">
        {vak === 'rekenen' ? (
          <G>
            <Rect x={3} y={3} width={26} height={26} rx={7} {...dun} />
            <G {...dun}>
              <Path d="M8.5 10.5 L13.5 10.5 M11 8 L11 13" />
              <Path d="M18.5 10.5 L23.5 10.5" />
              <Path d="M9 19 L13 23 M13 19 L9 23" />
              <Path d="M18.5 21 L23.5 21" />
              <Circle cx={21} cy={18} r={0.9} fill={c} stroke="none" />
              <Circle cx={21} cy={24} r={0.9} fill={c} stroke="none" />
            </G>
          </G>
        ) : vak === 'taal' ? (
          <G {...dun}>
            <Path d="M6 26 L8.5 19.5 L21.5 6.5 A2.8 2.8 0 0 1 25.5 10.5 L12.5 23.5 Z" />
            <Path d="M19 9 L23 13" />
            <Path d="M8.5 19.5 L12.5 23.5" />
          </G>
        ) : vak === 'lezen' ? (
          <G {...dun}>
            <Path d="M16 8.5 C13 6 9 5.5 4.5 6.5 L4.5 24 C9 23 13 23.5 16 26" />
            <Path d="M16 8.5 C19 6 23 5.5 27.5 6.5 L27.5 24 C23 23 19 23.5 16 26" />
            <Path d="M16 8.5 L16 26" />
          </G>
        ) : vak === 'engels' ? (
          <G {...dun}>
            <Path d="M6 6.5 H26 A2.5 2.5 0 0 1 28.5 9 V19 A2.5 2.5 0 0 1 26 21.5 H14 L8 26.5 V21.5 H6 A2.5 2.5 0 0 1 3.5 19 V9 A2.5 2.5 0 0 1 6 6.5 Z" />
            <Path d="M10 17 L13 10 L16 17 M11 14.6 H15" />
            <Path d="M19.5 10 H22.5 A2 2 0 0 1 22.5 14 H19.5 V10 M19.5 14 H23 A2 2 0 0 1 23 18 H19.5 V14" />
          </G>
        ) : vak === 'wereld' ? (
          <G {...dun}>
            <Circle cx={16} cy={16} r={12.5} />
            <Path d="M3.5 16 H28.5" />
            <Path d="M16 3.5 C20 7.5 21.5 11.5 21.5 16 C21.5 20.5 20 24.5 16 28.5 C12 24.5 10.5 20.5 10.5 16 C10.5 11.5 12 7.5 16 3.5 Z" />
          </G>
        ) : vak === 'studie' ? (
          <G {...dun}>
            <Path d="M4.5 26.5 V6" />
            <Path d="M4.5 26.5 H28" />
            <Rect x={8.5} y={17} width={4.5} height={7} rx={1.4} />
            <Rect x={15.5} y={12} width={4.5} height={12} rx={1.4} />
            <Rect x={22.5} y={8} width={4.5} height={16} rx={1.4} />
          </G>
        ) : (
          <Circle cx={16} cy={16} r={12} {...dun} />
        )}
      </Svg>
    </View>
  );
}

/** Kleine sierlijke iconen die vaker terugkomen dan alleen bij een vak. */
export function Icoon({
  soort,
  formaat = 20,
  kleur: c = '#241F18',
}: {
  soort: 'vlam' | 'munt' | 'ster' | 'slot' | 'vink' | 'kruis' | 'speel' | 'pijl';
  formaat?: number;
  kleur?: string;
}) {
  const lijn = { stroke: c, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={formaat} height={formaat} viewBox="0 0 24 24">
      {soort === 'vlam' ? (
        <Path
          d="M12 2.5 C13.5 6.5 17.5 7.5 17.5 12.5 A5.5 5.5 0 0 1 6.5 12.5 C6.5 9.5 8.5 8.5 9 6.5 C10.5 8 11 9.5 11 11 C12.5 9.5 12.5 6 12 2.5 Z"
          fill={c}
        />
      ) : soort === 'munt' ? (
        <G>
          <Circle cx={12} cy={12} r={9} fill={c} />
          <Circle cx={12} cy={12} r={6} fill="none" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.55} />
        </G>
      ) : soort === 'ster' ? (
        <Path d="M12 3 L14.7 9.2 L21.5 9.9 L16.4 14.4 L17.9 21 L12 17.6 L6.1 21 L7.6 14.4 L2.5 9.9 L9.3 9.2 Z" fill={c} />
      ) : soort === 'slot' ? (
        <G {...lijn}>
          <Rect x={4.5} y={10.5} width={15} height={10} rx={3} />
          <Path d="M8.5 10.5 V7.5 A3.5 3.5 0 0 1 15.5 7.5 V10.5" />
        </G>
      ) : soort === 'vink' ? (
        <Path d="M5 12.5 L10 17.5 L19 7.5" {...lijn} strokeWidth={3} />
      ) : soort === 'kruis' ? (
        <G {...lijn} strokeWidth={3}>
          <Path d="M7 7 L17 17" />
          <Path d="M17 7 L7 17" />
        </G>
      ) : soort === 'speel' ? (
        <Path d="M8 5.5 L18.5 12 L8 18.5 Z" fill={c} />
      ) : (
        <Path d="M9 5.5 L15.5 12 L9 18.5" {...lijn} strokeWidth={2.6} />
      )}
    </Svg>
  );
}
