import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GROEPEN, type Groep } from '../src/core/types';
import { AVATARS } from '../src/core/engine/profiel';
import { useApp } from '../src/state/AppContext';
import { Knop } from '../src/ui/components/Knop';
import { kleur, radius, ruimte, tekst } from '../src/ui/thema';

/**
 * Eén scherm, drie keuzes, klaar. Geen account, geen e-mailadres, geen
 * wachtwoord: dat is precies wat ouders bij dit soort apps tegenhoudt.
 */
export default function Welkom() {
  const router = useRouter();
  const { maakProfiel, profielen } = useApp();
  const [naam, setNaam] = useState('');
  const [groep, setGroep] = useState<Groep | null>(null);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [bezig, setBezig] = useState(false);

  const kanVerder = naam.trim().length > 0 && groep !== null;

  async function start() {
    if (!kanVerder || groep === null) return;
    setBezig(true);
    await maakProfiel(naam, groep, avatar);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.scherm}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inhoud} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>🦊</Text>
          <Text style={tekst.titel}>Hoi, ik ben Vos!</Text>
          <Text style={[tekst.body, styles.intro]}>
            {profielen.length > 0
              ? 'Wie komt er nog meer oefenen?'
              : 'Samen oefenen we elke dag een paar minuten. Wie ben jij?'}
          </Text>

          <Text style={[tekst.subkop, styles.label]}>Mijn naam is</Text>
          <TextInput
            value={naam}
            onChangeText={setNaam}
            placeholder="Bijvoorbeeld: Fenna"
            placeholderTextColor={kleur.tekstZacht}
            style={styles.invoer}
            maxLength={20}
            autoCorrect={false}
            returnKeyType="done"
            accessibilityLabel="Vul je naam in"
          />

          <Text style={[tekst.subkop, styles.label]}>Ik zit in</Text>
          <View style={styles.rij}>
            {GROEPEN.map((g) => (
              <Pressable
                key={g}
                accessibilityRole="button"
                accessibilityState={{ selected: groep === g }}
                onPress={() => setGroep(g)}
                style={[styles.groepKnop, groep === g && styles.groepGekozen]}
              >
                <Text style={[styles.groepTekst, groep === g && styles.groepTekstGekozen]}>groep {g}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[tekst.subkop, styles.label]}>Mijn maatje</Text>
          <View style={styles.rij}>
            {AVATARS.slice(0, 6).map((a) => (
              <Pressable
                key={a}
                accessibilityRole="button"
                accessibilityLabel={`Kies avatar ${a}`}
                accessibilityState={{ selected: avatar === a }}
                onPress={() => setAvatar(a)}
                style={[styles.avatar, avatar === a && styles.avatarGekozen]}
              >
                <Text style={styles.avatarTekst}>{a}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={tekst.klein}>Meer maatjes kun je later verdienen met munten.</Text>

          <Knop
            titel="Beginnen"
            emoji="🚀"
            onPress={start}
            uitgeschakeld={!kanVerder}
            bezig={bezig}
            style={{ marginTop: ruimte.xl }}
          />
          <Text style={[tekst.klein, styles.privacy]}>
            Alles blijft op dit toestel. Geen account, geen advertenties, geen gegevens naar buiten.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.achtergrond },
  inhoud: { padding: ruimte.xl, paddingBottom: ruimte.xxl, gap: ruimte.s },
  logo: { fontSize: 60 },
  intro: { marginBottom: ruimte.m },
  label: { marginTop: ruimte.l },
  invoer: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: kleur.rand,
    borderRadius: radius.m,
    paddingHorizontal: ruimte.l,
    fontSize: 18,
    color: kleur.tekst,
    backgroundColor: kleur.kaart,
  },
  rij: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.s },
  groepKnop: {
    paddingHorizontal: ruimte.l,
    height: 52,
    justifyContent: 'center',
    borderRadius: radius.rond,
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
  },
  groepGekozen: { backgroundColor: kleur.primair, borderColor: kleur.primair },
  groepTekst: { fontSize: 16, fontWeight: '700', color: kleur.tekst },
  groepTekstGekozen: { color: '#FFFFFF' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.rond,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
  },
  avatarGekozen: { borderColor: kleur.primair, backgroundColor: kleur.primairZacht },
  avatarTekst: { fontSize: 30 },
  privacy: { marginTop: ruimte.l, textAlign: 'center' },
});
