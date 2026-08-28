import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { kleur } from '../../src/ui/thema';

function Icoon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: kleur.primair,
        tabBarInactiveTintColor: kleur.tekstZacht,
        tabBarStyle: { backgroundColor: kleur.kaart, borderTopColor: kleur.rand, height: 64, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Oefenen', tabBarIcon: ({ focused }) => <Icoon emoji="🎯" focused={focused} /> }}
      />
      <Tabs.Screen
        name="voortgang"
        options={{ title: 'Voortgang', tabBarIcon: ({ focused }) => <Icoon emoji="📈" focused={focused} /> }}
      />
      <Tabs.Screen
        name="beloningen"
        options={{ title: 'Beloningen', tabBarIcon: ({ focused }) => <Icoon emoji="🏅" focused={focused} /> }}
      />
      <Tabs.Screen
        name="ouders"
        options={{ title: 'Ouders', tabBarIcon: ({ focused }) => <Icoon emoji="👋" focused={focused} /> }}
      />
    </Tabs>
  );
}
