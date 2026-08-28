import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Animated,
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
import { beantwoord, huidigeVraag, resultaat, startSessie, volgende, type Sessie } from '../../src/core/engine/sessie';
import { filmsVoorOnderwerp } from '../../src/core/film/films';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { Confetti } from '../../src/ui/components/Confetti';
import { Balk } from '../../src/ui/components/Voortgang';
import { Vos } from '../../src/ui/Vos';
import { Icoon } from '../../src/ui/VakIcoon';
import { kleur, kleurVoorVak, radius, RAAKVLAK, ruimte, tekst } from '../../src/ui/thema';

type Fase = 'vraag' | 'feedback' | 'klaar';

export default function Oefenen() {
  const { onderwerpId } = useLocalSearchParams<{ onderwerpId: string }>();
  const router = useRouter();
  const { profiel, rondeKlaar, magDitOefenen, premium } = useApp();

  const onderwerp = onderwerpId ? vindOnderwerp(onderwerpId) : undefined;
  const oordeel = onderwerpId ? magDitOefenen(onderwerpId) : { mag: false };
  const startniveau = profiel && onderwerpId ? huidigNiveau(profiel, onderwerpId) : 1;

  const [sessie, setSessie] = useState<Sessie | null>(() =>
    onderwerp && oordeel.mag ? startSessie(onderwerp.id, startniveau) : null,
  );
  const [fase, setFase] = useState<Fase>('vraag');
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [invoer, setInvoer] = useState('');
  const [laatstGoed, setLaatstGoed] = useState(false);
  const [verse, setVerse] = useState<string[]>([]);
  const opslaanBezig = useRef(false);
  const schud = useRef(new Animated.Value(0)).current;

  const vraag = sessie ? huidigeVraag(sessie) : undefined;
  const eindstand = useMemo(() => (sessie && fase === 'klaar' ? resultaat(sessie) : null), [sessie, fase]);
  const kl = kleurVoorVak(onderwerp?.vak ?? 'rekenen');

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
      if (!uitkomst.goed) {
        // Kort schudden bij fout: duidelijk, maar niet bestraffend.
        Animated.sequence([
          Animated.timing(schud, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(schud, { toValue: -1, duration: 60, useNativeDriver: true }),
          Animated.timing(schud, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      }
    },
    [sessie, fase, schud],
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
    if (!magDitOefenen(onderwerp.id).mag) {
      router.replace('/abonnement');
      return;
    }
    opslaanBezig.current = false;
    setSessie(startSessie(onderwerp.id, huidigNiveau(profiel, onderwerp.id)));
    setFase('vraag');
    setGekozen(null);
    setInvoer('');
    setVerse([]);
  }, [onderwerp, profiel, magDitOefenen, router]);

  const terug = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (!onderwerp || !profiel) {
    return (
      <SafeAreaView style={styles.scherm}>
        <View style={styles.leeg}>
          <Text style={tekst.kop}>Dit onderwerp bestaat niet.</Text>
          <Knop titel="Terug" soort="zacht" onPress={terug} style={{ marginTop: ruimte.l }} />
        </View>
      </SafeAreaView>
    );
  }

  // Gratis versie op: geen ronde, maar een eerlijke uitleg.
  if (!oordeel.mag) {
    return (
      <SafeAreaView style={styles.scherm}>
        <View style={styles.leeg}>
          <Vos uitdrukking="troost" formaat={110} />
          <Text style={[tekst.kop, styles.midden]}>Voor vandaag zit het erop</Text>
          <Text style={[tekst.body, styles.midden]}>{oordeel.reden}</Text>
          <Text style={[tekst.zacht, styles.midden]}>Rekenen kun je wel gewoon blijven doen — dat is altijd gratis.</Text>
          <Knop testID="naar-abonnement" titel="Bekijk Slimvos Compleet" onPress={() => router.replace('/abonnement')} style={styles.leegKnop} />
          <Knop titel="Terug" soort="kaal" onPress={terug} />
        </View>
      </SafeAreaView>
    );
  }

  if (!sessie) return null;

  if (fase === 'klaar' && eindstand) {
    const perfect = eindstand.goed === eindstand.aantal && eindstand.aantal > 0;
    const goedBezig = eindstand.procent >= 60;
    const film = filmsVoorOnderwerp(onderwerp.id)[0];
    return (
      <SafeAreaView style={styles.scherm}>
        <Confetti actief={perfect} />
        <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
          <View style={styles.uitslagKop}>
            <Vos uitdrukking={perfect ? 'juich' : goedBezig ? 'blij' : 'troost'} formaat={124} />
            <Text style={tekst.titel}>{perfect ? 'Alles goed!' : goedBezig ? 'Goed gedaan!' : 'Bijna!'}</Text>
            <Text style={tekst.body}>
              {eindstand.goed} van de {eindstand.aantal} goed ({eindstand.procent}%)
            </Text>
          </View>

          {verse.length > 0 ? (
            <Kaart style={styles.badgeKaart}>
              <Text style={tekst.label}>Nieuwe beloning</Text>
              {verse.map((id) => {
                const badge = BADGES.find((b) => b.id === id);
                return badge ? (
                  <Text key={id} style={tekst.bodyVet}>
                    {badge.emoji} {badge.naam} — {badge.omschrijving}
                  </Text>
                ) : null;
              })}
            </Kaart>
          ) : null}

          {eindstand.foutVragen.length > 0 ? (
            <Kaart>
              <Text style={tekst.label}>Nog even bekijken</Text>
              {eindstand.foutVragen.map((v) => (
                <View key={v.id} style={styles.foutRij}>
                  <Text style={tekst.bodyVet}>{v.stam}</Text>
                  <Text style={[tekst.zacht, { color: kleur.goed }]}>Goed: {v.antwoord}</Text>
                  <Text style={tekst.klein}>{v.uitleg}</Text>
                </View>
              ))}
            </Kaart>
          ) : null}

          {!goedBezig && film ? (
            <Kaart onPress={() => router.replace(`/film/${film.id}`)} style={styles.filmKaart} accessibilityLabel={`Filmpje: ${film.titel}`}>
              <Icoon soort="speel" formaat={17} kleur={kleur.slot} />
              <View style={{ flex: 1 }}>
                <Text style={tekst.bodyVet}>Vos legt het uit</Text>
                <Text style={tekst.klein}>{film.titel} · {film.pitch}</Text>
              </View>
            </Kaart>
          ) : null}

          <Knop testID="nog-een-ronde" titel="Nog een ronde" onPress={nogEenRonde} />
          <Knop testID="terug" titel="Klaar voor nu" soort="rand" onPress={terug} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!vraag) return null;
  const antwoordGoed = vraag.antwoord;
  const schudX = schud.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });

  return (
    <SafeAreaView style={styles.scherm}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.balkRij}>
          <Pressable accessibilityRole="button" accessibilityLabel="Stoppen met deze ronde" onPress={terug} hitSlop={14}>
            <Icoon soort="kruis" formaat={19} kleur={kleur.tekstZacht} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Balk fractie={sessie.index / sessie.vragen.length} hoogte={9} kleurVoor={kl.van} />
          </View>
          <Text style={tekst.klein}>
            {sessie.index + 1}/{sessie.vragen.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.inhoud} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={tekst.label}>
            {onderwerp.naam} · niveau {vraag.niveau}
          </Text>

          {vraag.context ? (
            <Kaart style={styles.contextKaart}>
              <Text style={tekst.body}>{vraag.context}</Text>
            </Kaart>
          ) : null}

          <Animated.View style={{ transform: [{ translateX: schudX }] }}>
            <Text style={tekst.vraag}>{vraag.stam}</Text>
          </Animated.View>

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
                    {toon && isJuist ? <Icoon soort="vink" formaat={20} kleur={kleur.goed} /> : null}
                    {toon && isGekozen && !isJuist ? <Icoon soort="kruis" formaat={20} kleur={kleur.fout} /> : null}
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
                style={[styles.invoer, fase === 'feedback' && (laatstGoed ? styles.invoerGoed : styles.invoerFout)]}
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
              <View style={styles.uitlegKop}>
                <Vos uitdrukking={laatstGoed ? 'juich' : 'wijs'} formaat={52} />
                <Text style={[tekst.subkop, { flex: 1, color: laatstGoed ? kleur.goed : kleur.fout }]}>
                  {laatstGoed ? 'Goed!' : `Het goede antwoord is ${antwoordGoed}`}
                </Text>
              </View>
              <Text style={tekst.body}>{vraag.uitleg}</Text>
            </Kaart>
          ) : null}

          {!premium && oordeel.restVandaag !== undefined ? (
            <Text style={[tekst.klein, styles.midden]}>Nog {oordeel.restVandaag} gratis vragen vandaag buiten rekenen.</Text>
          ) : null}
        </ScrollView>

        {fase === 'feedback' ? (
          <View style={styles.voet}>
            <Knop
              testID="volgende"
              titel={sessie.index + 1 >= sessie.vragen.length ? 'Bekijk je score' : 'Volgende'}
              onPress={verder}
              soort={laatstGoed ? 'goed' : 'merk'}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  leeg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ruimte.xl, gap: ruimte.m },
  leegKnop: { alignSelf: 'stretch', marginTop: ruimte.m },
  midden: { textAlign: 'center' },
  balkRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, paddingHorizontal: ruimte.l, paddingTop: ruimte.s },
  inhoud: { padding: ruimte.l, gap: ruimte.l, paddingBottom: ruimte.xxl },
  contextKaart: { backgroundColor: kleur.goudZacht, borderColor: kleur.goudRand },
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
  optieGoed: { borderColor: kleur.goedRand, backgroundColor: kleur.goedZacht },
  optieFout: { borderColor: kleur.foutRand, backgroundColor: kleur.foutZacht },
  optieTekst: { ...tekst.subkop, flex: 1, paddingVertical: ruimte.m },
  invulRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s, alignSelf: 'stretch' },
  eenheid: { ...tekst.titel, color: kleur.tekstZacht },
  invoer: {
    flex: 1,
    // Zonder minWidth groeit een invoerveld in een rij mee met zijn inhoud en
    // loopt het buiten het scherm.
    minWidth: 0,
    minHeight: RAAKVLAK + 8,
    borderWidth: 2,
    borderColor: kleur.rand,
    borderRadius: radius.l,
    paddingHorizontal: ruimte.l,
    fontSize: 24,
    fontFamily: 'Baloo2_700Bold',
    color: kleur.tekst,
    backgroundColor: kleur.kaart,
  },
  invoerGoed: { borderColor: kleur.goedRand, backgroundColor: kleur.goedZacht },
  invoerFout: { borderColor: kleur.foutRand, backgroundColor: kleur.foutZacht },
  uitlegGoed: { backgroundColor: kleur.goedZacht, borderColor: kleur.goedRand, gap: ruimte.s },
  uitlegFout: { backgroundColor: kleur.foutZacht, borderColor: kleur.foutRand, gap: ruimte.s },
  uitlegKop: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  voet: { padding: ruimte.l, borderTopWidth: 1, borderTopColor: kleur.randZacht, backgroundColor: kleur.grond },
  uitslagKop: { alignItems: 'center', gap: ruimte.xs },
  badgeKaart: { backgroundColor: kleur.goudZacht, borderColor: kleur.goudRand, gap: ruimte.xs },
  foutRij: { marginTop: ruimte.m, gap: 3 },
  filmKaart: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, backgroundColor: kleur.slotZacht, borderColor: '#DED3F8' },
});
