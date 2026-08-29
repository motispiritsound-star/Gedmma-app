import type { Metadata } from "next";
import { getLocale } from "@/modules/i18n/server";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Privacy" };
export const dynamic = "force-dynamic";

type Section = { heading: string; body: string[] };

const CONTENT: Record<"nl" | "en", { title: string; intro: string; sections: Section[]; disclaimer: string }> = {
  nl: {
    title: "Privacy in het kort",
    intro:
      "Questly is gebouwd voor gezinnen met kinderen. Dat stelt eisen aan wat we vragen, wat we bewaren en wie erbij kan. Hieronder staat wat we doen, in gewone taal.",
    sections: [
      {
        heading: "Wat we van kinderen vragen",
        body: [
          "Een kindprofiel heeft alleen een bijnaam, een avatar, een leeftijdsgroep en interesses.",
          "We vragen geen e-mailadres, geen achternaam en geen geboortedatum. Een leeftijdsgroep is genoeg om passende quests te kiezen.",
          "Kinderen hebben geen eigen inlog en geen openbaar profiel. Alles loopt via het gezinsaccount van de ouder.",
        ],
      },
      {
        heading: "Wat we niet doen",
        body: [
          "Geen advertentieprofielen en geen verkoop van gegevens.",
          "Geen openbare ranglijsten, geen zichtbaarheid voor andere gezinnen.",
          "Geen berichten tussen gebruikers en geen openbare gebruikersinhoud.",
          "Geen precieze locatiegeschiedenis. We vragen hoogstens of jullie in de stad, een dorp of landelijk wonen.",
        ],
      },
      {
        heading: "Foto's en notities",
        body: [
          "Foto's die jullie uploaden zijn standaard prive en alleen zichtbaar binnen jullie eigen gezinsaccount.",
          "Bestanden worden niet vanaf een openbare URL geserveerd. Ze gaan via een route die eerst je sessie en je gezin controleert, met een link die na enkele minuten vervalt.",
          "Uploaden is nooit verplicht om een quest af te ronden.",
        ],
      },
      {
        heading: "Toestemming en zeggenschap",
        body: [
          "Bij registratie bevestigt een ouder of voogd dat hij of zij toestemming geeft voor het aanmaken van kindprofielen.",
          "Je kunt op elk moment alle gezinsgegevens exporteren als JSON-bestand.",
          "Je kunt verwijdering aanvragen. Na een wachtperiode wordt alles definitief verwijderd, inclusief opgeslagen foto's.",
        ],
      },
      {
        heading: "Wat we wel meten",
        body: [
          "We meten alleen sessies binnen Questly en wat jullie zelf als afgerond opgeven.",
          "Questly meet geen totale schermtijd en blokkeert geen andere apps. Cijfers over offline tijd zijn een schatting van het gezin zelf, geen meting.",
        ],
      },
    ],
    disclaimer:
      "Dit is een MVP. De beschreven maatregelen zijn geimplementeerd, maar er is geen juridische toetsing of certificering uitgevoerd. Voor een productielancering is een juridische review verplicht. De volledige technische onderbouwing staat in SECURITY_AND_PRIVACY.md in de broncode.",
  },
  en: {
    title: "Privacy in short",
    intro:
      "Questly is built for families with children. That places demands on what we ask, what we keep and who can reach it. Here is what we do, in plain language.",
    sections: [
      {
        heading: "What we ask of children",
        body: [
          "A child profile holds only a nickname, an avatar, an age band and interests.",
          "We do not ask for an email address, a surname or a date of birth. An age band is enough to choose suitable quests.",
          "Children have no login of their own and no public profile. Everything runs through the parent's family account.",
        ],
      },
      {
        heading: "What we do not do",
        body: [
          "No advertising profiles and no sale of data.",
          "No public leaderboards and no visibility to other families.",
          "No messages between users and no public user-generated content.",
          "No precise location history. At most we ask whether you live in a city, a village or the countryside.",
        ],
      },
      {
        heading: "Photos and notes",
        body: [
          "Photos you upload are private by default and visible only inside your own family account.",
          "Files are not served from a public URL. They go through a route that first checks your session and your family, using a link that expires after a few minutes.",
          "Uploading is never required to complete a quest.",
        ],
      },
      {
        heading: "Consent and control",
        body: [
          "At registration a parent or guardian confirms consent for creating child profiles.",
          "You can export all family data as a JSON file at any time.",
          "You can request deletion. After a waiting period everything is permanently removed, including stored photos.",
        ],
      },
      {
        heading: "What we do measure",
        body: [
          "We only measure sessions inside Questly and what you report as completed yourselves.",
          "Questly does not measure total screen time and does not block other apps. Offline-time figures are the family's own estimate, not a measurement.",
        ],
      },
    ],
    disclaimer:
      "This is an MVP. The measures described are implemented, but no legal review or certification has taken place. A legal review is required before a production launch. The full technical rationale is in SECURITY_AND_PRIVACY.md in the source code.",
  },
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  const content = CONTENT[locale];

  return (
    <div className="q-container max-w-3xl py-12">
      <h1 className="text-3xl sm:text-4xl">{content.title}</h1>
      <p className="mt-3 text-lg text-[var(--color-ink-soft)]">{content.intro}</p>

      <div className="mt-8 space-y-5">
        {content.sections.map((section) => (
          <Card key={section.heading} as="section" className="p-5">
            <h2 className="text-lg">{section.heading}</h2>
            <ul className="mt-2 space-y-2 text-[var(--color-ink-soft)]">
              {section.body.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="mt-8 rounded-xl border-l-4 border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 text-sm">
        {content.disclaimer}
      </p>
    </div>
  );
}
