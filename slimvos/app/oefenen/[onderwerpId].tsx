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
import Svg, { Path } from 'react-native-svg';
import { vindOnderwerp } from '../../src/core/content/curriculum';
import { BADGES } from '../../src/core/engine/badges';
import { huidigNiveau } from '../../src/core/engine/profiel';
import { beantwoord, huidigeVraag, resultaat, startSessie, volgende, type Sessie } from '../../src/core/engine/sessie';
import { filmsVoorOnderwerp } from '../../src/core/film/films';
import { sleutel } from '../../src/core/engine/herhalen';
import { useApp } from '../../src/state/AppContext';
import { useVoorlezer, voorleesTekst } from '../../src/ui/voorlezen';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { Confetti } from '../../src/ui/components/Confetti';
import { Balk } from '../../src/ui/components/Voortgang';
import { Vos } from '../../src/ui/Vos';
import { Icoon } from '../../src/ui/VakIcoon';
import { kleur, kleurVoorVak, radius, RAAKVLAK, ruimte, tabelCijfers, tekst } from '../../src/ui/thema';

type Fase = 'vraag' | 'feedback' | 'klaar';

export default function Oefenen() {
  const { onderwerpId } = useLocalSearchParams<{ onderwerpId: string }>();
  const router = useRouter();
  const { profiel, rondeKlaar, magDitOefenen, premium, herhalingenVoor } = useApp();

  const onderwerp = onderwerpId ? vindOnderwerp(onderwerpId) : undefined;
  const oordeel = onderwerpId ? magDitOefenen(onderwerpId) : { mag: false };
  const startniveau = profiel && onderwerpId ? huidigNiveau(profiel, onderwerpId) : 1;

  const [sessie, setSessie] = useState<Sessie | null>(() =>
    onderwerp && oordeel.mag
      ? startSessie(onderwerp.id, startniveau, { herhalingen: herhalingenVoor(onderwerp.id) })
      : null,
  );
  const [fase, setFase] = useState<Fase>('vraag');
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [invoer, setInvoer] = useState('');
  const [laatstGoed, setLaatstGoed] = useState(false);
  const [verse, setVerse] = useState<string[]>([]);
  const opslaanBezig = useRef(false);
  const schud = useRef(new Animated.Value(0)).current;
  const voorlezer = useVoorlezer();

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
    setSessie(
      startSessie(onderwerp.id, huidigNiveau(profiel, onderwerp.id), {
        herhalingen: herhalingenVoor(onderwerp.id),
      }),
    );
    setFase('vraag');
    setGekozen(null);
    setInvoer('');
    setVerse([]);
  }, [onderwerp, profiel, magDitOefenen, router, herhalingenVoor]);

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
    const beheersing = profiel.beheersing[onderwerp.id];
    const gestegen = beheersing && beheersing.niveau > sessie.niveauBijStart;
    const seconden = Math.max(1, Math.round(eindstand.duurMs / 1000));
    const tijd = seconden < 60 ? `${seconden} sec` : `${Math.round(seconden / 60)} min`;

    return (
      <SafeAreaView style={styles.scherm} testID="uitslag">
        <Confetti actief={perfect} />
        <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
          <View style={styles.uitslagKop}>
            <Vos uitdrukking={perfect ? 'juich' : goedBezig ? 'blij' : 'troost'} formaat={118} />
            <Text style={tekst.titel}>{perfect ? 'Alles goed!' : goedBezig ? 'Goed gedaan!' : 'Bijna!'}</Text>
            <Text style={[tekst.body, styles.midden]}>
              {perfect
                ? 'Geen enkele fout. Dat mag gevierd worden.'
                : goedBezig
                  ? 'Je hebt er weer een paar bij geleerd.'
                  : 'Dit onderwerp is nog lastig. Daar komen we vanzelf.'}
            </Text>
          </View>

          {/* De opbrengst van deze ronde in één oogopslag. */}
          <View style={styles.tegels}>
            <Tegel label="Goed" waarde={`${eindstand.goed}/${eindstand.aantal}`} tint={kleur.goed} />
            <Tegel label="Score" waarde={`${eindstand.procent}%`} tint={kleur.merk} />
            <Tegel label="Tijd" waarde={tijd} tint={kleur.slot} />
          </View>

          {gestegen ? (
            <Kaart style={styles.niveauKaart}>
              <Text style={tekst.label}>Niveau omhoog</Text>
              <Text style={tekst.subkop}>
                Van niveau {sessie.niveauBijStart} naar {beheersing.niveau}
              </Text>
              <Text style={tekst.zacht}>De vragen worden vanaf nu een stukje moeilijker.</Text>
            </Kaart>
          ) : null}

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
              <View style={styles.filmSpeel}>
                <Icoon soort="speel" formaat={16} kleur="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={tekst.bodyVet}>Vos legt het uit</Text>
                <Text style={tekst.klein}>{film.titel}</Text>
              </View>
            </Kaart>
          ) : null}
        </ScrollView>

        <View style={styles.voet}>
          <Knop testID="nog-een-ronde" titel="Nog een ronde" onPress={nogEenRonde} />
          <Knop testID="terug" titel="Klaar voor nu" soort="kaal" klein onPress={terug} />
        </View>
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
          <View style={styles.kopRij}>
            <Text style={tekst.label}>
              {onderwerp.naam} · niveau {vraag.niveau}
            </Text>
            {sessie.herhaalSleutels.includes(sleutel(vraag)) ? (
              <View style={styles.herhaalLint}>
                <Text style={styles.herhaalTekst}>Herhaling</Text>
              </View>
            ) : null}
          </View>

          {vraag.context ? (
            <Kaart style={styles.contextKaart}>
              <Text style={tekst.body}>{vraag.context}</Text>
            </Kaart>
          ) : null}

          <Animated.View style={[styles.vraagRij, { transform: [{ translateX: schudX }] }]}>
            <Text style={[tekst.vraag, { flex: 1 }]}>{vraag.stam}</Text>
            <Pressable
              testID="voorlezen"
              accessibilityRole="button"
              accessibilityLabel={voorlezer.leestVoor ? 'Stop met voorlezen' : 'Lees de vraag voor'}
              onPress={() =>
                voorlezer.leestVoor
                  ? voorlezer.stop()
                  : voorlezer.lees(voorleesTekst(vraag.stam, vraag.context))
              }
              hitSlop={10}
              style={[styles.luidspreker, voorlezer.leestVoor && styles.luidsprekerAan]}
            >
              <Luidspreker actief={voorlezer.leestVoor} />
            </Pressable>
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

function Luidspreker({ actief }: { actief: boolean }) {
  const c = actief ? kleur.merkDieper : kleur.tekstZacht;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" fill={c} />
      <Path
        d="M15.5 9 C16.8 10.2 16.8 13.8 15.5 15"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {actief ? (
        <Path d="M18.3 6.6 C20.6 8.8 20.6 15.2 18.3 17.4" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
      ) : null}
    </Svg>
  );
}

function Tegel({ label, waarde, tint }: { label: string; waarde: string; tint: string }) {
  return (
    <View style={[styles.tegel, { borderColor: `${tint}44`, backgroundColor: `${tint}12` }]}>
      <Text style={[tekst.label, { color: tint }]}>{label}</Text>
      <Text style={[tekst.cijfer, tabelCijfers, { color: tint }]}>{waarde}</Text>
    </View>
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
  kopRij: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ruimte.s },
  herhaalLint: {
    backgroundColor: kleur.slotZacht,
    borderWidth: 1,
    borderColor: '#DED3F8',
    borderRadius: radius.rond,
    paddingHorizontal: ruimte.m,
    paddingVertical: 3,
  },
  herhaalTekst: { ...tekst.label, color: kleur.slot },
  vraagRij: { flexDirection: 'row', alignItems: 'flex-start', gap: ruimte.m },
  luidspreker: {
    width: 44,
    height: 44,
    borderRadius: radius.rond,
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  luidsprekerAan: { borderColor: kleur.merk, backgroundColor: kleur.merkZacht },
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
  voet: { padding: ruimte.l, gap: ruimte.s, borderTopWidth: 1, borderTopColor: kleur.randZacht, backgroundColor: kleur.grond },
  uitslagKop: { alignItems: 'center', gap: ruimte.xs },
  tegels: { flexDirection: 'row', gap: ruimte.m },
  tegel: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: ruimte.m,
    borderRadius: radius.m,
    borderWidth: 1.5,
  },
  niveauKaart: { backgroundColor: kleur.slotZacht, borderColor: '#DED3F8', gap: ruimte.xs },
  filmSpeel: {
    width: 38,
    height: 38,
    borderRadius: radius.rond,
    backgroundColor: kleur.slot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeKaart: { backgroundColor: kleur.goudZacht, borderColor: kleur.goudRand, gap: ruimte.xs },
  foutRij: { marginTop: ruimte.m, gap: 3 },
  filmKaart: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, backgroundColor: kleur.slotZacht, borderColor: '#DED3F8' },
});
