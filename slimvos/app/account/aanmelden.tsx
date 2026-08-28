import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthFout } from '../../src/core/account/types';
import { controleerWachtwoord, wachtwoordSterkte } from '../../src/core/account/validatie';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { Balk } from '../../src/ui/components/Voortgang';
import { Icoon } from '../../src/ui/VakIcoon';
import { kleur, radius, ruimte, tekst } from '../../src/ui/thema';

const STERKTE = ['te kort', 'kan sterker', 'prima', 'sterk'];

export default function Aanmelden() {
  const router = useRouter();
  const { registreer } = useApp();
  const [naam, setNaam] = useState('');
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [nieuwsbrief, setNieuwsbrief] = useState(false);
  const [fout, setFout] = useState<{ veld?: string; melding: string } | null>(null);
  const [bezig, setBezig] = useState(false);

  const sterkte = wachtwoordSterkte(wachtwoord);
  const wachtwoordFout = wachtwoord.length > 0 ? controleerWachtwoord(wachtwoord) : null;

  async function verstuur() {
    setBezig(true);
    setFout(null);
    try {
      await registreer({ naam, email, wachtwoord, nieuwsbrief });
      router.replace('/abonnement');
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
        <Text style={tekst.titel}>Account voor ouders</Text>
        <Text style={tekst.body}>
          Het account is van jou, niet van je kind. Je hebt het alleen nodig voor een abonnement.
          Oefenen kan ook zonder.
        </Text>

        <Veld label="Je naam" waarde={naam} zet={setNaam} placeholder="Bijvoorbeeld: Sanne" testID="naam" fout={fout?.veld === 'naam' ? fout.melding : undefined} />
        <Veld
          label="E-mailadres"
          waarde={email}
          zet={setEmail}
          placeholder="jij@voorbeeld.nl"
          testID="email"
          autoComplete="email"
          keyboardType="email-address"
          fout={fout?.veld === 'email' ? fout.melding : undefined}
        />
        <Veld
          label="Wachtwoord"
          waarde={wachtwoord}
          zet={setWachtwoord}
          placeholder="Minstens 8 tekens"
          testID="wachtwoord"
          geheim
          fout={fout?.veld === 'wachtwoord' ? fout.melding : (wachtwoordFout ?? undefined)}
        />
        {wachtwoord.length > 0 ? (
          <View style={{ gap: ruimte.xs }}>
            <Balk
              fractie={(sterkte + 1) / 4}
              hoogte={6}
              kleurVoor={sterkte >= 2 ? kleur.goed : sterkte === 1 ? kleur.goud : kleur.fout}
            />
            <Text style={tekst.klein}>Sterkte: {STERKTE[sterkte]}</Text>
          </View>
        ) : null}

        <Pressable
          testID="nieuwsbrief"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: nieuwsbrief }}
          onPress={() => setNieuwsbrief((v) => !v)}
          style={styles.vinkRij}
        >
          <View style={[styles.vinkVak, nieuwsbrief && styles.vinkVakAan]}>
            {nieuwsbrief ? <Icoon soort="vink" formaat={14} kleur="#FFFFFF" /> : null}
          </View>
          <Text style={[tekst.zacht, { flex: 1 }]}>
            Stuur me af en toe een mail als er nieuwe onderwerpen bij komen. Maximaal een paar keer per jaar.
          </Text>
        </Pressable>

        {fout && !fout.veld ? <Text style={styles.foutMelding}>{fout.melding}</Text> : null}

        <Knop testID="aanmelden" titel="Account aanmaken" onPress={verstuur} bezig={bezig} />
        <Knop titel="Ik heb al een account" soort="kaal" onPress={() => router.replace('/account/inloggen')} />

        <Kaart style={styles.privacy}>
          <Text style={tekst.label}>Wat we bewaren</Text>
          <Text style={tekst.zacht}>
            Je naam, je e-mailadres en of je een abonnement hebt. Meer niet. Over je kind slaan we niets
            op buiten dit toestel: geen achternaam, geen school, geen leeftijd.
          </Text>
          <Text style={tekst.klein}>
            In deze versie staat het account alleen op dit toestel; er is nog geen server aangesloten.
          </Text>
        </Kaart>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Veld({
  label,
  waarde,
  zet,
  placeholder,
  geheim,
  fout,
  testID,
  autoComplete,
  keyboardType,
}: {
  label: string;
  waarde: string;
  zet: (v: string) => void;
  placeholder: string;
  geheim?: boolean;
  fout?: string;
  testID?: string;
  autoComplete?: 'email' | 'password' | 'off';
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={{ gap: ruimte.xs }}>
      <Text style={tekst.label}>{label}</Text>
      <TextInput
        testID={testID}
        value={waarde}
        onChangeText={zet}
        placeholder={placeholder}
        placeholderTextColor={kleur.tekstZacht}
        secureTextEntry={geheim}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        style={[styles.invoer, fout ? styles.invoerFout : null]}
      />
      {fout ? <Text style={styles.foutMelding}>{fout}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  invoer: {
    minHeight: 54,
    borderWidth: 2,
    borderColor: kleur.rand,
    borderRadius: radius.m,
    paddingHorizontal: ruimte.l,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: kleur.tekst,
    backgroundColor: kleur.kaart,
  },
  invoerFout: { borderColor: kleur.foutRand, backgroundColor: kleur.foutZacht },
  foutMelding: { ...tekst.klein, color: kleur.fout },
  vinkRij: { flexDirection: 'row', alignItems: 'flex-start', gap: ruimte.m, paddingVertical: ruimte.s },
  vinkVak: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: kleur.rand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: kleur.kaart,
  },
  vinkVakAan: { backgroundColor: kleur.merk, borderColor: kleur.merk },
  privacy: { backgroundColor: kleur.merkZacht, borderColor: kleur.merkRand, gap: ruimte.xs },
});
