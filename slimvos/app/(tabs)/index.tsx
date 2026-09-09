import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { aanbevelingen } from '../../src/core/engine/aanbeveling';
import { levelVoortgang } from '../../src/core/engine/punten';
import { dagenDezeWeek, weekOverzicht } from '../../src/core/engine/week';
import { onderwerpenVoorVak, vakkenVoorGroep } from '../../src/core/content/curriculum';
import { motivatieFilms } from '../../src/core/film/films';
import { herhalingenPerOnderwerp } from '../../src/core/engine/herhalen';
import { vindOnderwerp } from '../../src/core/content/curriculum';
import { useApp } from '../../src/state/AppContext';
import { Kaart } from '../../src/ui/components/Kaart';
import { Knop } from '../../src/ui/components/Knop';
import { Balk, Ring, Sterren } from '../../src/ui/components/Voortgang';
import { Weekstrip } from '../../src/ui/components/Weekstrip';
import { Vos } from '../../src/ui/Vos';
import { Icoon, VakIcoon } from '../../src/ui/VakIcoon';
import { kleur, kleurVoorVak, radius, ruimte, schaduw, tabelCijfers, tekst } from '../../src/ui/thema';

export default function Thuis() {
  const router = useRouter();
  const { profiel, premium, magDitOefenen, aantalHerhalingen } = useApp();

  const tips = useMemo(() => (profiel ? aanbevelingen(profiel, 3) : []), [profiel]);
  if (!profiel) return null;

  const voortgang = levelVoortgang(profiel.xp);
  const doelFractie = profiel.vandaag.vragen / Math.max(1, profiel.dagdoel);
  const doelGehaald = doelFractie >= 1;
  const vakken = vakkenVoorGroep(profiel.groep);
  const eerste = tips[0];
  const film = motivatieFilms()[profiel.streak.dagen % motivatieFilms().length];
  const week = weekOverzicht(profiel.geschiedenis);
  const dezeWeek = dagenDezeWeek(profiel.geschiedenis);
  // Het onderwerp met de meeste openstaande herhalingen komt bovenaan.
  const herhaalPerOnderwerp = herhalingenPerOnderwerp(profiel.herhaalbak ?? []);
  const drukste = [...herhaalPerOnderwerp.entries()].sort((a, b) => b[1] - a[1])[0];
  const herhaalOnderwerp = drukste ? vindOnderwerp(drukste[0]) : undefined;

  return (
    <SafeAreaView style={styles.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={styles.inhoud} showsVerticalScrollIndicator={false}>
        <View style={styles.kop}>
          <View style={{ flex: 1 }}>
            <Text style={tekst.label}>Hoi {profiel.naam}</Text>
            <Text style={tekst.titel}>Level {voortgang.level}</Text>
          </View>
          <View style={styles.tellers}>
            <View style={styles.teller}>
              <Icoon soort="vlam" formaat={17} kleur={kleur.merk} />
              <Text style={styles.tellerTekst}>{profiel.streak.dagen}</Text>
            </View>
            <View style={styles.teller}>
              <Icoon soort="munt" formaat={17} kleur={kleur.goud} />
              <Text style={styles.tellerTekst}>{profiel.munten}</Text>
            </View>
            <Text style={styles.avatar}>{profiel.avatar}</Text>
          </View>
        </View>

        <Kaart hoogte="midden" style={{ gap: ruimte.l }}>
          <View style={styles.dagRij}>
            <Ring
              fractie={doelFractie}
              formaat={84}
              kleurVoor={doelGehaald ? kleur.goed : kleur.merk}
              midden={
                <View style={{ alignItems: 'center' }}>
                  <Text style={[tekst.cijfer, tabelCijfers]}>{profiel.vandaag.vragen}</Text>
                  <Text style={tekst.klein}>van {profiel.dagdoel}</Text>
                </View>
              }
            />
            <View style={{ flex: 1, gap: ruimte.s }}>
              <Text style={tekst.subkop}>{doelGehaald ? 'Dagdoel gehaald!' : 'Vandaag'}</Text>
              <Text style={tekst.zacht}>
                {doelGehaald
                  ? 'Mooi. Alles wat je nu nog doet is bonus.'
                  : `Nog ${Math.max(0, profiel.dagdoel - profiel.vandaag.vragen)} vragen te gaan.`}
              </Text>
              <Balk fractie={voortgang.fractie} hoogte={8} label={`Nog ${voortgang.xpVoorVolgend} XP tot level ${voortgang.level + 1}`} />
            </View>
          </View>

          <View style={styles.scheiding} />

          <View style={{ gap: ruimte.s }}>
            <Text style={tekst.label}>
              Deze week {dezeWeek === 0 ? 'nog niet geoefend' : `${dezeWeek} ${dezeWeek === 1 ? 'dag' : 'dagen'} geoefend`}
            </Text>
            <Weekstrip dagen={week} />
          </View>
        </Kaart>

        {aantalHerhalingen > 0 && herhaalOnderwerp ? (
          <Kaart
            testID="herhaalkaart"
            onPress={() => router.push(`/oefenen/${herhaalOnderwerp.id}`)}
            accessibilityLabel={`${aantalHerhalingen} vragen herhalen, te beginnen bij ${herhaalOnderwerp.naam}`}
            style={styles.herhaalKaart}
          >
            <View style={styles.herhaalBol}>
              <Text style={styles.herhaalCijfer}>{aantalHerhalingen}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={tekst.label}>Klaar om te herhalen</Text>
              <Text style={tekst.subkop}>
                {aantalHerhalingen === 1 ? 'Eén vraag' : `${aantalHerhalingen} vragen`} van eerder
              </Text>
              <Text style={tekst.klein}>
                Ze zitten vanzelf in je volgende ronde {herhaalOnderwerp.naam.toLowerCase()}.
              </Text>
            </View>
            <Icoon soort="pijl" formaat={20} kleur={kleur.slot} />
          </Kaart>
        ) : null}

        {eerste ? (
          <View style={styles.verderRaam}>
            <LinearGradient
              colors={[kleurVoorVak(eerste.onderwerp.vak).van, kleurVoorVak(eerste.onderwerp.vak).tot]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.verder}
            >
              <View style={styles.verderTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verderLabel}>Ga verder met</Text>
                  <Text style={styles.verderTitel}>{eerste.onderwerp.naam}</Text>
                  <Text style={styles.verderReden}>
                    {eerste.reden} · niveau {eerste.niveau} van 5
                  </Text>
                </View>
                <Vos uitdrukking="juich" formaat={78} />
              </View>
              <Knop
                testID="start-ronde"
                titel="Start ronde"
                soort="rand"
                onPress={() => router.push(`/oefenen/${eerste.onderwerp.id}`)}
                links={<Icoon soort="speel" formaat={16} kleur={kleur.tekst} />}
              />
            </LinearGradient>
          </View>
        ) : null}

        {tips.length > 1 ? (
          <View style={styles.blok}>
            <Text style={tekst.kop}>Ook een goed idee</Text>
            {tips.slice(1).map((tip) => {
              const oordeel = magDitOefenen(tip.onderwerp.id);
              return (
                <Kaart
                  key={tip.onderwerp.id}
                  onPress={() => router.push(`/oefenen/${tip.onderwerp.id}`)}
                  accessibilityLabel={`Oefen ${tip.onderwerp.naam}`}
                  style={styles.rijKaart}
                >
                  <View style={[styles.icoonVlak, { backgroundColor: kleurVoorVak(tip.onderwerp.vak).zacht }]}>
                    <VakIcoon vak={tip.onderwerp.vak} formaat={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={tekst.subkop}>{tip.onderwerp.naam}</Text>
                    <Text style={tekst.klein}>{tip.reden}</Text>
                  </View>
                  {oordeel.mag ? (
                    <Sterren aantal={profiel.beheersing[tip.onderwerp.id]?.sterren ?? 0} />
                  ) : (
                    <Icoon soort="slot" formaat={18} kleur={kleur.slot} />
                  )}
                </Kaart>
              );
            })}
          </View>
        ) : null}

        <Kaart onPress={() => router.push(`/film/${film.id}`)} style={styles.filmKaart} accessibilityLabel={`Filmpje: ${film.titel}`}>
          <View style={styles.filmSpeel}>
            <Icoon soort="speel" formaat={18} kleur="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={tekst.label}>Filmpje van Vos</Text>
            <Text style={tekst.subkop}>{film.titel}</Text>
            <Text style={tekst.klein}>{film.pitch}</Text>
          </View>
        </Kaart>

        <View style={styles.blok}>
          <Text style={tekst.kop}>Alle vakken</Text>
          {vakken.map((vak) => {
            const onderwerpen = onderwerpenVoorVak(vak.id, profiel.groep);
            const sterren = onderwerpen.reduce((n, o) => n + (profiel.beheersing[o.id]?.sterren ?? 0), 0);
            const kl = kleurVoorVak(vak.id);
            const opSlot = !premium && !magDitOefenen(onderwerpen[0]?.id ?? '').mag;
            return (
              <Kaart
                key={vak.id}
                onPress={() => router.push(`/vak/${vak.id}`)}
                accessibilityLabel={`Open ${vak.naam}`}
                style={styles.vakKaart}
              >
                <View style={[styles.vakIcoon, { backgroundColor: kl.zacht }]}>
                  <VakIcoon vak={vak.id} formaat={28} />
                </View>
                <View style={{ flex: 1, gap: ruimte.xs }}>
                  <Text style={tekst.subkop}>{vak.naam}</Text>
                  <Text style={tekst.klein}>
                    {onderwerpen.length} onderwerpen · {sterren}/{onderwerpen.length * 3} sterren
                  </Text>
                  <Balk fractie={sterren / Math.max(1, onderwerpen.length * 3)} kleurVoor={kl.van} hoogte={6} stil />
                </View>
                {opSlot ? <Icoon soort="slot" formaat={18} kleur={kleur.slot} /> : <Icoon soort="pijl" formaat={20} kleur={kleur.tekstZacht} />}
              </Kaart>
            );
          })}
        </View>

        {!premium ? (
          <Kaart onPress={() => router.push('/abonnement')} style={styles.promo} accessibilityLabel="Bekijk Slimvos Compleet">
            <Text style={tekst.label}>Gratis versie</Text>
            <Text style={tekst.subkop}>Alles openzetten?</Text>
            <Text style={tekst.zacht}>
              Rekenen is altijd gratis. Met Compleet oefen je onbeperkt in alle zes de vakken.
            </Text>
          </Kaart>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: kleur.grond },
  inhoud: { padding: ruimte.l, gap: ruimte.l, paddingBottom: ruimte.xxl },
  kop: { flexDirection: 'row', alignItems: 'center' },
  tellers: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  teller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: kleur.kaart,
    borderRadius: radius.rond,
    paddingHorizontal: ruimte.m,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: kleur.randZacht,
  },
  tellerTekst: { ...tekst.bodyVet, fontSize: 14 },
  avatar: { fontSize: 32 },
  dagRij: { flexDirection: 'row', alignItems: 'center', gap: ruimte.l },
  scheiding: { height: 1, backgroundColor: kleur.randZacht },
  verderRaam: { borderRadius: radius.l, overflow: 'hidden', ...schaduw.midden },
  verder: { padding: ruimte.l, gap: ruimte.l },
  verderTop: { flexDirection: 'row', alignItems: 'center', gap: ruimte.s },
  verderLabel: { ...tekst.label, color: '#FFFFFFCC' },
  verderTitel: { ...tekst.titel, color: '#FFFFFF', marginTop: 2 },
  verderReden: { ...tekst.klein, color: '#FFFFFFDD' },
  blok: { gap: ruimte.s },
  rijKaart: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, borderRadius: radius.m },
  icoonVlak: { width: 46, height: 46, borderRadius: radius.m, alignItems: 'center', justifyContent: 'center' },
  vakKaart: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m },
  vakIcoon: { width: 52, height: 52, borderRadius: radius.m, alignItems: 'center', justifyContent: 'center' },
  filmKaart: { flexDirection: 'row', alignItems: 'center', gap: ruimte.m, backgroundColor: kleur.slotZacht, borderColor: '#DED3F8' },
  filmSpeel: {
    width: 44,
    height: 44,
    borderRadius: radius.rond,
    backgroundColor: kleur.slot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promo: { backgroundColor: kleur.merkZacht, borderColor: kleur.merkRand, gap: ruimte.xs },
  herhaalKaart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ruimte.m,
    backgroundColor: kleur.slotZacht,
    borderColor: '#DED3F8',
  },
  herhaalBol: {
    width: 46,
    height: 46,
    borderRadius: radius.rond,
    backgroundColor: kleur.slot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  herhaalCijfer: { ...tekst.cijfer, fontSize: 20, color: '#FFFFFF' },
});
