import { useMemo } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VakId } from '../../src/core/types';
import { onderwerpenVoorVak, vindVak } from '../../src/core/content/curriculum';
import { volgendeOefening } from '../../src/core/engine/aanbeveling';
import { metBeheersing } from '../../src/core/engine/profiel';
import { filmsVoorOnderwerp } from '../../src/core/film/films';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Leerpad, type PadKnoop } from '../../src/ui/components/Leerpad';
import { Balk } from '../../src/ui/components/Voortgang';
import { Icoon, VakIcoon } from '../../src/ui/VakIcoon';
import { kleur, kleurVoorVak, radius, ruimte, schaduw, tekst } from '../../src/ui/thema';

export default function VakScherm() {
  const { vakId } = useLocalSearchParams<{ vakId: string }>();
  const router = useRouter();
  const { profiel, magDitOefenen } = useApp();
  const vak = vakId ? vindVak(vakId as VakId) : undefined;

  const knopen = useMemo<PadKnoop[]>(() => {
    if (!vak || !profiel) return [];
    const tip = volgendeOefening(profiel);
    return onderwerpenVoorVak(vak.id, profiel.groep).map((onderwerp) => ({
      onderwerp,
      beheersing: metBeheersing(profiel, onderwerp.id),
      open: magDitOefenen(onderwerp.id).mag,
      aanbevolen: tip?.onderwerp.id === onderwerp.id,
    }));
  }, [vak, profiel, magDitOefenen]);

  if (!vak || !profiel) return null;
  const kl = kleurVoorVak(vak.id);
  const sterren = knopen.reduce((n, k) => n + k.beheersing.sterren, 0);
  const maxSterren = Math.max(1, knopen.length * 3);
  const film = knopen.map((k) => filmsVoorOnderwerp(k.onderwerp.id)[0]).find(Boolean);

  return (
    <SafeAreaView style={styles.scherm} edges={['bottom']}>
      <Stack.Screen options={{ title: vak.naam }} />
      <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
        <View style={styles.heroRaam}>
          <LinearGradient colors={[kl.van, kl.tot]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroRij}>
              <View style={styles.heroIcoon}>
                <VakIcoon vak={vak.id} formaat={30} kleurOverschrijving="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitel}>{vak.naam}</Text>
                <Text style={styles.heroTekst}>{vak.omschrijving}</Text>
              </View>
            </View>
            <View style={styles.heroVoet}>
              <Text style={styles.heroLabel}>
                {sterren} van de {maxSterren} sterren
              </Text>
              <View style={styles.heroBalk}>
                <Balk fractie={sterren / maxSterren} kleurVoor="#FFFFFF" achtergrond="#FFFFFF44" hoogte={8} stil />
              </View>
            </View>
          </LinearGradient>
        </View>

        {film ? (
          <Kaart
            onPress={() => router.push(`/film/${film.id}`)}
            accessibilityLabel={`Filmpje: ${film.titel}`}
            style={styles.filmKaart}
          >
            <View style={styles.filmSpeel}>
              <Icoon soort="speel" formaat={16} kleur="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={tekst.label}>Eerst even kijken</Text>
              <Text style={tekst.bodyVet}>{film.titel}</Text>
            </View>
            <Icoon soort="pijl" formaat={18} kleur={kleur.tekstZacht} />
          </Kaart>
        ) : null}

        <Leerpad
          knopen={knopen}
          onKies={(knoop) => router.push(knoop.open ? `/oefenen/${knoop.onderwerp.id}` : '/abonnement')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  heroRaam: { borderRadius: radius.l, overflow: 'hidden', ...schaduw.midden },
  hero: { padding: ruimte.l, gap: ruimte.l },
  heroRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m },
  heroIcoon: {
    width: 52,
    height: 52,
    borderRadius: radius.m,
    backgroundColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitel: { ...tekst.kop, color: '#FFFFFF' },
  heroTekst: { ...tekst.zacht, color: '#FFFFFFDD' },
  heroVoet: { gap: ruimte.xs },
  heroLabel: { ...tekst.label, color: '#FFFFFFCC' },
  heroBalk: { width: '100%' },
  filmKaart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ruimte.m,
    backgroundColor: kleur.slotZacht,
    borderColor: '#DED3F8',
  },
  filmSpeel: {
    width: 40,
    height: 40,
    borderRadius: radius.rond,
    backgroundColor: kleur.slot,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
