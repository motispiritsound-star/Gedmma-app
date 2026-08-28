import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GROEPEN, type Groep } from '../../src/core/types';
import { onderwerpenVoorGroep, vindOnderwerp, vindVak } from '../../src/core/content/curriculum';
import { scoreProcent } from '../../src/core/engine/beheersing';
import { metBeheersing } from '../../src/core/engine/profiel';
import { dagSleutel } from '../../src/core/engine/punten';
import { maakOuderslotVraag } from '../../src/core/account/ouderslot';
import { euro, vindPlan } from '../../src/core/abonnement/plannen';
import { dagenResterend, datumInWoorden, volgendeAfschrijving } from '../../src/core/abonnement/toegang';
import { openBeheer } from '../../src/state/aankoop';
import { maakRng } from '../../src/core/rng';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { Balk } from '../../src/ui/components/Voortgang';
import { Vos } from '../../src/ui/Vos';
import { kleur, kleurVoorVak, radius, ruimte, tabelCijfers, tekst } from '../../src/ui/thema';

const DAG = 86400000;

export default function Ouders() {
  const router = useRouter();
  const {
    profiel, profielen, ouder, abonnement, premium,
    kiesProfiel, werkProfielBij, verwijderProfiel, verwijderAlles,
    logUit, verwijderAccount, ruimteVoorProfiel,
  } = useApp();

  const [ontgrendeld, setOntgrendeld] = useState(false);
  const [slotVraag] = useState(() => maakOuderslotVraag(maakRng(Date.now() % 100000)));
  const [slotFout, setSlotFout] = useState(false);

  const week = useMemo(() => {
    if (!profiel) return [];
    const nu = Date.now();
    return Array.from({ length: 7 }, (_, i) => {
      const datum = new Date(nu - (6 - i) * DAG);
      const sleutel = dagSleutel(datum);
      const vragen = profiel.geschiedenis
        .filter((r) => dagSleutel(new Date(r.tijd)) === sleutel)
        .reduce((n, r) => n + r.aantal, 0);
      return { sleutel, dag: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'][datum.getDay()], vragen };
    });
  }, [profiel]);

  if (!profiel) return null;

  // Ouderslot: houdt jonge kinderen uit de instellingen en het abonnement.
  if (!ontgrendeld) {
    return (
      <SafeAreaView style={styles.scherm} edges={['top']}>
        <View style={styles.slot}>
          <Vos uitdrukking="wijs" formaat={104} />
          <Text style={tekst.kop}>Even voor de ouders</Text>
          <Text style={[tekst.body, styles.midden]}>{slotVraag.stam}</Text>
          <View style={styles.slotRij}>
            {slotVraag.opties.map((optie) => (
              <Pressable
                key={optie}
                testID={`slot-${optie}`}
                accessibilityRole="button"
                accessibilityLabel={String(optie)}
                onPress={() => (optie === slotVraag.antwoord ? setOntgrendeld(true) : setSlotFout(true))}
                style={styles.slotKnop}
              >
                <Text style={[tekst.subkop, tabelCijfers]}>{optie}</Text>
              </Pressable>
            ))}
          </View>
          {slotFout ? <Text style={[tekst.klein, { color: kleur.fout }]}>Dat klopt niet. Probeer nog eens.</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  const onderwerpen = onderwerpenVoorGroep(profiel.groep).map((o) => ({ onderwerp: o, b: metBeheersing(profiel, o.id) }));
  const geoefend = onderwerpen.filter(({ b }) => b.goed + b.fout >= 5);
  const sterk = [...geoefend].filter(({ b }) => scoreProcent(b) >= 75).sort((a, b) => scoreProcent(b.b) - scoreProcent(a.b)).slice(0, 3);
  const aandacht = [...geoefend].filter(({ b }) => scoreProcent(b) < 75).sort((a, b) => scoreProcent(a.b) - scoreProcent(b.b)).slice(0, 3);
  const nietGedaan = onderwerpen.filter(({ b }) => b.goed + b.fout === 0);
  const maxWeek = Math.max(10, ...week.map((d) => d.vragen));
  const msWeek = profiel.geschiedenis.filter((r) => Date.now() - r.tijd < 7 * DAG).reduce((n, r) => n + r.duurMs, 0);
  const tijdWeek =
    msWeek === 0 ? 'nog geen oefentijd' : msWeek < 60000 ? 'minder dan een minuut' : `ongeveer ${Math.round(msWeek / 60000)} minuten`;
  const resterend = dagenResterend(abonnement);
  const volgende = volgendeAfschrijving(abonnement);

  function bevestigWissen() {
    Alert.alert(
      'Alle gegevens wissen?',
      'Alle profielen en voortgang op dit toestel worden verwijderd. Dit kan niet ongedaan gemaakt worden.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Wissen',
          style: 'destructive',
          onPress: async () => {
            await verwijderAlles();
            router.replace('/welkom');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
        <Text style={tekst.titel}>Voor ouders</Text>
        <Text style={tekst.zacht}>Een eerlijk beeld van hoe het met {profiel.naam} gaat — zonder verkooppraat.</Text>

        <Kaart hoogte="midden">
          <Text style={tekst.label}>Afgelopen week</Text>
          <Text style={tekst.subkop}>
            {week.reduce((n, d) => n + d.vragen, 0)} vragen · {tijdWeek}
          </Text>
          <View style={styles.grafiek}>
            {week.map((d) => (
              <View key={d.sleutel} style={styles.staafKolom}>
                <View style={styles.staafSpoor}>
                  <View
                    style={[
                      styles.staaf,
                      { height: `${Math.round((d.vragen / maxWeek) * 100)}%` },
                      d.vragen === 0 && styles.staafLeeg,
                    ]}
                  />
                </View>
                <Text style={tekst.klein}>{d.dag}</Text>
              </View>
            ))}
          </View>
        </Kaart>

        {sterk.length > 0 ? (
          <Kaart>
            <Text style={tekst.label}>Gaat goed</Text>
            {sterk.map(({ onderwerp, b }) => (
              <Regel key={onderwerp.id} naam={onderwerp.naam} vak={onderwerp.vak} procent={scoreProcent(b)} />
            ))}
          </Kaart>
        ) : null}

        {aandacht.length > 0 ? (
          <Kaart>
            <Text style={tekst.label}>Kan wat oefening gebruiken</Text>
            {aandacht.map(({ onderwerp, b }) => (
              <Regel key={onderwerp.id} naam={onderwerp.naam} vak={onderwerp.vak} procent={scoreProcent(b)} />
            ))}
            <Text style={[tekst.klein, { marginTop: ruimte.s }]}>
              Dit zijn precies de onderwerpen die de app zelf bovenaan zet bij "Ga verder".
            </Text>
          </Kaart>
        ) : null}

        {geoefend.length === 0 ? (
          <Kaart>
            <Text style={tekst.body}>
              Er is nog te weinig geoefend om iets zinnigs te zeggen. Na ongeveer vijf rondes staat hier
              per onderwerp hoe het gaat.
            </Text>
          </Kaart>
        ) : null}

        {nietGedaan.length > 0 ? (
          <Kaart>
            <Text style={tekst.label}>Nog niet aangeraakt ({nietGedaan.length})</Text>
            <Text style={tekst.klein}>
              {nietGedaan.slice(0, 6).map(({ onderwerp }) => onderwerp.naam).join(', ')}
              {nietGedaan.length > 6 ? ' en meer' : ''}
            </Text>
          </Kaart>
        ) : null}

        <Kaart>
          <Text style={tekst.label}>Laatste rondes</Text>
          {profiel.geschiedenis.slice(0, 8).map((r, i) => {
            const onderwerp = vindOnderwerp(r.onderwerpId);
            const vak = onderwerp ? vindVak(onderwerp.vak) : undefined;
            return (
              <View key={`${r.tijd}-${i}`} style={styles.logRij}>
                <View style={[styles.stip, { backgroundColor: vak ? kleurVoorVak(vak.id).van : kleur.merk }]} />
                <Text style={[tekst.body, { flex: 1 }]} numberOfLines={1}>
                  {onderwerp?.naam ?? r.onderwerpId}
                </Text>
                <Text style={[tekst.zacht, tabelCijfers]}>
                  {r.goed}/{r.aantal}
                  {r.niveauNa > r.niveauVoor ? '  ↑' : r.niveauNa < r.niveauVoor ? '  ↓' : ''}
                </Text>
              </View>
            );
          })}
          {profiel.geschiedenis.length === 0 ? <Text style={tekst.klein}>Nog geen rondes gespeeld.</Text> : null}
        </Kaart>

        <Text style={[tekst.kop, { marginTop: ruimte.m }]}>Account</Text>
        {ouder ? (
          <Kaart>
            <Text style={tekst.label}>Ingelogd als</Text>
            <Text style={tekst.subkop}>{ouder.naam}</Text>
            <Text style={tekst.zacht}>{ouder.email}</Text>
            <Knop titel="Uitloggen" soort="rand" klein onPress={logUit} style={{ marginTop: ruimte.m }} />
            <Knop
              titel="Account verwijderen"
              soort="kaal"
              klein
              onPress={() =>
                Alert.alert('Account verwijderen?', 'Je abonnementsgegevens verdwijnen. De voortgang van je kind blijft op dit toestel staan.', [
                  { text: 'Annuleren', style: 'cancel' },
                  { text: 'Verwijderen', style: 'destructive', onPress: verwijderAccount },
                ])
              }
            />
          </Kaart>
        ) : (
          <Kaart>
            <Text style={tekst.body}>
              Je oefent nu zonder account. Dat mag, en het blijft ook mogelijk. Een account heb je alleen
              nodig voor een abonnement.
            </Text>
            <Knop testID="naar-aanmelden" titel="Account aanmaken" onPress={() => router.push('/account/aanmelden')} style={{ marginTop: ruimte.m }} />
            <Knop titel="Ik heb al een account" soort="kaal" klein onPress={() => router.push('/account/inloggen')} />
          </Kaart>
        )}

        <Kaart style={premium ? styles.premium : undefined}>
          <Text style={tekst.label}>Abonnement</Text>
          <Text style={tekst.subkop}>
            {premium ? vindPlan(abonnement.plan).naam : 'Gratis versie'}
            {abonnement.status === 'proef' ? ' · proefperiode' : ''}
          </Text>
          <Text style={tekst.zacht}>
            {premium
              ? volgende
                ? `${volgende.isEersteKeer ? 'Eerste afschrijving' : 'Volgende afschrijving'} op ${datumInWoorden(volgende.op)}: ${euro(vindPlan(volgende.plan).centen)}.`
                : resterend !== null
                  ? `Nog ${resterend} dagen toegang, daarna stopt het vanzelf.`
                  : 'Actief.'
              : `Rekenen onbeperkt, en 10 vragen per dag in de andere vakken. Eerste week gratis, daarna ${euro(vindPlan('maand').centen)} per maand.`}
          </Text>
          <Knop
            testID="naar-abonnement"
            titel={premium ? 'Abonnement bekijken' : 'Begin met een week gratis'}
            soort={premium ? 'rand' : 'merk'}
            onPress={() => router.push('/abonnement')}
            style={{ marginTop: ruimte.m }}
          />
          {premium ? (
            <Knop
              titel="Opzeggen of wijzigen in de winkel"
              soort="kaal"
              klein
              onPress={async () => {
                if (!(await openBeheer())) {
                  Alert.alert('Beheren', 'Open de instellingen van je telefoon en ga naar Abonnementen.');
                }
              }}
            />
          ) : null}
        </Kaart>

        <Text style={[tekst.kop, { marginTop: ruimte.m }]}>Instellingen</Text>

        <Kaart>
          <Text style={tekst.label}>Dagdoel</Text>
          <Text style={tekst.klein}>Aantal vragen per dag dat als gehaald telt.</Text>
          <View style={styles.keuzeRij}>
            {[10, 20, 30, 50].map((n) => (
              <Chip key={n} label={String(n)} aan={profiel.dagdoel === n} onPress={() => werkProfielBij({ dagdoel: n })} />
            ))}
          </View>
        </Kaart>

        <Kaart>
          <Text style={tekst.label}>Groep</Text>
          <Text style={tekst.klein}>Bepaalt welke onderwerpen en niveaus worden aangeboden.</Text>
          <View style={styles.keuzeRij}>
            {GROEPEN.map((g) => (
              <Chip key={g} label={String(g)} aan={profiel.groep === g} onPress={() => werkProfielBij({ groep: g as Groep })} />
            ))}
          </View>
        </Kaart>

        <Kaart>
          <Text style={tekst.label}>Kinderen ({profielen.length})</Text>
          <View style={styles.keuzeRij}>
            {profielen.map((p) => (
              <Chip key={p.id} label={`${p.avatar} ${p.naam}`} aan={p.id === profiel.id} onPress={() => kiesProfiel(p.id)} />
            ))}
          </View>
          <Knop
            testID="profiel-toevoegen"
            titel={ruimteVoorProfiel ? 'Kind toevoegen' : 'Meer kinderen met Compleet'}
            soort="zacht"
            klein
            onPress={() => router.push(ruimteVoorProfiel ? '/welkom' : '/abonnement')}
            style={{ marginTop: ruimte.m }}
          />
          {profielen.length > 1 ? (
            <Knop
              titel={`Profiel van ${profiel.naam} verwijderen`}
              soort="kaal"
              klein
              onPress={() =>
                Alert.alert(`Profiel van ${profiel.naam} verwijderen?`, 'De voortgang van dit kind gaat verloren.', [
                  { text: 'Annuleren', style: 'cancel' },
                  { text: 'Verwijderen', style: 'destructive', onPress: () => verwijderProfiel(profiel.id) },
                ])
              }
            />
          ) : null}
        </Kaart>

        <Kaart style={styles.privacy}>
          <Text style={tekst.label}>Privacy</Text>
          <Text style={tekst.body}>
            De voortgang van uw kind staat alleen op dit toestel. Er is geen tracking, geen advertentie,
            en er gaat geen enkel gegeven over uw kind naar buiten. Van u bewaren we alleen naam,
            e-mailadres en abonnementsstatus, en alleen als u een account aanmaakt.
          </Text>
        </Kaart>

        <Knop titel="Alle gegevens wissen" soort="fout" onPress={bevestigWissen} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, aan, onPress }: { label: string; aan: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aan }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, aan && styles.chipAan]}
    >
      <Text style={[tekst.bodyVet, aan && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

function Regel({ naam, vak, procent }: { naam: string; vak: string; procent: number }) {
  return (
    <View style={styles.regel}>
      <View style={styles.regelKop}>
        <Text style={[tekst.body, { flex: 1 }]} numberOfLines={1}>
          {naam}
        </Text>
        <Text style={[tekst.zacht, tabelCijfers]}>{procent}%</Text>
      </View>
      <Balk fractie={procent / 100} kleurVoor={kleurVoorVak(vak).van} hoogte={7} stil />
    </View>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  midden: { textAlign: 'center' },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ruimte.xl, gap: ruimte.m },
  slotRij: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.m, justifyContent: 'center' },
  slotKnop: {
    minWidth: 84,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.m,
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
  },
  grafiek: { flexDirection: 'row', gap: ruimte.s, height: 116, marginTop: ruimte.m, alignItems: 'flex-end' },
  staafKolom: { flex: 1, alignItems: 'center', gap: ruimte.xs },
  staafSpoor: { height: 88, width: '100%', justifyContent: 'flex-end' },
  staaf: { width: '100%', backgroundColor: kleur.merk, borderRadius: radius.s, minHeight: 4 },
  staafLeeg: { backgroundColor: kleur.grondDiep, height: 4 },
  regel: { marginTop: ruimte.s, gap: ruimte.xs },
  regelKop: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  logRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s, marginTop: ruimte.s },
  stip: { width: 10, height: 10, borderRadius: 5 },
  keuzeRij: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.s, marginTop: ruimte.m },
  chip: {
    minHeight: 46,
    paddingHorizontal: ruimte.l,
    justifyContent: 'center',
    borderRadius: radius.rond,
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
  },
  chipAan: { borderColor: kleur.merk, backgroundColor: kleur.merk },
  premium: { backgroundColor: kleur.goedZacht, borderColor: kleur.goedRand },
  privacy: { backgroundColor: kleur.merkZacht, borderColor: kleur.merkRand },
});
