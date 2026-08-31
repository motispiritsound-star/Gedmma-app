import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { kleur, font, radius } from '../../src/ui/thema';

/**
 * Het actieve tabblad krijgt een gekleurd vlakje achter het icoon. Dat leest
 * op een klein scherm sneller dan alleen een kleurverschil in de lijn.
 */
function TabIcoon({ soort, actief }: { soort: string; actief: boolean }) {
  const c = actief ? kleur.merkDieper : kleur.tekstZacht;
  const lijn = { stroke: c, strokeWidth: actief ? 2.6 : 2.1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <View
      style={{
        width: 52,
        height: 32,
        borderRadius: radius.rond,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: actief ? kleur.merkZacht : 'transparent',
      }}
    >
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {soort === 'oefenen' ? (
        <>
          <Circle cx={12} cy={12} r={8.5} {...lijn} />
          <Circle cx={12} cy={12} r={4} {...lijn} />
          <Circle cx={12} cy={12} r={1.3} fill={c} />
        </>
      ) : soort === 'voortgang' ? (
        <>
          <Path d="M4 19 V6" {...lijn} />
          <Path d="M4 19 H20" {...lijn} />
          <Path d="M7.5 15.5 L11 11.5 L14 13.5 L19 7.5" {...lijn} />
        </>
      ) : soort === 'films' ? (
        <>
          <Rect x={3} y={5.5} width={18} height={13} rx={3.5} {...lijn} />
          <Path d="M10.5 9.5 L15 12 L10.5 14.5 Z" fill={c} />
        </>
      ) : soort === 'beloningen' ? (
        <>
          <Circle cx={12} cy={9.5} r={5.5} {...lijn} />
          <Path d="M8.5 14 L7 21 L12 18.5 L17 21 L15.5 14" {...lijn} />
        </>
      ) : (
        <>
          <Circle cx={12} cy={8} r={3.8} {...lijn} />
          <Path d="M4.8 20 C5.4 15.8 8.3 13.5 12 13.5 C15.7 13.5 18.6 15.8 19.2 20" {...lijn} />
        </>
      )}
    </Svg>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: kleur.merkDieper,
        tabBarInactiveTintColor: kleur.tekstZacht,
        tabBarStyle: {
          backgroundColor: kleur.kaart,
          borderTopColor: kleur.randZacht,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: font.bodySemi, fontSize: 11.5 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Oefenen', tabBarIcon: ({ focused }) => <TabIcoon soort="oefenen" actief={focused} /> }} />
      <Tabs.Screen name="voortgang" options={{ title: 'Voortgang', tabBarIcon: ({ focused }) => <TabIcoon soort="voortgang" actief={focused} /> }} />
      <Tabs.Screen name="films" options={{ title: 'Filmpjes', tabBarIcon: ({ focused }) => <TabIcoon soort="films" actief={focused} /> }} />
      <Tabs.Screen name="beloningen" options={{ title: 'Beloningen', tabBarIcon: ({ focused }) => <TabIcoon soort="beloningen" actief={focused} /> }} />
      <Tabs.Screen name="ouders" options={{ title: 'Ouders', tabBarIcon: ({ focused }) => <TabIcoon soort="ouders" actief={focused} /> }} />
    </Tabs>
  );
}
