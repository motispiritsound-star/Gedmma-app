import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VakId } from '../../src/core/types';
import { onderwerpenVoorVak, vindVak } from '../../src/core/content/curriculum';
import { scoreProcent } from '../../src/core/engine/beheersing';
import { metBeheersing } from '../../src/core/engine/profiel';
import { filmsVoorOnderwerp } from '../../src/core/film/films';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Balk, Sterren } from '../../src/ui/components/Voortgang';
import { Icoon, VakIcoon } from '../../src/ui/VakIcoon';
import { kleur, kleurVoorVak, radius, ruimte, schaduw, tekst } from '../../src/ui/thema';

export default function VakScherm() {
  const { vakId } = useLocalSearchParams<{ vakId: string }>();
  const router = useRouter();
  const { profiel, magDitOefenen } = useApp();
  const vak = vakId ? vindVak(vakId as VakId) : undefined;

  if (!vak || !profiel) return null;
  const onderwerpen = onderwerpenVoorVak(vak.id, profiel.groep);
  const kl = kleurVoorVak(vak.id);

  return (
    <SafeAreaView style={styles.scherm} edges={['bottom']}>
      <Stack.Screen options={{ title: vak.naam }} />
      <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
        <View style={styles.heroRaam}>
          <LinearGradient colors={[kl.van, kl.tot]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroIcoon}>
              <VakIcoon vak={vak.id} formaat={34} kleurOverschrijving="#FFFFFF" />
            </View>
            <Text style={styles.heroTitel}>{vak.naam}</Text>
            <Text style={styles.heroTekst}>{vak.omschrijving}</Text>
          </LinearGradient>
        </View>

        {onderwerpen.map((onderwerp) => {
          const b = metBeheersing(profiel, onderwerp.id);
          const beurten = b.goed + b.fout;
          const oordeel = magDitOefenen(onderwerp.id);
          const films = filmsVoorOnderwerp(onderwerp.id);
          return (
            <Kaart
              key={onderwerp.id}
              onPress={() => router.push(oordeel.mag ? `/oefenen/${onderwerp.id}` : '/abonnement')}
              accessibilityLabel={`${onderwerp.naam}, niveau ${b.niveau} van 5${oordeel.mag ? '' : ', op slot'}`}
              style={styles.kaart}
            >
              <View style={styles.rij}>
                <View style={[styles.icoonVlak, { backgroundColor: kl.zacht }]}>
                  <VakIcoon vak={vak.id} formaat={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={tekst.subkop}>{onderwerp.naam}</Text>
                  <Text style={tekst.klein}>{onderwerp.doel}</Text>
                </View>
                {oordeel.mag ? <Sterren aantal={b.sterren} /> : <Icoon soort="slot" formaat={18} kleur={kleur.slot} />}
              </View>

              <View style={styles.onder}>
                <Balk fractie={b.niveau / 5} kleurVoor={kl.van} hoogte={7} stil />
                <View style={styles.metaRij}>
                  <Text style={tekst.klein}>
                    Niveau {b.niveau} van 5
                    {beurten > 0 ? ` · ${scoreProcent(b)}% goed uit ${beurten} vragen` : ' · nog niet geoefend'}
                  </Text>
                  {oordeel.restVandaag !== undefined && oordeel.restVandaag > 0 ? (
                    <Text style={[tekst.klein, { color: kleur.goud }]}>nog {oordeel.restVandaag} gratis vandaag</Text>
                  ) : null}
                </View>
              </View>

              {films.length > 0 ? (
                <Kaart
                  onPress={() => router.push(`/film/${films[0].id}`)}
                  accessibilityLabel={`Filmpje: ${films[0].titel}`}
                  style={styles.filmRegel}
                >
                  <Icoon soort="speel" formaat={15} kleur={kleur.slot} />
                  <Text style={[tekst.klein, { color: kleur.slot, flex: 1 }]}>Filmpje: {films[0].titel}</Text>
                </Kaart>
              ) : null}
            </Kaart>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  heroRaam: { borderRadius: radius.l, overflow: 'hidden', ...schaduw.midden },
  hero: { padding: ruimte.xl, gap: ruimte.xs },
  heroIcoon: {
    width: 58,
    height: 58,
    borderRadius: radius.m,
    backgroundColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ruimte.s,
  },
  heroTitel: { ...tekst.titel, color: '#FFFFFF' },
  heroTekst: { ...tekst.body, color: '#FFFFFFDD' },
  kaart: { gap: ruimte.m },
  rij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m },
  icoonVlak: { width: 44, height: 44, borderRadius: radius.m, alignItems: 'center', justifyContent: 'center' },
  onder: { gap: ruimte.xs },
  metaRij: { flexDirection: 'row', justifyContent: 'space-between', gap: ruimte.s },
  filmRegel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ruimte.s,
    padding: ruimte.m,
    backgroundColor: kleur.slotZacht,
    borderColor: '#DED3F8',
    borderRadius: radius.m,
  },
});
