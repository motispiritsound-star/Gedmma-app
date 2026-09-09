import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vindFilm } from '../../src/core/film/films';
import { FilmSpeler } from '../../src/ui/components/FilmSpeler';
import { Knop } from '../../src/ui/components/Knop';
import { kleur, ruimte, tekst } from '../../src/ui/thema';

export default function FilmScherm() {
  const { filmId } = useLocalSearchParams<{ filmId: string }>();
  const router = useRouter();
  const film = filmId ? vindFilm(filmId) : undefined;

  const sluit = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (!film) {
    return (
      <SafeAreaView style={styles.leeg}>
        <Text style={tekst.kop}>Dit filmpje bestaat niet.</Text>
        <Knop titel="Terug" soort="zacht" onPress={sluit} style={{ marginTop: ruimte.l }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.scherm}>
      <FilmSpeler
        film={film}
        onSluit={sluit}
        onKlaar={() => {
          if (film.onderwerpId) router.replace(`/oefenen/${film.onderwerpId}`);
          else sluit();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  leeg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ruimte.xl, backgroundColor: kleur.grond },
});
