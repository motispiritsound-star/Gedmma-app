import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { aanbevelingen } from '../../src/core/engine/aanbeveling';
import { levelVoortgang } from '../../src/core/engine/punten';
import { vakkenVoorGroep, onderwerpenVoorVak } from '../../src/core/content/curriculum';
import { useApp } from '../../src/state/AppContext';
import { Balk, Sterren } from '../../src/ui/components/Balk';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { kleur, radius, ruimte, tekst } from '../../src/ui/thema';

export default function Thuis() {
  const router = useRouter();
  const { profiel } = useApp();

  const tips = useMemo(() => (profiel ? aanbevelingen(profiel, 3) : []), [profiel]);
  if (!profiel) return null;

  const voortgang = levelVoortgang(profiel.xp);
  const doelFractie = profiel.vandaag.vragen / Math.max(1, profiel.dagdoel);
  const vakken = vakkenVoorGroep(profiel.groep);
  const eerste = tips[0];

  return (
    <SafeAreaView style={styles.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inhoud}>
        <View style={styles.kop}>
          <View style={{ flex: 1 }}>
            <Text style={tekst.zacht}>Hoi {profiel.naam}!</Text>
            <Text style={tekst.titel}>Level {voortgang.level}</Text>
          </View>
          <View style={styles.tellers}>
            <Text style={styles.teller}>🔥 {profiel.streak.dagen}</Text>
            <Text style={styles.teller}>🪙 {profiel.munten}</Text>
            <Text style={styles.avatar}>{profiel.avatar}</Text>
          </View>
        </View>

        <Kaart>
          <Balk fractie={voortgang.fractie} label={`Nog ${voortgang.xpVoorVolgend} XP tot level ${voortgang.level + 1}`} />
          <View style={styles.dagdoel}>
            <Text style={tekst.zacht}>
              Vandaag: {profiel.vandaag.vragen} van {profiel.dagdoel} vragen
            </Text>
            {doelFractie >= 1 ? <Text style={styles.gehaald}>Dagdoel gehaald! 🎉</Text> : null}
          </View>
          <Balk fractie={doelFractie} kleurVoor={kleur.goud} hoogte={8} />
        </Kaart>

        {eerste ? (
          <Kaart style={styles.verderKaart}>
            <Text style={tekst.zacht}>Ga verder met</Text>
            <Text style={styles.verderTitel}>
              {eerste.onderwerp.emoji} {eerste.onderwerp.naam}
            </Text>
            <Text style={tekst.klein}>{eerste.reden} · niveau {eerste.niveau}</Text>
            <Knop
              titel="Start ronde"
              emoji="▶️"
              onPress={() => router.push(`/oefenen/${eerste.onderwerp.id}`)}
              style={{ marginTop: ruimte.l }}
            />
          </Kaart>
        ) : null}

        {tips.length > 1 ? (
          <View style={styles.blok}>
            <Text style={tekst.kop}>Ook een goed idee</Text>
            {tips.slice(1).map((tip) => (
              <Kaart
                key={tip.onderwerp.id}
                onPress={() => router.push(`/oefenen/${tip.onderwerp.id}`)}
                accessibilityLabel={`Oefen ${tip.onderwerp.naam}`}
                style={styles.rijKaart}
              >
                <Text style={styles.rijEmoji}>{tip.onderwerp.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={tekst.subkop}>{tip.onderwerp.naam}</Text>
                  <Text style={tekst.klein}>{tip.reden}</Text>
                </View>
                <Sterren aantal={profiel.beheersing[tip.onderwerp.id]?.sterren ?? 0} />
              </Kaart>
            ))}
          </View>
        ) : null}

        <View style={styles.blok}>
          <Text style={tekst.kop}>Alle vakken</Text>
          {vakken.map((vak) => {
            const onderwerpen = onderwerpenVoorVak(vak.id, profiel.groep);
            const sterren = onderwerpen.reduce((n, o) => n + (profiel.beheersing[o.id]?.sterren ?? 0), 0);
            return (
              <Kaart
                key={vak.id}
                onPress={() => router.push(`/vak/${vak.id}`)}
                accessibilityLabel={`Open ${vak.naam}`}
                style={[styles.rijKaart, { borderLeftWidth: 6, borderLeftColor: vak.kleur }]}
              >
                <Text style={styles.rijEmoji}>{vak.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={tekst.subkop}>{vak.naam}</Text>
                  <Text style={tekst.klein}>
                    {onderwerpen.length} onderwerpen · {sterren}/{onderwerpen.length * 3} sterren
                  </Text>
                </View>
                <Text style={styles.pijl}>›</Text>
              </Kaart>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.achtergrond },
  inhoud: { padding: ruimte.l, gap: ruimte.l, paddingBottom: ruimte.xxl },
  kop: { flexDirection: 'row', alignItems: 'center' },
  tellers: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  teller: { fontSize: 16, fontWeight: '700', color: kleur.tekst },
  avatar: { fontSize: 32 },
  dagdoel: { flexDirection: 'row', justifyContent: 'space-between', marginTop: ruimte.l, marginBottom: ruimte.xs },
  gehaald: { fontSize: 13, fontWeight: '700', color: kleur.goed },
  verderKaart: { backgroundColor: kleur.primairZacht, borderColor: kleur.primair },
  verderTitel: { fontSize: 26, fontWeight: '800', color: kleur.tekst, marginTop: ruimte.xs },
  blok: { gap: ruimte.s },
  rijKaart: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, borderRadius: radius.m },
  rijEmoji: { fontSize: 28 },
  pijl: { fontSize: 28, color: kleur.tekstZacht },
});
