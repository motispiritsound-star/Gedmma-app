import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vindOnderwerp } from '../../src/core/content/curriculum';
import { BADGES } from '../../src/core/engine/badges';
import { huidigNiveau } from '../../src/core/engine/profiel';
import {
  beantwoord,
  huidigeVraag,
  resultaat,
  startSessie,
  volgende,
  type Sessie,
} from '../../src/core/engine/sessie';
import { useApp } from '../../src/state/AppContext';
import { Balk } from '../../src/ui/components/Balk';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { kleur, radius, RAAKVLAK, ruimte, tekst } from '../../src/ui/thema';

type Fase = 'vraag' | 'feedback' | 'klaar';

export default function Oefenen() {
  const { onderwerpId } = useLocalSearchParams<{ onderwerpId: string }>();
  const router = useRouter();
  const { profiel, rondeKlaar } = useApp();

  const onderwerp = onderwerpId ? vindOnderwerp(onderwerpId) : undefined;
  const startniveau = profiel && onderwerpId ? huidigNiveau(profiel, onderwerpId) : 1;

  const [sessie, setSessie] = useState<Sessie | null>(() =>
    onderwerp ? startSessie(onderwerp.id, startniveau) : null,
  );
  const [fase, setFase] = useState<Fase>('vraag');
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [invoer, setInvoer] = useState('');
  const [laatstGoed, setLaatstGoed] = useState(false);
  const [verse, setVerse] = useState<string[]>([]);
  const opslaanBezig = useRef(false);

  const vraag = sessie ? huidigeVraag(sessie) : undefined;
  const eindstand = useMemo(() => (sessie && fase === 'klaar' ? resultaat(sessie) : null), [sessie, fase]);

  const controleer = useCallback(
    (gegeven: string) => {
      if (!sessie || fase !== 'vraag' || gegeven.trim() === '') return;
      const uitkomst = beantwoord(sessie, gegeven);
      setSessie(uitkomst.sessie);
      setGekozen(gegeven);
      setLaatstGoed(uitkomst.goed);
      setFase('feedback');
      Haptics.notificationAsync(
        uitkomst.goed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    },
    [sessie, fase],
  );

  const verder = useCallback(async () => {
    if (!sessie) return;
    const volgend = volgende(sessie);
    setSessie(volgend);
    setGekozen(null);
    setInvoer('');
    if (volgend.status === 'klaar') {
      setFase('klaar');
      if (!opslaanBezig.current) {
        opslaanBezig.current = true;
        const { nieuweBadges } = await rondeKlaar(volgend);
        setVerse(nieuweBadges);
      }
    } else {
      setFase('vraag');
    }
  }, [sessie, rondeKlaar]);

  const nogEenRonde = useCallback(() => {
    if (!onderwerp || !profiel) return;
    opslaanBezig.current = false;
    setSessie(startSessie(onderwerp.id, huidigNiveau(profiel, onderwerp.id)));
    setFase('vraag');
    setGekozen(null);
    setInvoer('');
    setVerse([]);
  }, [onderwerp, profiel]);

  if (!onderwerp || !sessie || !profiel) {
    return (
      <SafeAreaView style={styles.scherm}>
        <View style={styles.leeg}>
          <Text style={tekst.kop}>Dit onderwerp bestaat niet.</Text>
          <Knop titel="Terug" onPress={() => router.back()} soort="zacht" style={{ marginTop: ruimte.l }} />
        </View>
      </SafeAreaView>
    );
  }

  if (fase === 'klaar' && eindstand) {
    const perfect = eindstand.goed === eindstand.aantal;
    return (
      <SafeAreaView style={styles.scherm}>
        <ScrollView contentContainerStyle={styles.inhoud}>
          <Text style={styles.grootEmoji}>{perfect ? '🏆' : eindstand.procent >= 60 ? '🎉' : '💪'}</Text>
          <Text style={tekst.titel}>
            {perfect ? 'Alles goed!' : eindstand.procent >= 60 ? 'Goed gedaan!' : 'Bijna!'}
          </Text>
          <Text style={tekst.body}>
            {eindstand.goed} van de {eindstand.aantal} goed ({eindstand.procent}%)
          </Text>

          {verse.length > 0 ? (
            <Kaart style={styles.badgeKaart}>
              <Text style={tekst.subkop}>Nieuwe beloning!</Text>
              {verse.map((id) => {
                const badge = BADGES.find((b) => b.id === id);
                return badge ? (
                  <Text key={id} style={tekst.body}>
                    {badge.emoji} {badge.naam} — {badge.omschrijving}
                  </Text>
                ) : null;
              })}
            </Kaart>
          ) : null}

          {eindstand.foutVragen.length > 0 ? (
            <Kaart>
              <Text style={tekst.subkop}>Nog even bekijken</Text>
              {eindstand.foutVragen.map((v) => (
                <View key={v.id} style={styles.foutRij}>
                  <Text style={tekst.body}>{v.stam}</Text>
                  <Text style={[tekst.zacht, { color: kleur.goed }]}>Goed: {v.antwoord}</Text>
                  <Text style={tekst.klein}>{v.uitleg}</Text>
                </View>
              ))}
            </Kaart>
          ) : null}

          <Knop titel="Nog een ronde" emoji="🔁" onPress={nogEenRonde} />
          <Knop
            testID="terug"
            titel="Klaar voor nu"
            soort="rand"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!vraag) return null;

  const antwoordGoed = vraag.antwoord;

  return (
    <SafeAreaView style={styles.scherm}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.balkRij}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stoppen met deze ronde"
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Text style={styles.sluit}>✕</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Balk fractie={sessie.index / sessie.vragen.length} hoogte={10} />
          </View>
          <Text style={tekst.klein}>
            {sessie.index + 1}/{sessie.vragen.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.inhoud} keyboardShouldPersistTaps="handled">
          <Text style={tekst.klein}>
            {onderwerp.emoji} {onderwerp.naam} · niveau {vraag.niveau}
          </Text>

          {vraag.context ? (
            <Kaart style={styles.contextKaart}>
              <Text style={tekst.body}>{vraag.context}</Text>
            </Kaart>
          ) : null}

          <Text style={styles.stam}>{vraag.stam}</Text>

          {vraag.type === 'keuze' ? (
            <View style={{ gap: ruimte.m }}>
              {(vraag.opties ?? []).map((optie, index) => {
                const isGekozen = gekozen === optie;
                const isJuist = optie === antwoordGoed;
                const toon = fase === 'feedback';
                return (
                  <Pressable
                    key={optie}
                    testID={`optie-${index}`}
                    accessibilityRole="button"
                    accessibilityLabel={optie}
                    disabled={fase !== 'vraag'}
                    onPress={() => controleer(optie)}
                    style={[
                      styles.optie,
                      toon && isJuist && styles.optieGoed,
                      toon && isGekozen && !isJuist && styles.optieFout,
                    ]}
                  >
                    <Text style={styles.optieTekst}>{optie}</Text>
                    {toon && isJuist ? <Text style={styles.vink}>✓</Text> : null}
                    {toon && isGekozen && !isJuist ? <Text style={styles.kruis}>✕</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.invulRij}>
              {vraag.eenheid ? <Text style={styles.eenheid}>{vraag.eenheid}</Text> : null}
              <TextInput
                testID="antwoord-invoer"
                value={invoer}
                onChangeText={setInvoer}
                editable={fase === 'vraag'}
                placeholder="Jouw antwoord"
                placeholderTextColor={kleur.tekstZacht}
                keyboardType={/^[\d.,:\s]+$/.test(vraag.antwoord) ? 'numbers-and-punctuation' : 'default'}
                style={[
                  styles.invoer,
                  fase === 'feedback' && (laatstGoed ? styles.invoerGoed : styles.invoerFout),
                ]}
                onSubmitEditing={() => controleer(invoer)}
                returnKeyType="done"
                accessibilityLabel="Typ je antwoord"
              />
            </View>
          )}

          {fase === 'vraag' && vraag.type === 'invul' ? (
            <Knop testID="controleer" titel="Controleer" onPress={() => controleer(invoer)} uitgeschakeld={invoer.trim() === ''} />
          ) : null}

          {fase === 'feedback' ? (
            <Kaart style={laatstGoed ? styles.uitlegGoed : styles.uitlegFout}>
              <Text style={styles.uitlegKop}>
                {laatstGoed ? '✅ Goed!' : `❌ Het goede antwoord is ${antwoordGoed}`}
              </Text>
              <Text style={tekst.body}>{vraag.uitleg}</Text>
            </Kaart>
          ) : null}
        </ScrollView>

        {fase === 'feedback' ? (
          <View style={styles.voet}>
            <Knop
              testID="volgende"
              titel={sessie.index + 1 >= sessie.vragen.length ? 'Bekijk je score' : 'Volgende'}
              onPress={verder}
              soort={laatstGoed ? 'goed' : 'primair'}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.achtergrond },
  leeg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ruimte.xl },
  balkRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, paddingHorizontal: ruimte.l, paddingTop: ruimte.s },
  sluit: { fontSize: 22, color: kleur.tekstZacht, paddingHorizontal: ruimte.xs },
  inhoud: { padding: ruimte.l, gap: ruimte.l, paddingBottom: ruimte.xxl },
  contextKaart: { backgroundColor: kleur.goudZacht, borderColor: kleur.goud },
  stam: { fontSize: 24, fontWeight: '700', lineHeight: 32, color: kleur.tekst },
  optie: {
    minHeight: RAAKVLAK + 8,
    borderRadius: radius.l,
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
    paddingHorizontal: ruimte.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ruimte.s,
  },
  optieGoed: { borderColor: kleur.goed, backgroundColor: kleur.goedZacht },
  optieFout: { borderColor: kleur.fout, backgroundColor: kleur.foutZacht },
  optieTekst: { fontSize: 19, fontWeight: '600', color: kleur.tekst, flex: 1, paddingVertical: ruimte.m },
  vink: { fontSize: 22, color: kleur.goed, fontWeight: '800' },
  kruis: { fontSize: 22, color: kleur.fout, fontWeight: '800' },
  invulRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  eenheid: { fontSize: 24, fontWeight: '700', color: kleur.tekstZacht },
  invoer: {
    flex: 1,
    minHeight: RAAKVLAK + 8,
    borderWidth: 2,
    borderColor: kleur.rand,
    borderRadius: radius.l,
    paddingHorizontal: ruimte.l,
    fontSize: 24,
    fontWeight: '700',
    color: kleur.tekst,
    backgroundColor: kleur.kaart,
  },
  invoerGoed: { borderColor: kleur.goed, backgroundColor: kleur.goedZacht },
  invoerFout: { borderColor: kleur.fout, backgroundColor: kleur.foutZacht },
  uitlegGoed: { backgroundColor: kleur.goedZacht, borderColor: kleur.goed },
  uitlegFout: { backgroundColor: kleur.foutZacht, borderColor: kleur.fout },
  uitlegKop: { fontSize: 18, fontWeight: '800', color: kleur.tekst, marginBottom: ruimte.xs },
  voet: { padding: ruimte.l, borderTopWidth: 1, borderTopColor: kleur.rand, backgroundColor: kleur.achtergrond },
  grootEmoji: { fontSize: 72, textAlign: 'center' },
  badgeKaart: { backgroundColor: kleur.goudZacht, borderColor: kleur.goud, gap: ruimte.xs },
  foutRij: { marginTop: ruimte.m, gap: 2 },
});
