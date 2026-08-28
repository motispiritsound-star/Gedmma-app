import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BADGES } from '../../src/core/engine/badges';
import { WINKEL, kanKopen } from '../../src/core/engine/winkel';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Balk } from '../../src/ui/components/Voortgang';
import { Icoon } from '../../src/ui/VakIcoon';
import { kleur, radius, ruimte, schaduw, tabelCijfers, tekst } from '../../src/ui/thema';

export default function Beloningen() {
  const { profiel, koop, kiesAvatar } = useApp();
  if (!profiel) return null;

  const bezit = new Set(profiel.bezit);
  const verdiend = new Set(profiel.badges);

  return (
    <SafeAreaView style={styles.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
        <View style={styles.kop}>
          <Text style={tekst.titel}>Beloningen</Text>
          <View style={styles.munten}>
            <Icoon soort="munt" formaat={18} kleur={kleur.goud} />
            <Text style={[tekst.bodyVet, tabelCijfers]}>{profiel.munten}</Text>
          </View>
        </View>

        <Text style={tekst.kop}>Maatjes</Text>
        <Text style={tekst.klein}>
          Munten verdien je met goede antwoorden. Er is niets met echt geld te koop.
        </Text>
        <View style={styles.raster}>
          {WINKEL.map((item) => {
            const heeft = bezit.has(item.id);
            const gekozen = profiel.avatar === item.emoji;
            const beschikbaar = heeft || kanKopen(profiel, item);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={heeft ? `${item.naam} kiezen` : `${item.naam} kopen voor ${item.prijs} munten`}
                accessibilityState={{ selected: gekozen, disabled: !beschikbaar }}
                disabled={!beschikbaar}
                onPress={() => (heeft ? kiesAvatar(item.id) : koop(item.id))}
                style={[styles.item, gekozen && styles.itemGekozen, !beschikbaar && styles.itemUit]}
              >
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <Text style={tekst.klein}>{item.naam}</Text>
                {gekozen ? (
                  <Text style={[tekst.klein, { color: kleur.merkDieper }]}>in gebruik</Text>
                ) : heeft ? (
                  <Text style={[tekst.klein, { color: kleur.goed }]}>kies</Text>
                ) : (
                  <View style={styles.prijsRij}>
                    <Icoon soort="munt" formaat={12} kleur={kleur.goud} />
                    <Text style={tekst.klein}>{item.prijs}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={[tekst.kop, { marginTop: ruimte.l }]}>
          Badges ({verdiend.size}/{BADGES.length})
        </Text>
        {BADGES.map((badge) => {
          const klaar = verdiend.has(badge.id);
          const voortgang = badge.voortgang(profiel);
          return (
            <Kaart key={badge.id} style={[styles.badge, klaar && styles.badgeKlaar]}>
              <Text style={[styles.badgeEmoji, !klaar && styles.grijs]}>{badge.emoji}</Text>
              <View style={{ flex: 1, gap: ruimte.xs }}>
                <Text style={tekst.subkop}>{badge.naam}</Text>
                <Text style={tekst.klein}>{badge.omschrijving}</Text>
                {!klaar ? <Balk fractie={voortgang} kleurVoor={kleur.goud} hoogte={6} stil /> : null}
              </View>
              {klaar ? <Icoon soort="vink" formaat={20} kleur={kleur.goud} /> : null}
            </Kaart>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.s, paddingBottom: ruimte.xxl },
  kop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  munten: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: kleur.kaart,
    borderRadius: radius.rond,
    paddingHorizontal: ruimte.m,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: kleur.randZacht,
  },
  raster: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.m, marginTop: ruimte.s },
  item: {
    width: 96,
    paddingVertical: ruimte.m,
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.m,
    borderWidth: 2,
    borderColor: kleur.randZacht,
    backgroundColor: kleur.kaart,
    ...schaduw.klein,
  },
  itemGekozen: { borderColor: kleur.merk, backgroundColor: kleur.merkZacht },
  itemUit: { opacity: 0.38 },
  itemEmoji: { fontSize: 36 },
  prijsRij: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, marginTop: ruimte.s },
  badgeKlaar: { borderColor: kleur.goudRand, backgroundColor: kleur.goudZacht },
  badgeEmoji: { fontSize: 30 },
  grijs: { opacity: 0.32 },
});
