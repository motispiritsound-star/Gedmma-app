import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { controleerEmail } from '../../src/core/account/validatie';
import { lokaleAuth } from '../../src/state/auth';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { kleur, ruimte, tekst } from '../../src/ui/thema';
import { Veld } from './aanmelden';

export default function WachtwoordVergeten() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fout, setFout] = useState<string | undefined>();
  const [verstuurd, setVerstuurd] = useState(false);

  async function verstuur() {
    const controle = controleerEmail(email);
    if (controle) {
      setFout(controle);
      return;
    }
    setFout(undefined);
    await lokaleAuth.vraagHerstel(email);
    setVerstuurd(true);
  }

  if (verstuurd) {
    return (
      <ScrollView contentContainerStyle={styles.inhoud} style={styles.scherm}>
        <Kaart style={styles.bevestiging}>
          <Text style={tekst.subkop}>Kijk in je mail</Text>
          <Text style={tekst.body}>
            Als er een account bestaat met dit adres, sturen we een link om een nieuw wachtwoord te kiezen.
          </Text>
          <Text style={tekst.klein}>
            In deze versie wordt er nog geen mail verstuurd: daarvoor is een server nodig. De melding is
            wel bewust altijd hetzelfde, zodat niemand kan uitvissen welke adressen bestaan.
          </Text>
        </Kaart>
        <Knop titel="Terug naar inloggen" onPress={() => router.replace('/account/inloggen')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.inhoud} style={styles.scherm} keyboardShouldPersistTaps="handled">
      <Text style={tekst.titel}>Wachtwoord vergeten</Text>
      <Text style={tekst.body}>Vul je e-mailadres in, dan sturen we je een link om een nieuw wachtwoord te kiezen.</Text>
      <Veld label="E-mailadres" waarde={email} zet={setEmail} placeholder="jij@voorbeeld.nl" testID="email" keyboardType="email-address" fout={fout} />
      <Knop titel="Stuur me een link" onPress={verstuur} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.m },
  bevestiging: { backgroundColor: kleur.goedZacht, borderColor: kleur.goedRand, gap: ruimte.s },
});
