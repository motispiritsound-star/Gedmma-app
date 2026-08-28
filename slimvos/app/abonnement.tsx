import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  euro,
  jaarKortingProcent,
  perMaand,
  PROEF_DAGEN,
  STANDAARD_PLAN,
  verlengingsregel,
  vindPlan,
  type PlanId,
} from '../src/core/abonnement/plannen';
import {
  dagenResterend,
  datumInWoorden,
  GRATIS_VRAGEN_PER_DAG,
  volgendeAfschrijving,
} from '../src/core/abonnement/toegang';
import { openBeheer } from '../src/state/aankoop';
import { useApp } from '../src/state/AppContext';
import { Kaart } from '../src/ui/components/Kaart';
import { Knop } from '../src/ui/components/Knop';
import { Vos } from '../src/ui/Vos';
import { Icoon } from '../src/ui/VakIcoon';
import { kleur, radius, ruimte, schaduw, tekst } from '../src/ui/thema';

export default function Abonnement() {
  const router = useRouter();
  const { ouder, abonnement, premium, koopAbonnement, zegAbonnementOp, hervatAbonnement, herstelAankopen } = useApp();
  const [gekozen, setGekozen] = useState<PlanId>(STANDAARD_PLAN);
  const [bezig, setBezig] = useState(false);

  const maand = vindPlan('maand');
  const jaar = vindPlan('jaar');
  const gratis = vindPlan('gratis');
  const resterend = dagenResterend(abonnement);
  const volgende = volgendeAfschrijving(abonnement);
  const magProeven = !abonnement.proefGebruikt;
  const eersteAfschrijving = new Date(Date.now() + PROEF_DAGEN * 86400000).getTime();

  async function bevestig() {
    if (!ouder) {
      router.push('/account/aanmelden');
      return;
    }
    setBezig(true);
    try {
      const melding = await koopAbonnement(gekozen, !abonnement.proefGebruikt);
      Alert.alert('Gelukt', melding);
    } catch (fout) {
      Alert.alert('Er ging iets mis', fout instanceof Error ? fout.message : 'Onbekende fout');
    } finally {
      setBezig(false);
    }
  }

  return (
    <ScrollView testID="paywall" style={styles.scherm} contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Vos uitdrukking="juich" formaat={106} />
        <Text style={tekst.titel}>Slimvos Compleet</Text>
        <Text style={[tekst.body, styles.midden]}>
          Alle zes de vakken, alle filmpjes, tot vijf kinderen. Rekenen blijft altijd gratis.
        </Text>
        {!premium && magProeven ? (
          <View style={styles.proefLint}>
            <Text style={styles.proefLintTekst}>Eerste week gratis</Text>
          </View>
        ) : null}
      </View>

      {premium ? (
        <Kaart testID="lid" style={styles.actief}>
          <Text style={tekst.label}>Je bent lid</Text>
          <Text style={tekst.subkop}>
            {vindPlan(abonnement.plan).naam}
            {abonnement.status === 'proef' ? ' · proefperiode' : ''}
            {abonnement.status === 'opgezegd' ? ' · loopt af' : ''}
          </Text>
          {resterend !== null ? (
            <Text style={tekst.zacht}>
              {abonnement.status === 'opgezegd'
                ? `Nog ${resterend} dagen toegang, daarna stopt het vanzelf.`
                : volgende
                  ? `${volgende.isEersteKeer ? 'Eerste afschrijving' : 'Volgende afschrijving'} op ${datumInWoorden(volgende.op)}: ${euro(vindPlan(volgende.plan).centen)}.`
                  : `Nog ${resterend} dagen.`}
            </Text>
          ) : null}
          <Knop
            titel="Beheren in de winkel"
            soort="zacht"
            klein
            onPress={async () => {
              if (!(await openBeheer())) {
                Alert.alert('Beheren', 'Open de instellingen van je telefoon en ga naar Abonnementen.');
              }
            }}
            style={{ marginTop: ruimte.m }}
          />
          {abonnement.status === 'opgezegd' ? (
            <Knop titel="Toch doorgaan" soort="zacht" onPress={hervatAbonnement} style={{ marginTop: ruimte.m }} />
          ) : (
            <Knop
              titel="Opzeggen"
              soort="rand"
              onPress={async () => Alert.alert('Opgezegd', await zegAbonnementOp())}
              style={{ marginTop: ruimte.m }}
            />
          )}
        </Kaart>
      ) : (
        <>
          <View style={styles.plannen}>
            <PlanKaart
              plan="jaar"
              gekozen={gekozen === 'jaar'}
              onKies={() => setGekozen('jaar')}
              badge={`${jaarKortingProcent()}% voordeliger`}
              prijs={`${euro(jaar.centen)} per jaar`}
              perMaandTekst={`${euro(perMaand(jaar))} per maand`}
            />
            <PlanKaart
              plan="maand"
              gekozen={gekozen === 'maand'}
              onKies={() => setGekozen('maand')}
              prijs={`${euro(maand.centen)} per maand`}
              perMaandTekst="Elke maand opzegbaar"
            />
          </View>

          <Knop
            testID="koop"
            titel={magProeven ? 'Begin met een week gratis' : 'Nu afsluiten'}
            onPress={bevestig}
            bezig={bezig}
          />

          <Kaart style={styles.voorwaarden}>
            <Text style={tekst.bodyVet}>{verlengingsregel(vindPlan(gekozen))}</Text>
            {magProeven ? (
              <Text style={tekst.zacht}>
                Je eerste afschrijving is op {datumInWoorden(eersteAfschrijving)}. Zeg je daarvoor op,
                dan betaal je niets.
              </Text>
            ) : null}
            <Text style={tekst.zacht}>
              Opzeggen doe je in de instellingen van je telefoon, bij Abonnementen. Er is geen
              opzegtermijn: je houdt toegang tot het einde van de periode die je al betaald hebt.
            </Text>
            <Text style={tekst.klein}>
              Eén proefperiode per gebruiker. Prijzen zijn inclusief btw.
            </Text>
          </Kaart>
        </>
      )}

      <Kaart>
        <Text style={tekst.label}>Wat je krijgt</Text>
        {jaar.regels.concat(maand.regels.slice(0, 4)).filter((r, i, a) => a.indexOf(r) === i).map((regel) => (
          <View key={regel} style={styles.regel}>
            <Icoon soort="vink" formaat={16} kleur={kleur.goed} />
            <Text style={[tekst.body, { flex: 1 }]}>{regel}</Text>
          </View>
        ))}
      </Kaart>

      <Kaart>
        <Text style={tekst.label}>En de gratis versie dan?</Text>
        <Text style={tekst.body}>
          Die blijft gewoon bestaan. Rekenen is onbeperkt en gratis, en in de andere vakken doe je{' '}
          {GRATIS_VRAGEN_PER_DAG} vragen per dag. Geen advertenties, geen tijdslimiet van een week.
        </Text>
        {gratis.regels.map((regel) => (
          <View key={regel} style={styles.regel}>
            <Icoon soort="vink" formaat={16} kleur={kleur.tekstZacht} />
            <Text style={[tekst.zacht, { flex: 1 }]}>{regel}</Text>
          </View>
        ))}
      </Kaart>

      <Kaart style={styles.vergelijk}>
        <Text style={tekst.label}>Ter vergelijking</Text>
        <Text style={tekst.body}>
          Squla rekent op dit moment €10,99 per maand bij een jaarabonnement en €16,99 bij een kwartaal,
          met een opzegtermijn van een maand. Slimvos Compleet is {euro(jaar.centen)} per jaar en je zegt
          op wanneer je wilt.
        </Text>
        <Text style={tekst.klein}>Prijzen van augustus 2026; controleer ze zelf voordat je beslist.</Text>
      </Kaart>

      <Knop
        titel="Eerdere aankopen herstellen"
        soort="kaal"
        klein
        onPress={async () => Alert.alert('Herstellen', await herstelAankopen())}
      />
      {!ouder ? (
        <Text style={[tekst.klein, styles.midden]}>
          Voor een abonnement maak je eerst een ouderaccount aan. Voor het gratis oefenen hoeft dat niet.
        </Text>
      ) : null}
      <Text style={[tekst.klein, styles.midden]}>
        In deze versie wordt er niets afgeschreven: de betaalkoppeling met de App Store en Google Play
        moet nog gemaakt worden.
      </Text>
    </ScrollView>
  );
}

function PlanKaart({
  plan,
  gekozen,
  onKies,
  prijs,
  perMaandTekst,
  badge,
}: {
  plan: PlanId;
  gekozen: boolean;
  onKies: () => void;
  prijs: string;
  perMaandTekst: string;
  badge?: string;
}) {
  const gegevens = vindPlan(plan);
  return (
    <Pressable
      testID={`plan-${plan}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: gekozen }}
      accessibilityLabel={`${gegevens.naam}, ${prijs}`}
      onPress={onKies}
      style={[styles.planRaam, gekozen && styles.planAan]}
    >
      {badge ? (
        <LinearGradient colors={[kleur.merk, kleur.merkDonker]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
          <Text style={styles.badgeTekst}>{badge}</Text>
        </LinearGradient>
      ) : null}
      <View style={styles.planRij}>
        <View style={[styles.bolletje, gekozen && styles.bolletjeAan]}>
          {gekozen ? <View style={styles.bolletjeKern} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={tekst.subkop}>{gegevens.naam}</Text>
          <Text style={tekst.klein}>{perMaandTekst}</Text>
        </View>
        <Text style={tekst.kop}>{prijs.split(' per ')[0]}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.m, paddingBottom: ruimte.xxl },
  hero: { alignItems: 'center', gap: ruimte.xs, marginBottom: ruimte.s },
  midden: { textAlign: 'center' },
  plannen: { gap: ruimte.m },
  planRaam: {
    backgroundColor: kleur.kaart,
    borderRadius: radius.l,
    borderWidth: 2,
    borderColor: kleur.rand,
    padding: ruimte.l,
    ...schaduw.klein,
  },
  planAan: { borderColor: kleur.merk, backgroundColor: kleur.merkZacht },
  badge: { alignSelf: 'flex-start', borderRadius: radius.rond, paddingHorizontal: ruimte.m, paddingVertical: 4, marginBottom: ruimte.s },
  badgeTekst: { ...tekst.label, color: '#FFFFFF' },
  planRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m },
  bolletje: {
    width: 24,
    height: 24,
    borderRadius: radius.rond,
    borderWidth: 2,
    borderColor: kleur.rand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolletjeAan: { borderColor: kleur.merk },
  bolletjeKern: { width: 12, height: 12, borderRadius: radius.rond, backgroundColor: kleur.merk },
  actief: { backgroundColor: kleur.goedZacht, borderColor: kleur.goedRand, gap: ruimte.xs },
  regel: { flexDirection: 'row', alignItems: 'flex-start', gap: ruimte.s, marginTop: ruimte.s },
  vergelijk: { backgroundColor: kleur.slotZacht, borderColor: '#DED3F8', gap: ruimte.s },
  voorwaarden: { backgroundColor: kleur.grondDiep, borderColor: kleur.rand, gap: ruimte.s },
  proefLint: {
    marginTop: ruimte.s,
    backgroundColor: kleur.goedZacht,
    borderWidth: 1,
    borderColor: kleur.goedRand,
    borderRadius: radius.rond,
    paddingHorizontal: ruimte.l,
    paddingVertical: 6,
  },
  proefLintTekst: { ...tekst.label, color: kleur.goed },
});
