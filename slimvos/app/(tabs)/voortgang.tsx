import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onderwerpenVoorGroep, vindVak } from '../../src/core/content/curriculum';
import { scoreProcent } from '../../src/core/engine/beheersing';
import { levelVoortgang } from '../../src/core/engine/punten';
import { metBeheersing } from '../../src/core/engine/profiel';
import { useApp } from '../../src/state/AppContext';
import { Balk, Sterren } from '../../src/ui/components/Balk';
import { Kaart } from '../../src/ui/components/Kaart';
import { kleur, ruimte, tekst } from '../../src/ui/thema';

export default function Voortgang() {
  const { profiel } = useApp();
  if (!profiel) return null;

  const onderwerpen = onderwerpenVoorGroep(profiel.groep);
  const totaalGoed = Object.values(profiel.beheersing).reduce((n, b) => n + b.goed, 0);
  const totaalFout = Object.values(profiel.beheersing).reduce((n, b) => n + b.fout, 0);
  const sterren = Object.values(profiel.beheersing).reduce((n, b) => n + b.sterren, 0);
  const voortgang = levelVoortgang(profiel.xp);

  const geoefend = onderwerpen
    .map((o) => ({ onderwerp: o, b: metBeheersing(profiel, o.id) }))
    .sort((a, b) => b.b.niveau * 100 + b.b.sterren - (a.b.niveau * 100 + a.b.sterren));

  return (
    <SafeAreaView style={styles.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inhoud}>
        <Text style={tekst.titel}>Jouw voortgang</Text>

        <View style={styles.tegels}>
          <Tegel emoji="✅" waarde={String(totaalGoed)} label="goed beantwoord" />
          <Tegel emoji="⭐" waarde={String(sterren)} label="sterren" />
          <Tegel emoji="🔥" waarde={String(profiel.streak.dagen)} label="dagen op rij" />
          <Tegel
            emoji="🎯"
            waarde={`${totaalGoed + totaalFout === 0 ? 0 : Math.round((totaalGoed / (totaalGoed + totaalFout)) * 100)}%`}
            label="gemiddeld goed"
          />
        </View>

        <Kaart>
          <Text style={tekst.subkop}>Level {voortgang.level}</Text>
          <Text style={tekst.klein}>Nog {voortgang.xpVoorVolgend} XP tot level {voortgang.level + 1}</Text>
          <View style={{ marginTop: ruimte.s }}>
            <Balk fractie={voortgang.fractie} />
          </View>
        </Kaart>

        <Text style={tekst.kop}>Per onderwerp</Text>
        {geoefend.map(({ onderwerp, b }) => {
          const vak = vindVak(onderwerp.vak);
          const beurten = b.goed + b.fout;
          return (
            <Kaart key={onderwerp.id} style={styles.regel}>
              <View style={styles.rij}>
                <Text style={styles.emoji}>{onderwerp.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={tekst.subkop}>{onderwerp.naam}</Text>
                  <Text style={tekst.klein}>
                    {beurten === 0 ? 'nog niet geoefend' : `${beurten} vragen · ${scoreProcent(b)}% goed`}
                  </Text>
                </View>
                <Sterren aantal={b.sterren} />
              </View>
              <Balk fractie={b.niveau / 5} kleurVoor={vak?.kleur ?? kleur.primair} hoogte={8} />
            </Kaart>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tegel({ emoji, waarde, label }: { emoji: string; waarde: string; label: string }) {
  return (
    <Kaart style={styles.tegel}>
      <Text style={styles.tegelEmoji}>{emoji}</Text>
      <Text style={styles.tegelWaarde}>{waarde}</Text>
      <Text style={tekst.klein}>{label}</Text>
    </Kaart>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.achtergrond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  tegels: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.m },
  tegel: { flexGrow: 1, flexBasis: '45%', alignItems: 'center', gap: 2 },
  tegelEmoji: { fontSize: 24 },
  tegelWaarde: { fontSize: 26, fontWeight: '800', color: kleur.tekst },
  regel: { gap: ruimte.s },
  rij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m },
  emoji: { fontSize: 26 },
});
