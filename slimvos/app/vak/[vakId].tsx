import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VakId } from '../../src/core/types';
import { onderwerpenVoorVak, vindVak } from '../../src/core/content/curriculum';
import { scoreProcent } from '../../src/core/engine/beheersing';
import { metBeheersing } from '../../src/core/engine/profiel';
import { useApp } from '../../src/state/AppContext';
import { Balk, Sterren } from '../../src/ui/components/Balk';
import { Kaart } from '../../src/ui/components/Kaart';
import { kleur, radius, ruimte, tekst } from '../../src/ui/thema';

export default function VakScherm() {
  const { vakId } = useLocalSearchParams<{ vakId: string }>();
  const router = useRouter();
  const { profiel } = useApp();
  const vak = vakId ? vindVak(vakId as VakId) : undefined;

  if (!vak || !profiel) return null;
  const onderwerpen = onderwerpenVoorVak(vak.id, profiel.groep);

  return (
    <SafeAreaView style={styles.scherm} edges={['bottom']}>
      <Stack.Screen options={{ title: vak.naam }} />
      <ScrollView contentContainerStyle={styles.inhoud}>
        <View style={[styles.hero, { backgroundColor: vak.kleur }]}>
          <Text style={styles.heroEmoji}>{vak.emoji}</Text>
          <Text style={styles.heroTitel}>{vak.naam}</Text>
          <Text style={styles.heroTekst}>{vak.omschrijving}</Text>
        </View>

        {onderwerpen.map((onderwerp) => {
          const b = metBeheersing(profiel, onderwerp.id);
          const beurten = b.goed + b.fout;
          return (
            <Kaart
              key={onderwerp.id}
              onPress={() => router.push(`/oefenen/${onderwerp.id}`)}
              accessibilityLabel={`Oefen ${onderwerp.naam}, niveau ${b.niveau} van 5`}
              style={styles.kaart}
            >
              <View style={styles.rij}>
                <Text style={styles.emoji}>{onderwerp.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={tekst.subkop}>{onderwerp.naam}</Text>
                  <Text style={tekst.klein}>{onderwerp.doel}</Text>
                </View>
                <Sterren aantal={b.sterren} />
              </View>
              <View style={styles.onder}>
                <Balk fractie={b.niveau / 5} kleurVoor={vak.kleur} hoogte={8} />
                <Text style={tekst.klein}>
                  Niveau {b.niveau} van 5
                  {beurten > 0 ? ` · ${scoreProcent(b)}% goed uit ${beurten} vragen` : ' · nog niet geoefend'}
                </Text>
              </View>
            </Kaart>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.achtergrond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  hero: { borderRadius: radius.l, padding: ruimte.xl },
  heroEmoji: { fontSize: 40 },
  heroTitel: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginTop: ruimte.s },
  heroTekst: { fontSize: 15, color: '#FFFFFFDD', marginTop: ruimte.xs },
  kaart: { gap: ruimte.m },
  rij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m },
  emoji: { fontSize: 28 },
  onder: { gap: ruimte.xs },
});
