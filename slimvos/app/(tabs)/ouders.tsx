import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GROEPEN, type Groep } from '../../src/core/types';
import { onderwerpenVoorGroep, vindOnderwerp, vindVak } from '../../src/core/content/curriculum';
import { scoreProcent } from '../../src/core/engine/beheersing';
import { metBeheersing } from '../../src/core/engine/profiel';
import { dagSleutel } from '../../src/core/engine/punten';
import { useApp } from '../../src/state/AppContext';
import { Balk } from '../../src/ui/components/Balk';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { kleur, radius, ruimte, tekst } from '../../src/ui/thema';

const DAG = 86400000;

export default function Ouders() {
  const router = useRouter();
  const { profiel, profielen, kiesProfiel, werkProfielBij, verwijderAlles } = useApp();
  const [toonInstellingen, setToonInstellingen] = useState(false);

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

  const onderwerpen = onderwerpenVoorGroep(profiel.groep).map((o) => ({
    onderwerp: o,
    b: metBeheersing(profiel, o.id),
  }));
  const geoefend = onderwerpen.filter(({ b }) => b.goed + b.fout >= 5);
  // Een onderwerp staat óf bij "gaat goed" óf bij "aandacht", nooit bij allebei.
  const sterk = [...geoefend]
    .filter(({ b }) => scoreProcent(b) >= 75)
    .sort((a, b) => scoreProcent(b.b) - scoreProcent(a.b))
    .slice(0, 3);
  const aandacht = [...geoefend]
    .filter(({ b }) => scoreProcent(b) < 75)
    .sort((a, b) => scoreProcent(a.b) - scoreProcent(b.b))
    .slice(0, 3);
  const nietGedaan = onderwerpen.filter(({ b }) => b.goed + b.fout === 0);
  const maxWeek = Math.max(10, ...week.map((d) => d.vragen));
  const msDezeWeek = profiel.geschiedenis
    .filter((r) => Date.now() - r.tijd < 7 * DAG)
    .reduce((n, r) => n + r.duurMs, 0);
  const tijdDezeWeek =
    msDezeWeek === 0
      ? 'nog geen oefentijd'
      : msDezeWeek < 60000
        ? 'minder dan een minuut'
        : `ongeveer ${Math.round(msDezeWeek / 60000)} minuten`;

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
      <ScrollView contentContainerStyle={styles.inhoud}>
        <Text style={tekst.titel}>Voor ouders</Text>
        <Text style={tekst.zacht}>
          Een eerlijk beeld van hoe het met {profiel.naam} gaat — zonder verkooppraat.
        </Text>

        <Kaart>
          <Text style={tekst.subkop}>Afgelopen week</Text>
          <Text style={tekst.klein}>
            {week.reduce((n, d) => n + d.vragen, 0)} vragen · {tijdDezeWeek}
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
            <Text style={tekst.subkop}>Gaat goed</Text>
            {sterk.map(({ onderwerp, b }) => (
              <Regel key={onderwerp.id} naam={`${onderwerp.emoji} ${onderwerp.naam}`} procent={scoreProcent(b)} kleurVoor={kleur.goed} />
            ))}
          </Kaart>
        ) : null}

        {aandacht.length > 0 ? (
          <Kaart>
            <Text style={tekst.subkop}>Kan wat oefening gebruiken</Text>
            {aandacht.map(({ onderwerp, b }) => (
              <Regel key={onderwerp.id} naam={`${onderwerp.emoji} ${onderwerp.naam}`} procent={scoreProcent(b)} kleurVoor={kleur.goud} />
            ))}
            <Text style={[tekst.klein, { marginTop: ruimte.s }]}>
              Tip: dit zijn precies de onderwerpen die de app zelf bovenaan zet bij "Ga verder".
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
            <Text style={tekst.subkop}>Nog niet aangeraakt ({nietGedaan.length})</Text>
            <Text style={tekst.klein}>
              {nietGedaan.slice(0, 6).map(({ onderwerp }) => onderwerp.naam).join(', ')}
              {nietGedaan.length > 6 ? ' en meer' : ''}
            </Text>
          </Kaart>
        ) : null}

        <Kaart>
          <Text style={tekst.subkop}>Laatste rondes</Text>
          {profiel.geschiedenis.slice(0, 8).map((r, i) => {
            const onderwerp = vindOnderwerp(r.onderwerpId);
            const vak = onderwerp ? vindVak(onderwerp.vak) : undefined;
            return (
              <View key={`${r.tijd}-${i}`} style={styles.logRij}>
                <View style={[styles.stip, { backgroundColor: vak?.kleur ?? kleur.primair }]} />
                <Text style={[tekst.body, { flex: 1 }]} numberOfLines={1}>
                  {onderwerp?.naam ?? r.onderwerpId}
                </Text>
                <Text style={tekst.zacht}>
                  {r.goed}/{r.aantal}
                  {r.niveauNa > r.niveauVoor ? '  ⬆︎' : r.niveauNa < r.niveauVoor ? '  ⬇︎' : ''}
                </Text>
              </View>
            );
          })}
          {profiel.geschiedenis.length === 0 ? <Text style={tekst.klein}>Nog geen rondes gespeeld.</Text> : null}
        </Kaart>

        <Knop
          titel={toonInstellingen ? 'Instellingen verbergen' : 'Instellingen'}
          soort="rand"
          onPress={() => setToonInstellingen((v) => !v)}
        />

        {toonInstellingen ? (
          <>
            <Kaart>
              <Text style={tekst.subkop}>Dagdoel</Text>
              <Text style={tekst.klein}>Aantal vragen per dag dat als "gehaald" telt.</Text>
              <View style={styles.keuzeRij}>
                {[10, 20, 30, 50].map((n) => (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityState={{ selected: profiel.dagdoel === n }}
                    onPress={() => werkProfielBij({ dagdoel: n })}
                    style={[styles.keuze, profiel.dagdoel === n && styles.keuzeAan]}
                  >
                    <Text style={[styles.keuzeTekst, profiel.dagdoel === n && styles.keuzeTekstAan]}>{n}</Text>
                  </Pressable>
                ))}
              </View>
            </Kaart>

            <Kaart>
              <Text style={tekst.subkop}>Groep</Text>
              <Text style={tekst.klein}>Bepaalt welke onderwerpen en niveaus worden aangeboden.</Text>
              <View style={styles.keuzeRij}>
                {GROEPEN.map((g) => (
                  <Pressable
                    key={g}
                    accessibilityRole="button"
                    accessibilityState={{ selected: profiel.groep === g }}
                    onPress={() => werkProfielBij({ groep: g as Groep })}
                    style={[styles.keuze, profiel.groep === g && styles.keuzeAan]}
                  >
                    <Text style={[styles.keuzeTekst, profiel.groep === g && styles.keuzeTekstAan]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            </Kaart>

            {profielen.length > 1 ? (
              <Kaart>
                <Text style={tekst.subkop}>Wie oefent er?</Text>
                <View style={styles.keuzeRij}>
                  {profielen.map((p) => (
                    <Pressable
                      key={p.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: p.id === profiel.id }}
                      onPress={() => kiesProfiel(p.id)}
                      style={[styles.keuze, p.id === profiel.id && styles.keuzeAan]}
                    >
                      <Text style={[styles.keuzeTekst, p.id === profiel.id && styles.keuzeTekstAan]}>
                        {p.avatar} {p.naam}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Kaart>
            ) : null}

            <Knop titel="Profiel toevoegen" soort="zacht" emoji="➕" onPress={() => router.push('/welkom')} />

            <Kaart>
              <Text style={tekst.subkop}>Privacy</Text>
              <Text style={tekst.body}>
                Alle voortgang staat alleen op dit toestel. Er is geen account, geen tracking, geen
                advertentie en er gaat geen enkel gegeven van uw kind naar een server.
              </Text>
            </Kaart>

            <Knop titel="Alle gegevens wissen" soort="fout" onPress={bevestigWissen} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Regel({ naam, procent, kleurVoor }: { naam: string; procent: number; kleurVoor: string }) {
  return (
    <View style={styles.regel}>
      <View style={styles.regelKop}>
        <Text style={[tekst.body, { flex: 1 }]} numberOfLines={1}>
          {naam}
        </Text>
        <Text style={tekst.zacht}>{procent}%</Text>
      </View>
      <Balk fractie={procent / 100} kleurVoor={kleurVoor} hoogte={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.achtergrond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  grafiek: { flexDirection: 'row', gap: ruimte.s, height: 120, marginTop: ruimte.m, alignItems: 'flex-end' },
  staafKolom: { flex: 1, alignItems: 'center', gap: ruimte.xs },
  staafSpoor: { height: 90, width: '100%', justifyContent: 'flex-end' },
  staaf: { width: '100%', backgroundColor: kleur.primair, borderRadius: radius.s, minHeight: 4 },
  staafLeeg: { backgroundColor: kleur.rand, height: 4 },
  regel: { marginTop: ruimte.s, gap: ruimte.xs },
  regelKop: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  logRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s, marginTop: ruimte.s },
  stip: { width: 10, height: 10, borderRadius: 5 },
  keuzeRij: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.s, marginTop: ruimte.m },
  keuze: {
    minHeight: 48,
    paddingHorizontal: ruimte.l,
    justifyContent: 'center',
    borderRadius: radius.rond,
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
  },
  keuzeAan: { borderColor: kleur.primair, backgroundColor: kleur.primair },
  keuzeTekst: { fontSize: 16, fontWeight: '700', color: kleur.tekst },
  keuzeTekstAan: { color: '#FFFFFF' },
});
