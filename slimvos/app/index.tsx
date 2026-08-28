import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../src/state/AppContext';
import { kleur, ruimte, tekst } from '../src/ui/thema';

export default function Start() {
  const { klaar, profiel } = useApp();

  if (!klaar) {
    return (
      <View style={styles.midden}>
        <Text style={styles.logo}>🦊</Text>
        <Text style={tekst.kop}>Slimvos</Text>
        <ActivityIndicator style={{ marginTop: ruimte.l }} color={kleur.primair} />
      </View>
    );
  }
  return <Redirect href={profiel ? '/(tabs)' : '/welkom'} />;
}

const styles = StyleSheet.create({
  midden: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: kleur.achtergrond },
  logo: { fontSize: 64, marginBottom: ruimte.m },
});
