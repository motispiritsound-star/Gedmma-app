import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BADGES } from '../../src/core/engine/badges';
import { WINKEL, kanKopen } from '../../src/core/engine/winkel';
import { useApp } from '../../src/state/AppContext';
import { Balk } from '../../src/ui/components/Balk';
import { Kaart } from '../../src/ui/components/Kaart';
import { kleur, radius, ruimte, tekst } from '../../src/ui/thema';

export default function Beloningen() {
  const { profiel, koop, kiesAvatar } = useApp();
  if (!profiel) return null;

  const bezit = new Set(profiel.bezit);
  const verdiend = new Set(profiel.badges);

  return (
    <SafeAreaView style={styles.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inhoud}>
        <View style={styles.kop}>
          <Text style={tekst.titel}>Beloningen</Text>
          <Text style={styles.munten}>🪙 {profiel.munten}</Text>
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
                accessibilityLabel={
                  heeft ? `${item.naam} kiezen` : `${item.naam} kopen voor ${item.prijs} munten`
                }
                disabled={!beschikbaar}
                onPress={() => (heeft ? kiesAvatar(item.id) : koop(item.id))}
                style={[
                  styles.item,
                  gekozen && styles.itemGekozen,
                  !beschikbaar && styles.itemUit,
                ]}
              >
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <Text style={tekst.klein}>{item.naam}</Text>
                <Text style={[tekst.klein, styles.prijs]}>
                  {gekozen ? 'in gebruik' : heeft ? 'kies' : `🪙 ${item.prijs}`}
                </Text>
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
                {!klaar ? <Balk fractie={voortgang} kleurVoor={kleur.goud} hoogte={6} /> : null}
              </View>
              {klaar ? <Text style={styles.vink}>✓</Text> : null}
            </Kaart>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.achtergrond },
  inhoud: { padding: ruimte.l, gap: ruimte.s, paddingBottom: ruimte.xxl },
  kop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  munten: { fontSize: 20, fontWeight: '800', color: kleur.tekst },
  raster: { flexDirection: 'row', flexWrap: 'wrap', gap: ruimte.m, marginTop: ruimte.s },
  item: {
    width: 92,
    paddingVertical: ruimte.m,
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.m,
    borderWidth: 2,
    borderColor: kleur.rand,
    backgroundColor: kleur.kaart,
  },
  itemGekozen: { borderColor: kleur.primair, backgroundColor: kleur.primairZacht },
  itemUit: { opacity: 0.4 },
  itemEmoji: { fontSize: 34 },
  prijs: { fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, marginTop: ruimte.s },
  badgeKlaar: { borderColor: kleur.goud, backgroundColor: kleur.goudZacht },
  badgeEmoji: { fontSize: 30 },
  grijs: { opacity: 0.35 },
  vink: { fontSize: 22, color: kleur.goud, fontWeight: '800' },
});
