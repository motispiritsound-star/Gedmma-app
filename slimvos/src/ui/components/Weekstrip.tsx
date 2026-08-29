import { StyleSheet, Text, View } from 'react-native';
import type { WeekDag } from '../../core/engine/week';
import { kleur, radius, tekst } from '../thema';
import { Icoon } from '../VakIcoon';

interface Props {
  dagen: WeekDag[];
}

/**
 * De week in zeven bolletjes. Een gevuld bolletje is een dag waarop geoefend
 * is; vandaag heeft een rand. Dit is de reeks in beeld gebracht — veel
 * duidelijker dan alleen een getal naast een vlammetje.
 */
export function Weekstrip({ dagen }: Props) {
  return (
    <View style={styles.rij} accessible accessibilityLabel={samenvatting(dagen)}>
      {dagen.map((dag) => {
        const gedaan = dag.vragen > 0;
        return (
          <View key={dag.sleutel} style={styles.kolom}>
            <View
              style={[
                styles.bol,
                gedaan && styles.bolGedaan,
                dag.isVandaag && styles.bolVandaag,
                dag.isToekomst && styles.bolToekomst,
              ]}
            >
              {gedaan ? <Icoon soort="vink" formaat={15} kleur="#FFFFFF" /> : null}
            </View>
            <Text style={[tekst.klein, dag.isVandaag && styles.letterVandaag]}>{dag.letter}</Text>
          </View>
        );
      })}
    </View>
  );
}

function samenvatting(dagen: WeekDag[]): string {
  const gedaan = dagen.filter((d) => d.vragen > 0);
  if (gedaan.length === 0) return 'Deze week nog niet geoefend.';
  return `Deze week geoefend op ${gedaan.map((d) => d.naam).join(', ')}.`;
}

const styles = StyleSheet.create({
  rij: { flexDirection: 'row', justifyContent: 'space-between' },
  kolom: { alignItems: 'center', gap: 5 },
  bol: {
    width: 32,
    height: 32,
    borderRadius: radius.rond,
    backgroundColor: kleur.grondDiep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolGedaan: { backgroundColor: kleur.merk },
  bolVandaag: { borderWidth: 2.5, borderColor: kleur.merkDieper },
  bolToekomst: { opacity: 0.45 },
  letterVandaag: { color: kleur.merkDieper, fontFamily: 'Nunito_700Bold' },
});
