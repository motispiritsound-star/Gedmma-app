import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FILMS } from '../../src/core/film/films';
import { duurVan } from '../../src/core/film/types';
import { vindOnderwerp } from '../../src/core/content/curriculum';
import { magFilmpje } from '../../src/core/abonnement/toegang';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Vos } from '../../src/ui/Vos';
import { Icoon } from '../../src/ui/VakIcoon';
import { kleur, kleurVoorVak, radius, ruimte, tekst } from '../../src/ui/thema';

export default function Films() {
  const router = useRouter();
  const { abonnement } = useApp();

  const motivatie = FILMS.filter((f) => f.soort === 'motivatie');
  const uitleg = FILMS.filter((f) => f.soort === 'uitleg');

  function regel(index: number) {
    return (film: (typeof FILMS)[number], i: number) => {
      const open = magFilmpje(abonnement, index + i);
      const onderwerp = film.onderwerpId ? vindOnderwerp(film.onderwerpId) : undefined;
      const kl = film.vak === 'algemeen' ? { van: kleur.slot, zacht: kleur.slotZacht } : kleurVoorVak(film.vak);
      return (
        <Kaart
          key={film.id}
          onPress={() => router.push(open ? `/film/${film.id}` : '/abonnement')}
          accessibilityLabel={`${film.titel}${open ? '' : ', op slot'}`}
          style={styles.kaart}
        >
          <View style={[styles.speel, { backgroundColor: open ? kl.van : kleur.rand }]}>
            <Icoon soort={open ? 'speel' : 'slot'} formaat={17} kleur="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={tekst.subkop}>{film.titel}</Text>
            <Text style={tekst.klein}>{film.pitch}</Text>
            <Text style={[tekst.klein, { marginTop: 2 }]}>
              {Math.round(duurVan(film) / 1000)} seconden{onderwerp ? ` · ${onderwerp.naam}` : ''}
            </Text>
          </View>
        </Kaart>
      );
    };
  }

  return (
    <SafeAreaView style={styles.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
        <View style={styles.kop}>
          <View style={{ flex: 1 }}>
            <Text style={tekst.titel}>Filmpjes</Text>
            <Text style={tekst.zacht}>Korte uitleg van Vos. Tik om te pauzeren.</Text>
          </View>
          <Vos uitdrukking="wijs" formaat={64} />
        </View>

        <Text style={tekst.kop}>Even opladen</Text>
        {motivatie.map(regel(0))}

        <Text style={[tekst.kop, { marginTop: ruimte.m }]}>Uitleg per onderwerp</Text>
        {uitleg.map(regel(motivatie.length))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.s, paddingBottom: ruimte.xxl },
  kop: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, marginBottom: ruimte.s },
  kaart: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, borderRadius: radius.m },
  speel: { width: 44, height: 44, borderRadius: radius.rond, alignItems: 'center', justifyContent: 'center' },
});
