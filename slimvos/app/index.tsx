import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../src/state/AppContext';
import { Vos } from '../src/ui/Vos';
import { kleur, ruimte, tekst } from '../src/ui/thema';

export default function Start() {
  const { klaar, profiel } = useApp();

  if (!klaar) {
    return (
      <View style={styles.midden}>
        <Vos uitdrukking="blij" formaat={104} />
        <Text style={[tekst.titel, { marginTop: ruimte.m }]}>Slimvos</Text>
      </View>
    );
  }
  return <Redirect href={profiel ? '/(tabs)' : '/welkom'} />;
}

const styles = StyleSheet.create({
  midden: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: kleur.grond },
});
