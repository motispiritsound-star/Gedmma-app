import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthFout } from '../../src/core/account/types';
import { useApp } from '../../src/state/AppContext';
import { Knop } from '../../src/ui/components/Knop';
import { kleur, ruimte, tekst } from '../../src/ui/thema';
import { Veld } from './aanmelden';

export default function Inloggen() {
  const router = useRouter();
  const { logIn } = useApp();
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [fout, setFout] = useState<{ veld?: string; melding: string } | null>(null);
  const [bezig, setBezig] = useState(false);

  async function verstuur() {
    setBezig(true);
    setFout(null);
    try {
      await logIn(email, wachtwoord);
      router.replace('/(tabs)/ouders');
    } catch (e) {
      setFout({
        veld: e instanceof AuthFout ? e.veld : undefined,
        melding: e instanceof Error ? e.message : 'Er ging iets mis.',
      });
    } finally {
      setBezig(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.scherm}>
      <ScrollView contentContainerStyle={styles.inhoud} keyboardShouldPersistTaps="handled">
        <Text style={tekst.titel}>Welkom terug</Text>
        <Veld label="E-mailadres" waarde={email} zet={setEmail} placeholder="jij@voorbeeld.nl" testID="email" autoComplete="email" keyboardType="email-address" />
        <Veld
          label="Wachtwoord"
          waarde={wachtwoord}
          zet={setWachtwoord}
          placeholder="Je wachtwoord"
          testID="wachtwoord"
          geheim
          autoComplete="password"
          fout={fout?.melding}
        />
        <Knop testID="inloggen" titel="Inloggen" onPress={verstuur} bezig={bezig} />
        <Knop titel="Wachtwoord vergeten" soort="kaal" onPress={() => router.push('/account/wachtwoord')} />
        <Knop titel="Nog geen account? Aanmelden" soort="kaal" onPress={() => router.replace('/account/aanmelden')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.m },
});
