import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { beeldOpTijd, duurVan, type Film } from '../../core/film/types';
import { kleur, radius, ruimte, tekst, duur as tijd } from '../thema';
import { Vos } from '../Vos';
import { Icoon } from '../VakIcoon';
import { Knop } from './Knop';

const TIK_MS = 60;

const tinten: Record<string, string> = {
  merk: kleur.merk,
  goed: kleur.goed,
  goud: kleur.goud,
  slot: kleur.slot,
  fout: kleur.fout,
};

interface Props {
  film: Film;
  onKlaar: () => void;
  onSluit: () => void;
}

/**
 * Speelt een filmpje af dat in de app zelf getekend wordt: Vos wisselt van
 * uitdrukking, de tekst schuift in beeld en de stappen verschijnen één voor
 * één. Bovenaan lopen streepjes vol, zoals bij een verhaal op een telefoon.
 *
 * Staat er een `videoUrl` op de film, dan hoort daar een echte video te spelen;
 * dat is de plek om `expo-video` in te hangen zodra dat materiaal er is.
 */
export function FilmSpeler({ film, onKlaar, onSluit }: Props) {
  const totaal = useMemo(() => duurVan(film), [film]);
  const [verstreken, setVerstreken] = useState(0);
  const [speelt, setSpeelt] = useState(true);
  const vervaag = useRef(new Animated.Value(0)).current;
  const omhoog = useRef(new Animated.Value(14)).current;

  const { index, beeld, startMs } = beeldOpTijd(film, Math.min(verstreken, totaal - 1));
  const tint = tinten[beeld.tint ?? 'merk'];
  const inBeeld = verstreken - startMs;

  useEffect(() => {
    if (!speelt) return;
    const timer = setInterval(() => {
      setVerstreken((v) => {
        if (v + TIK_MS >= totaal) {
          clearInterval(timer);
          return totaal;
        }
        return v + TIK_MS;
      });
    }, TIK_MS);
    return () => clearInterval(timer);
  }, [speelt, totaal]);

  useEffect(() => {
    if (verstreken >= totaal) setSpeelt(false);
  }, [verstreken, totaal]);

  // Nieuw beeld: tekst komt zacht van onderen in beeld.
  useEffect(() => {
    vervaag.setValue(0);
    omhoog.setValue(14);
    Animated.parallel([
      Animated.timing(vervaag, { toValue: 1, duration: tijd.normaal, useNativeDriver: true }),
      Animated.timing(omhoog, { toValue: 0, duration: tijd.normaal, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [index, vervaag, omhoog]);

  const klaar = verstreken >= totaal;
  const zichtbareStappen = beeld.stappen
    ? beeld.stappen.filter((_, i) => inBeeld > (i + 1) * (beeld.duurMs / (beeld.stappen!.length + 1)))
    : [];

  function volgende() {
    const nieuw = startMs + beeld.duurMs;
    if (nieuw >= totaal) {
      setVerstreken(totaal);
      setSpeelt(false);
    } else {
      setVerstreken(nieuw);
    }
  }

  return (
    <View style={styles.scherm} testID="film-speler">
      <View style={styles.streepjes}>
        {film.beelden.map((b, i) => {
          const vol = i < index ? 1 : i > index ? 0 : Math.min(1, inBeeld / b.duurMs);
          return (
            <View key={i} style={styles.streepSpoor}>
              <View style={[styles.streepVol, { width: `${vol * 100}%`, backgroundColor: tint }]} />
            </View>
          );
        })}
      </View>

      <View style={styles.kopregel}>
        <Text style={tekst.label} numberOfLines={1}>
          {film.titel}
        </Text>
        <Pressable
          testID="film-sluit"
          accessibilityRole="button"
          accessibilityLabel="Filmpje sluiten"
          onPress={onSluit}
          hitSlop={14}
        >
          <Icoon soort="kruis" formaat={20} kleur={kleur.tekstZacht} />
        </Pressable>
      </View>

      <Pressable style={styles.doek} onPress={() => (klaar ? undefined : setSpeelt((s) => !s))} accessibilityRole="button" accessibilityLabel={speelt ? 'Pauzeer' : 'Speel verder'}>
        <View style={[styles.vosVlak, { backgroundColor: `${tint}18` }]}>
          <Vos uitdrukking={beeld.uitdrukking} formaat={130} />
        </View>

        <Animated.View style={{ opacity: vervaag, transform: [{ translateY: omhoog }] }}>
          <Text style={[tekst.titel, { color: tint }]}>{beeld.kop}</Text>
          <Text style={[tekst.body, styles.tekst]}>{beeld.tekst}</Text>
        </Animated.View>

        {beeld.stappen ? (
          <ScrollView style={styles.stappen} contentContainerStyle={{ gap: ruimte.s }}>
            {zichtbareStappen.map((stap, i) => (
              <View key={stap + i} style={[styles.stap, { borderColor: `${tint}55`, backgroundColor: `${tint}12` }]}>
                <Text style={[tekst.bodyVet, { color: kleur.tekst }]}>{stap}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {!speelt && !klaar ? (
          <View style={styles.pauzeVlak}>
            <Icoon soort="speel" formaat={30} kleur={kleur.tekstOpKleur} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.voet}>
        {klaar ? (
          <Knop testID="film-klaar" titel="Klaar, ik ga oefenen" onPress={onKlaar} />
        ) : (
          <Knop testID="film-volgende" titel="Volgende" soort="rand" onPress={volgende} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  streepjes: { flexDirection: 'row', gap: 4, paddingHorizontal: ruimte.l, paddingTop: ruimte.s },
  streepSpoor: { flex: 1, height: 4, borderRadius: 4, backgroundColor: kleur.grondDiep, overflow: 'hidden' },
  streepVol: { height: '100%', borderRadius: 4 },
  kopregel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ruimte.l,
    paddingVertical: ruimte.m,
    gap: ruimte.m,
  },
  doek: { flex: 1, paddingHorizontal: ruimte.xl, gap: ruimte.l },
  vosVlak: { alignSelf: 'center', borderRadius: radius.xl, padding: ruimte.l },
  tekst: { marginTop: ruimte.s },
  stappen: { maxHeight: 190 },
  stap: { borderWidth: 1.5, borderRadius: radius.m, paddingVertical: ruimte.m, paddingHorizontal: ruimte.l },
  pauzeVlak: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    width: 64,
    height: 64,
    borderRadius: radius.rond,
    backgroundColor: '#241F18AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voet: { padding: ruimte.l },
});
