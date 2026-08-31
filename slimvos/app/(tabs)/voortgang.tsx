import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onderwerpenVoorGroep, vindVak } from '../../src/core/content/curriculum';
import { scoreProcent } from '../../src/core/engine/beheersing';
import { levelVoortgang } from '../../src/core/engine/punten';
import { metBeheersing } from '../../src/core/engine/profiel';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Balk, Sterren } from '../../src/ui/components/Voortgang';
import { Icoon, VakIcoon } from '../../src/ui/VakIcoon';
import { kleur, kleurVoorVak, radius, ruimte, tabelCijfers, tekst } from '../../src/ui/thema';

export default function Voortgang() {
  const { profiel } = useApp();
  if (!profiel) return null;

  const onderwerpen = onderwerpenVoorGroep(profiel.groep);
  const totaalGoed = Object.values(profiel.beheersing).reduce((n, b) => n + b.goed, 0);
  const totaalFout = Object.values(profiel.beheersing).reduce((n, b) => n + b.fout, 0);
  const sterren = Object.values(profiel.beheersing).reduce((n, b) => n + b.sterren, 0);
  const voortgang = levelVoortgang(profiel.xp);
  const gemiddeld = totaalGoed + totaalFout === 0 ? 0 : Math.round((totaalGoed / (totaalGoed + totaalFout)) * 100);

  const gesorteerd = onderwerpen
    .map((o) => ({ onderwerp: o, b: metBeheersing(profiel, o.id) }))
    .sort((a, b) => b.b.niveau * 100 + b.b.sterren - (a.b.niveau * 100 + a.b.sterren));

  return (
    <SafeAreaView style={styles.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
        <Text style={tekst.titel}>Jouw voortgang</Text>

        <View style={styles.tegels}>
          <Tegel soort="vink" kleurVoor={kleur.goed} waarde={String(totaalGoed)} label="goed beantwoord" />
          <Tegel soort="ster" kleurVoor={kleur.goud} waarde={String(sterren)} label="sterren" />
          <Tegel soort="vlam" kleurVoor={kleur.merk} waarde={String(profiel.streak.dagen)} label="dagen op rij" />
          <Tegel soort="munt" kleurVoor={kleur.goud} waarde={String(profiel.munten)} label="munten" />
        </View>

        <Kaart hoogte="midden">
          <View style={styles.levelRij}>
            <View style={{ flex: 1 }}>
              <Text style={tekst.subkop}>Level {voortgang.level}</Text>
              <Text style={tekst.klein}>Nog {voortgang.xpVoorVolgend} XP tot level {voortgang.level + 1}</Text>
            </View>
            <Text style={[tekst.cijfer, tabelCijfers]}>{gemiddeld}%</Text>
          </View>
          <View style={{ marginTop: ruimte.m }}>
            <Balk fractie={voortgang.fractie} />
          </View>
        </Kaart>

        <Text style={tekst.kop}>Per onderwerp</Text>
        {gesorteerd.map(({ onderwerp, b }) => {
          const kl = kleurVoorVak(onderwerp.vak);
          const beurten = b.goed + b.fout;
          return (
            <Kaart key={onderwerp.id} style={styles.regel}>
              <View style={styles.rij}>
                <View style={[styles.icoonVlak, { backgroundColor: kl.zacht }]}>
                  <VakIcoon vak={onderwerp.vak} formaat={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={tekst.subkop}>{onderwerp.naam}</Text>
                  <Text style={tekst.klein}>
                    {beurten === 0 ? 'nog niet geoefend' : `${beurten} vragen · ${scoreProcent(b)}% goed`}
                  </Text>
                </View>
                <Sterren aantal={b.sterren} />
              </View>
              <Balk fractie={b.niveau / 5} kleurVoor={kl.van} hoogte={7} stil />
            </Kaart>
          );
        })}

        <Text style={[tekst.klein, styles.slot]}>
          {vindVak(gesorteerd[0]?.onderwerp.vak ?? 'rekenen')?.naam} staat bovenaan omdat je daar het verst bent.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tegel({
  soort,
  waarde,
  label,
  kleurVoor,
}: {
  soort: 'vink' | 'ster' | 'vlam' | 'munt';
  waarde: string;
  label: string;
  kleurVoor: string;
}) {
  return (
    <Kaart style={styles.tegel}>
      <Icoon soort={soort} formaat={22} kleur={kleurVoor} />
      <Text style={[tekst.cijfer, tabelCijfers]}>{waarde}</Text>
      <Text style={[tekst.klein, { textAlign: 'center' }]}>{label}</Text>
    </Kaart>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  tegels: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.m },
  tegel: { flexGrow: 1, flexBasis: '44%', alignItems: 'center', gap: ruimte.xs, borderRadius: radius.m },
  levelRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m },
  regel: { gap: ruimte.s },
  rij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m },
  icoonVlak: { width: 40, height: 40, borderRadius: radius.m, alignItems: 'center', justifyContent: 'center' },
  slot: { textAlign: 'center', marginTop: ruimte.s },
});
