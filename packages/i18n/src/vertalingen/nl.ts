/**
 * Nederlands: de brontaal. Elke sleutel staat hier; de andere talen vullen aan.
 *
 * Toon: gewone taal boven vakjargon. Waar een boekhoudkundige term nodig is,
 * staat er uitleg bij (sleutels op `.uitleg`).
 */
export const nl = {
  // Algemeen
  "app.naam": "Gedmma",
  "app.slogan": "Je administratie, begrijpelijk",
  "algemeen.opslaan": "Opslaan",
  "algemeen.annuleren": "Annuleren",
  "algemeen.sluiten": "Sluiten",
  "algemeen.verwijderen": "Verwijderen",
  "algemeen.bewerken": "Bewerken",
  "algemeen.terug": "Terug",
  "algemeen.volgende": "Volgende",
  "algemeen.zoeken": "Zoeken",
  "algemeen.laden": "Bezig met laden",
  "algemeen.leeg": "Er is hier nog niets",
  "algemeen.fout": "Er ging iets mis",
  "algemeen.opnieuw": "Opnieuw proberen",
  "algemeen.totaal": "Totaal",
  "algemeen.datum": "Datum",
  "algemeen.bedrag": "Bedrag",
  "algemeen.omschrijving": "Omschrijving",
  "algemeen.status": "Status",
  "algemeen.aantal": "Aantal",
  "algemeen.prijs": "Prijs",
  "algemeen.btw": "Btw",
  "algemeen.meer": "Meer",
  "algemeen.van": "van",
  "algemeen.tot": "tot en met",
  "algemeen.periode": "Periode",
  "algemeen.ja": "Ja",
  "algemeen.nee": "Nee",
  "algemeen.verplicht": "Dit veld is verplicht",
  "algemeen.exporteren": "Exporteren",
  "algemeen.downloaden": "Downloaden",

  // Navigatie
  "nav.dashboard": "Overzicht",
  "nav.verkoop": "Facturen",
  "nav.inkoop": "Bonnen en inkoop",
  "nav.bank": "Bank",
  "nav.relaties": "Klanten en leveranciers",
  "nav.rapporten": "Cijfers",
  "nav.instellingen": "Instellingen",

  // Korte varianten voor de tabbalk op een telefoon, waar de volledige naam
  // niet leesbaar past.
  "nav.kort.dashboard": "Overzicht",
  "nav.kort.verkoop": "Facturen",
  "nav.kort.inkoop": "Inkoop",
  "nav.kort.bank": "Bank",
  "nav.kort.relaties": "Klanten",
  "nav.kort.rapporten": "Cijfers",
  "nav.kort.instellingen": "Beheer",
  "nav.hoofdmenu": "Hoofdmenu",
  "nav.naarInhoud": "Naar de inhoud",
  "nav.administratieKiezen": "Administratie kiezen",
  "nav.afmelden": "Afmelden",

  // Aanmelden
  "auth.aanmelden": "Aanmelden",
  "auth.registreren": "Account aanmaken",
  "auth.email": "E-mailadres",
  "auth.wachtwoord": "Wachtwoord",
  "auth.naam": "Je naam",
  "auth.wachtwoordEis":
    "Minimaal 12 tekens. Een zin met een paar woorden werkt goed en is makkelijk te onthouden.",
  "auth.nogGeenAccount": "Nog geen account? Maak er een aan.",
  "auth.welAccount": "Heb je al een account? Meld je aan.",
  "auth.mfaTitel": "Nog een stap",
  "auth.mfaUitleg":
    "Vul de code van zes cijfers uit je authenticator-app in. Heb je die niet bij de hand, gebruik dan een herstelcode.",
  "auth.mfaCode": "Code",
  "auth.mfaBevestigen": "Bevestigen",
  "auth.mfaInstellen": "Tweestapsverificatie instellen",
  "auth.mfaUitleglang":
    "Met tweestapsverificatie kan iemand met alleen je wachtwoord niet bij je administratie. Scan de code met een authenticator-app op je telefoon.",
  "auth.mfaGeheim": "Kun je niet scannen? Voer deze sleutel handmatig in:",
  "auth.mfaHerstelcodes": "Herstelcodes",
  "auth.mfaHerstelcodesUitleg":
    "Bewaar deze codes ergens veilig, bijvoorbeeld in een kluis of wachtwoordmanager. Elke code werkt een keer en helpt je aanmelden als je je telefoon kwijt bent.",
  "auth.mfaAan": "Tweestapsverificatie staat aan",
  "auth.mfaUit": "Tweestapsverificatie staat uit",
  "auth.sessies": "Apparaten waarop je bent aangemeld",
  "auth.sessiesIntrekken": "Andere apparaten afmelden",
  "auth.registratieGelukt": "Je account is aangemaakt. Je kunt nu aanmelden.",

  // Organisatie en administratie
  "org.nieuweOrganisatie": "Nieuwe organisatie",
  "org.naam": "Naam van de organisatie",
  "org.kvk": "KVK-nummer",
  "org.abonnement": "Abonnement",
  "admin.nieuw": "Nieuwe administratie",
  "admin.naam": "Naam van de onderneming",
  "admin.rechtsvorm": "Rechtsvorm",
  "admin.schema": "Rekeningschema",
  "admin.schemaUitleg":
    "Het rekeningschema bepaalt in welke hokjes je bedragen terechtkomen. We zetten een compleet Nederlands schema voor je klaar; je kunt het altijd aanpassen.",
  "admin.btwNummer": "Btw-identificatienummer",
  "admin.adres": "Adres",
  "admin.postcodePlaats": "Postcode en plaats",
  "admin.iban": "IBAN",
  "admin.boekjaar": "Boekjaar",
  "admin.kiezen": "Kies een administratie",
  "admin.geenAdministraties":
    "Je hebt nog geen administratie. Maak er een aan om te beginnen.",
  "admin.actief": "Je werkt nu in",

  // Dashboard
  "dashboard.titel": "Hoe gaat het met je bedrijf?",
  "dashboard.omzet": "Omzet",
  "dashboard.omzetUitleg":
    "Alles wat je hebt verdiend met je werk of producten, zonder btw.",
  "dashboard.kosten": "Kosten",
  "dashboard.kostenUitleg":
    "Wat je hebt uitgegeven om je werk te kunnen doen, zonder btw.",
  "dashboard.winst": "Winst",
  "dashboard.winstUitleg":
    "Omzet min kosten. Dit is waar je uiteindelijk belasting over betaalt.",
  "dashboard.banksaldo": "Op de bank",
  "dashboard.banksaldoUitleg":
    "Het saldo volgens je boekhouding. Dat kan afwijken van je bankapp als er nog transacties open staan.",
  "dashboard.teOntvangen": "Nog te ontvangen",
  "dashboard.teOntvangenUitleg": "Geld dat klanten je nog moeten betalen.",
  "dashboard.teBetalen": "Nog te betalen",
  "dashboard.teBetalenUitleg":
    "Geld dat jij nog aan leveranciers moet betalen.",
  "dashboard.btw": "Verwachte btw",
  "dashboard.btwUitleg":
    "Wat je naar verwachting moet betalen of terugkrijgt over deze periode. Dit is een berekening, geen aangifte.",
  "dashboard.aandacht": "Dit vraagt je aandacht",
  "dashboard.teBoeken": "Banktransacties nog te verwerken",
  "dashboard.ontbrekendeBonnen": "Uitgaven zonder bonnetje",
  "dashboard.geenAandacht": "Alles is bij. Mooi werk.",
  "dashboard.vergelijking": "ten opzichte van de vorige periode",

  // Facturen
  "facturen.titel": "Facturen",
  "facturen.nieuw": "Nieuwe factuur",
  "facturen.nieuweOfferte": "Nieuwe offerte",
  "facturen.nummer": "Nummer",
  "facturen.klant": "Klant",
  "facturen.factuurdatum": "Factuurdatum",
  "facturen.vervaldatum": "Uiterlijk betalen op",
  "facturen.regels": "Wat lever je?",
  "facturen.regelToevoegen": "Regel toevoegen",
  "facturen.subtotaal": "Subtotaal",
  "facturen.totaal": "Totaal te betalen",
  "facturen.definitiefMaken": "Definitief maken",
  "facturen.definitiefUitleg":
    "Daarna krijgt de factuur een nummer en staat hij in je boekhouding. Wijzigen kan dan niet meer; corrigeren doe je met een creditnota.",
  "facturen.versturen": "Versturen naar de klant",
  "facturen.pdf": "Pdf bekijken",
  "facturen.ubl": "UBL downloaden",
  "facturen.crediteren": "Creditnota maken",
  "facturen.status.concept": "Concept",
  "facturen.status.definitief": "Definitief",
  "facturen.status.verzonden": "Verzonden",
  "facturen.status.deels_betaald": "Deels betaald",
  "facturen.status.betaald": "Betaald",
  "facturen.status.vervallen": "Te laat",
  "facturen.status.geannuleerd": "Vervallen",
  "facturen.leeg": "Je hebt nog geen facturen gemaakt.",
  "facturen.leegUitleg":
    "Maak je eerste factuur; wij zorgen dat hij goed in de boekhouding komt.",
  "facturen.referentie": "Referentie van de klant",
  "facturen.notitie": "Opmerking op de factuur",
  "facturen.openstaand": "Nog openstaand",

  // Relaties
  "relaties.titel": "Klanten en leveranciers",
  "relaties.nieuw": "Nieuwe relatie",
  "relaties.naam": "Naam",
  "relaties.soort": "Soort",
  "relaties.klant": "Klant",
  "relaties.leverancier": "Leverancier",
  "relaties.beide": "Allebei",
  "relaties.email": "E-mailadres",
  "relaties.telefoon": "Telefoon",
  "relaties.btwNummer": "Btw-nummer",
  "relaties.kvk": "KVK-nummer",
  "relaties.iban": "IBAN",
  "relaties.betalingstermijn": "Betalingstermijn in dagen",
  "relaties.leeg": "Je hebt nog geen klanten of leveranciers.",
  "relaties.dubbelWaarschuwing":
    "Er bestaat al een relatie met een vergelijkbare naam: {namen}.",
  "relaties.tochAanmaken": "Het is echt een andere partij, maak toch aan",

  // Inkoop
  "inkoop.titel": "Bonnen en inkoopfacturen",
  "inkoop.nieuw": "Bon of factuur vastleggen",
  "inkoop.leverancier": "Leverancier",
  "inkoop.factuurnummer": "Factuurnummer van de leverancier",
  "inkoop.document": "Bon of factuur (pdf of foto)",
  "inkoop.documentUitleg":
    "Bewaar altijd het originele bewijsstuk. Dat is wettelijk verplicht en je hebt het nodig bij een controle.",
  "inkoop.leeg": "Je hebt nog geen inkoopfacturen vastgelegd.",
  "inkoop.dubbel":
    "Deze leverancier heeft dit factuurnummer al eerder gestuurd.",

  // Bank
  "bank.titel": "Bank",
  "bank.importeren": "Afschrift inlezen",
  "bank.importUitleg":
    "Download een afschrift bij je bank (CSV, MT940 of CAMT.053) en sleep het hierheen.",
  "bank.teVerwerken": "Nog te verwerken",
  "bank.verwerkt": "Verwerkt",
  "bank.voorstel": "Voorstel",
  "bank.voorstelWaarom": "Waarom dit voorstel?",
  "bank.koppelen": "Koppelen",
  "bank.boeken": "Boeken",
  "bank.opRekening": "Op een rekening boeken",
  "bank.reconciliatie": "Klopt mijn banksaldo?",
  "bank.saldoGrootboek": "Volgens de boekhouding",
  "bank.saldoAfschrift": "Volgens het laatste afschrift",
  "bank.verschil": "Verschil",
  "bank.sluitAan": "Je banksaldo sluit aan op je boekhouding.",
  "bank.sluitNietAan":
    "Er zit nog verschil tussen je afschrift en je boekhouding.",
  "bank.leeg":
    "Er zijn nog geen banktransacties. Lees een afschrift in om te beginnen.",
  "bank.geimporteerd":
    "{toegevoegd} nieuwe transacties toegevoegd, {overgeslagen} stonden er al in.",

  // Rapporten
  "rapport.titel": "Cijfers",
  "rapport.balans": "Balans",
  "rapport.balansUitleg":
    "Wat je bedrijf bezit en wat het schuldig is, op een bepaalde dag.",
  "rapport.winstEnVerlies": "Winst en verlies",
  "rapport.winstEnVerliesUitleg":
    "Wat er over een periode is binnengekomen en uitgegaan.",
  "rapport.saldibalans": "Proef- en saldibalans",
  "rapport.grootboek": "Grootboek",
  "rapport.journaal": "Journaal",
  "rapport.ouderdom": "Wie moet er nog betalen?",
  "rapport.btw": "Btw-overzicht",
  "rapport.activa": "Bezittingen",
  "rapport.passiva": "Schulden en eigen vermogen",
  "rapport.opbrengsten": "Opbrengsten",
  "rapport.kosten": "Kosten",
  "rapport.resultaat": "Resultaat",
  "rapport.inBalans": "De balans sluit.",
  "rapport.nietInBalans":
    "Let op: de balans sluit niet. Neem contact op met de ondersteuning.",
  "rapport.doorklikken": "Klik op een bedrag om te zien waar het vandaan komt.",
  "rapport.vorigePeriode": "Vorige periode",
  "rapport.btwVoorbehoud":
    "Dit overzicht is een berekening op basis van je administratie en geen belastingadvies. Controleer de uitkomst, of laat een accountant of fiscalist meekijken voordat je aangifte doet.",
  "rapport.btwTeBetalen": "Te betalen",
  "rapport.btwTeVorderen": "Terug te vragen",
  "rapport.btwSaldo": "Per saldo",
  "rapport.btwAansluiting": "Aansluiting op het grootboek",
  "rapport.btwSluitAan": "Het overzicht sluit precies aan op je grootboek.",
  "rapport.geenGegevens": "Er zijn nog geen boekingen in deze periode.",

  // Instellingen
  "instellingen.titel": "Instellingen",
  "instellingen.administratie": "Gegevens van je onderneming",
  "instellingen.gebruikers": "Wie mag erbij?",
  "instellingen.beveiliging": "Beveiliging",
  "instellingen.taal": "Taal",
  "instellingen.thema": "Weergave",
  "instellingen.themaLicht": "Licht",
  "instellingen.themaDonker": "Donker",
  "instellingen.themaSysteem": "Volg mijn systeem",
  "instellingen.auditTrail": "Wat is er gebeurd?",
  "instellingen.auditUitleg":
    "Elke belangrijke handeling wordt vastgelegd en kan niet worden gewijzigd.",
  "instellingen.auditControle": "Controleer de audit trail",
  "instellingen.auditOngeschonden":
    "De audit trail is compleet en ongewijzigd.",
  "instellingen.uitnodigen": "Iemand uitnodigen",
  "instellingen.rol": "Rol",
  "instellingen.rolWijzigen": "Rol wijzigen",
  "instellingen.toegangIntrekken": "Toegang intrekken",
  "instellingen.perioden": "Perioden",
  "instellingen.periodeBlokkeren": "Blokkeren",
  "instellingen.periodeSluiten": "Sluiten",
  "instellingen.periodeHeropenen": "Heropenen",
  "instellingen.heropenReden": "Waarom moet deze periode weer open?",

  // Rollen
  "rol.owner": "Eigenaar",
  "rol.admin": "Beheerder",
  "rol.bookkeeper": "Boekhouder",
  "rol.accountant": "Accountant",
  "rol.employee": "Medewerker",
  "rol.viewer": "Meekijker",
  "rol.support": "Ondersteuning",

  // Fouten
  "fout.validation_failed": "Er klopt iets niet aan de ingevulde gegevens.",
  "fout.unauthenticated": "Je bent niet (meer) aangemeld.",
  "fout.mfa_required": "Er is nog een tweede stap nodig.",
  "fout.forbidden": "Je hebt hier geen toestemming voor.",
  "fout.not_found": "Dit bestaat niet (meer).",
  "fout.version_conflict": "Iemand anders heeft dit intussen gewijzigd.",
  "fout.duplicate_document": "Dit document bestaat al.",
  "fout.period_closed": "Deze periode is gesloten.",
  "fout.entry_not_balanced": "De boeking is niet in balans.",
  "fout.entry_immutable":
    "Deze boeking is definitief en kan niet worden gewijzigd.",
  "fout.invoice_requirements_missing":
    "De factuur mist gegevens die wettelijk verplicht zijn.",
  "fout.limit_reached": "De grens van je abonnement is bereikt.",
  "fout.rate_limited":
    "Te veel verzoeken achter elkaar. Probeer het zo opnieuw.",
  "fout.internal_error": "Er ging iets mis aan onze kant.",
  "fout.netwerk":
    "We konden de server niet bereiken. Controleer je verbinding.",
} as const;
