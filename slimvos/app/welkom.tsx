import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GROEPEN, type Groep } from '../src/core/types';
import { AVATARS } from '../src/core/engine/profiel';
import { WINKEL } from '../src/core/engine/winkel';
import { useApp } from '../src/state/AppContext';
import { Knop } from '../src/ui/components/Knop';
import { Vos } from '../src/ui/Vos';
import { kleur, radius, ruimte, schaduw, tekst } from '../src/ui/thema';

/**
 * Eén scherm, drie keuzes, klaar. Geen account, geen e-mailadres, geen
 * wachtwoord — dat is precies wat ouders bij dit soort apps tegenhoudt. Een
 * account is er wel, maar pas nodig als je wilt betalen of synchroniseren.
 */
export default function Welkom() {
  const router = useRouter();
  const { maakProfiel, profielen, ruimteVoorProfiel } = useApp();
  const [naam, setNaam] = useState('');
  const [groep, setGroep] = useState<Groep | null>(null);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [bezig, setBezig] = useState(false);

  const eersteKeer = profielen.length === 0;
  const kanVerder = naam.trim().length > 0 && groep !== null;

  async function start() {
    if (!kanVerder || groep === null) return;
    setBezig(true);
    const gemaakt = await maakProfiel(naam, groep, avatar);
    setBezig(false);
    router.replace(gemaakt ? '/(tabs)' : '/abonnement');
  }

  return (
    <SafeAreaView style={styles.scherm}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inhoud} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Vos uitdrukking="blij" formaat={112} />
            <Text style={tekst.titel}>{eersteKeer ? 'Hoi, ik ben Vos!' : 'Wie komt erbij?'}</Text>
            <Text style={[tekst.body, styles.intro]}>
              {eersteKeer
                ? 'Samen oefenen we elke dag een paar minuten. Wie ben jij?'
                : 'Vul de naam en groep in, dan maak ik een nieuw profiel aan.'}
            </Text>
          </View>

          {!ruimteVoorProfiel ? (
            <View style={styles.waarschuwing}>
              <Text style={tekst.bodyVet}>Je hebt al een profiel</Text>
              <Text style={tekst.zacht}>
                In de gratis versie kan er één kind oefenen. Met Slimvos Compleet zijn dat er vijf.
              </Text>
            </View>
          ) : null}

          <Text style={[tekst.label, styles.label]}>Mijn naam is</Text>
          <TextInput
            testID="naam-invoer"
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

          <Text style={[tekst.label, styles.label]}>Ik zit in</Text>
          <View style={styles.rij}>
            {GROEPEN.map((g) => {
              const aan = groep === g;
              return (
                <Pressable
                  key={g}
                  accessibilityRole="button"
                  accessibilityState={{ selected: aan }}
                  onPress={() => setGroep(g)}
                  style={[styles.chip, aan && styles.chipAan]}
                >
                  <Text style={[styles.chipTekst, aan && styles.chipTekstAan]}>groep {g}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[tekst.label, styles.label]}>Mijn maatje</Text>
          <View style={styles.rij}>
            {AVATARS.slice(0, 6).map((a) => {
              const aan = avatar === a;
              const item = WINKEL.find((w) => w.id === a);
              return (
                <Pressable
                  key={a}
                  accessibilityRole="button"
                  accessibilityLabel={`Kies ${item?.naam ?? 'maatje'}`}
                  accessibilityState={{ selected: aan }}
                  onPress={() => setAvatar(a)}
                  style={[styles.avatar, aan && styles.avatarAan]}
                >
                  <Text style={styles.avatarTekst}>{a}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={tekst.klein}>Meer maatjes verdien je later met munten.</Text>

          <Knop
            testID="beginnen"
            titel="Beginnen"
            onPress={start}
            uitgeschakeld={!kanVerder}
            bezig={bezig}
            style={{ marginTop: ruimte.xl }}
          />
          <Text style={[tekst.klein, styles.privacy]}>
            Je hoeft niets in te vullen wat we niet nodig hebben. Geen e-mailadres, geen advertenties,
            en de voortgang blijft op dit toestel.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.xl, paddingBottom: ruimte.xxl, gap: ruimte.s },
  hero: { alignItems: 'center', gap: ruimte.xs, marginBottom: ruimte.m },
  intro: { textAlign: 'center' },
  waarschuwing: {
    backgroundColor: kleur.goudZacht,
    borderWidth: 1,
    borderColor: kleur.goudRand,
    borderRadius: radius.m,
    padding: ruimte.l,
    gap: ruimte.xs,
  },
  label: { marginTop: ruimte.l },
  invoer: {
    minHeight: 58,
    borderWidth: 2,
    borderColor: kleur.rand,
    borderRadius: radius.m,
    paddingHorizontal: ruimte.l,
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: kleur.tekst,
    backgroundColor: kleur.kaart,
  },
  rij: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.s },
  chip: {
    paddingHorizontal: ruimte.l,
    height: 50,
    justifyContent: 'center',
    borderRadius: radius.rond,
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
  },
  chipAan: { backgroundColor: kleur.merk, borderColor: kleur.merk },
  chipTekst: { ...tekst.bodyVet, color: kleur.tekst },
  chipTekstAan: { color: '#FFFFFF' },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: radius.rond,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
    ...schaduw.klein,
  },
  avatarAan: { borderColor: kleur.merk, backgroundColor: kleur.merkZacht },
  avatarTekst: { fontSize: 31 },
  privacy: { marginTop: ruimte.l, textAlign: 'center' },
});
