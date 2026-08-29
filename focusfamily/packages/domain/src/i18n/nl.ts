import type { en } from './en.js';

/**
 * Nederlandse teksten. Dezelfde sleutels als het Engelse bestand; de
 * typedefinitie hieronder dwingt af dat er niets ontbreekt of te veel staat.
 * De toon is warm en concreet: "laten we tijd samen maken", nooit een oordeel.
 */
export const nl: Record<keyof typeof en, string> = {
  'app.name': 'FocusFamily',
  'app.tagline': 'Samen tijd, samen afgesproken',
  'app.intro':
    'FocusFamily helpt een gezin om momenten zonder schermen af te spreken en die samen vol te houden. Volwassenen doen op dezelfde voorwaarden mee als de kinderen.',

  'source.self_reported.label': 'Door onszelf ingevuld',
  'source.self_reported.explanation':
    'Iemand in het gezin heeft dit ingetypt. Het is wat je je herinnert, niet wat een apparaat heeft geteld.',
  'source.app_observed.label': 'Door FocusFamily gezien',
  'source.app_observed.explanation':
    'FocusFamily heeft hiervoor de eigen timer bijgehouden. De app weet alleen van focusmomenten in deze app, verder niets.',
  'source.os_verified.label': 'Door de telefoon gemeld',
  'source.os_verified.explanation':
    'Het besturingssysteem heeft dit gemeld nadat iedereen daarmee akkoord ging. Het is een totaal per brede categorie, nooit een lijst met apps of websites.',
  'source.simulated.label': 'Voorbeeldgegevens',
  'source.simulated.explanation':
    'Dit zijn verzonnen demogegevens zodat je ziet hoe een scherm eruitziet. Ze gaan over niemand in dit gezin.',
  'confidence.low': 'Ruwe indicatie',
  'confidence.medium': 'Redelijke indicatie',
  'confidence.high': 'Gemeten',

  'authz.allowed': 'Toegestaan',
  'authz.capability_not_offered':
    'Dit biedt FocusFamily niet. Berichten lezen, browsergeschiedenis of live locatie horen niet bij dit product.',
  'authz.unknown_action': 'Onbekende actie',
  'authz.admin_only': 'Alleen medewerkers van de helpdesk openen dit, en nooit gezinsinhoud.',
  'authz.admin_has_no_family_access': 'De helpdesk kan geen gezinsinhoud openen.',
  'authz.guardian_only': 'Een volwassene in het gezin doet deze stap.',
  'authz.other_family': 'Dit hoort bij een ander gezin.',
  'authz.not_permitted': 'Niet beschikbaar voor dit account.',
  'authz.child_not_permitted': 'Een volwassene in het gezin doet deze stap samen met jou.',
  'authz.self_only': 'Dit kun je alleen voor jezelf doen.',
  'authz.no_membership': 'Je hoort nog niet bij dit gezin.',

  'consent.effective': 'Iedereen die het aangaat heeft ja gezegd.',
  'consent.missing_self': 'Je hebt hier nog geen ja op gegeven.',
  'consent.missing_guardian': 'Een volwassene moet hier nog ja op zeggen.',
  'consent.missing_child_assent':
    'We vragen het ook aan degene om wie het gaat. Er wordt niets bijgehouden tot die ja zegt.',
  'consent.not_required_simulated': 'Voor voorbeeldgegevens is geen akkoord nodig.',
  'consent.statement.account.basic':
    'We bewaren je naam, je taal en wie er bij je gezin horen, zodat de app werkt.',
  'consent.statement.measurement.self_report':
    'Je mag je eigen schermtijd, slaap en stemming invullen. Je kunt daar altijd mee stoppen.',
  'consent.statement.measurement.app_observed':
    'FocusFamily legt vast wanneer een focusmoment begint, pauzeert en eindigt. Alleen binnen deze app.',
  'consent.statement.measurement.os_verified':
    'De telefoon meldt dagtotalen per brede categorie. Nooit welke app, welke site of welk bericht.',
  'consent.statement.notifications.push':
    'We mogen je een herinnering sturen. Stille uren gaan altijd voor.',
  'consent.statement.insights.weekly_review':
    'We zetten je week om in een gespreksagenda voor het gezin.',
  'consent.statement.ai.assistant':
    'Een AI-hulp mag één kleine verandering voorstellen, alleen op basis van de totalen die hier staan. Staat uit tenzij je hem aanzet.',
  'consent.withdraw.hint':
    'Als je dit uitzet, stopt het bijhouden meteen. Wat al verzameld is, kun je op hetzelfde scherm verwijderen.',

  'baseline.not_started': 'Jullie rustige eerste week is nog niet begonnen.',
  'baseline.active':
    'Rustige eerste week. We stellen nog niets voor - raak gewend aan de app en praat erover.',
  'baseline.complete': 'De eerste week zit erop. Jullie kunnen nu een afspraak maken.',

  'agreement.issue.no_rules': 'Voeg minstens één ding toe dat jullie afspreken.',
  'agreement.issue.adults_not_included':
    'Minstens één regel moet ook voor de volwassenen gelden. Zo werkt deze app.',
  'agreement.issue.children_only_context':
    'Dit deel van de dag vraagt alleen iets van de kinderen. Voeg een regel toe voor de volwassenen.',
  'agreement.issue.window_too_long':
    'Dat tijdvak beslaat bijna de hele dag. Kortere momenten houd je makkelijker vol.',
  'agreement.not_activatable': 'Deze afspraak is nog niet klaar.',
  'agreement.member_required': 'Kies over wie deze regel gaat.',
  'agreement.window_incomplete': 'Vul zowel een begin- als een eindtijd in.',
  'agreement.variation.8_10': 'Voor de jongsten',
  'agreement.variation.11_13': 'Voor 11 tot 13 jaar',
  'agreement.variation.14_17': 'Voor 14 tot 17 jaar',
  'agreement.variation.adult': 'Voor de volwassenen',

  'template.meals.text': 'Tijdens het eten liggen alle telefoons in de mand in de gang.',
  'template.meals.repair':
    'Vergeet iemand het, dan legt die hem weg en eten we door. Verder gebeurt er niets.',
  'template.homework.text':
    'Het huiswerkuur is stil voor iedereen: geen video, geen berichten, ook niet voor volwassenen.',
  'template.homework.repair': 'Lukt het vandaag niet, dan proberen we het morgen opnieuw.',
  'template.bedtime.text':
    'Vanaf negen uur laadt elke telefoon op in de keuken, die van ons ook.',
  'template.bedtime.repair': 'Vergeten? Breng hem naar beneden zodra je het merkt.',
  'template.bedrooms.text': "'s Nachts blijven slaapkamers schermvrij, voor ons allemaal.",
  'template.bedrooms.repair': 'We herinneren elkaar er vriendelijk aan, één keer.',
  'template.school.text':
    'Een nieuwe app zetten we samen op de telefoon en bekijken we vijf minuten.',
  'template.school.repair':
    'Al iets geïnstalleerd? Laat het zien, dan kijken we er samen naar.',
  'template.family_activities.text':
    'Eén keer per weekend doen we samen iets zonder schermen.',
  'template.family_activities.repair':
    'Een druk weekend komt voor. Dan kiezen we een nieuw moment.',

  'focus.not_a_participant': 'Je doet niet mee aan dit focusmoment.',
  'focus.title.dinner': 'Samen eten',
  'focus.title.homework': 'Huiswerkuur',
  'focus.title.bedtime': 'Tot rust komen',
  'focus.title.family_time': 'Gezinstijd',
  'focus.title.custom': 'Ons eigen moment',
  'focus.start': 'Samen starten',
  'focus.pause': 'Pauze',
  'focus.resume': 'Verder gaan',
  'focus.complete': 'Het is gelukt',
  'focus.abandon': 'Nu stoppen',
  'focus.offline_note':
    'Geen verbinding? De timer loopt door op dit apparaat en synchroniseert later.',
  'focus.pause.someone_needed_me': 'Iemand had me nodig',
  'focus.pause.urgent_call': 'Een telefoontje dat niet kon wachten',
  'focus.pause.schoolwork': 'Iets voor school',
  'focus.pause.changed_my_mind': 'We zijn van gedachten veranderd',
  'focus.pause.other': 'Iets anders',
  'focus.pause.prompt': 'Geen probleem. Wat kwam ertussen?',

  'checkin.title': 'Hoe was vandaag?',
  'checkin.intro':
    'Drie korte vragen. Je antwoorden blijven van jou, tenzij je ze deelt.',
  'checkin.sleep': 'Hoeveel uur heb je ongeveer geslapen?',
  'checkin.mood': 'Hoe voelde vandaag?',
  'checkin.conflict': 'Was er vandaag gedoe over schermen?',
  'checkin.mood.1': 'Een zware dag',
  'checkin.mood.2': 'Niet mijn beste',
  'checkin.mood.3': 'Ertussenin',
  'checkin.mood.4': 'Best goed',
  'checkin.mood.5': 'Echt goed',
  'checkin.conflict.none': 'Nee',
  'checkin.conflict.a_little': 'Een beetje',
  'checkin.conflict.quite_a_bit': 'Behoorlijk',
  'checkin.share': 'Dit delen met het gezin',
  'checkin.private_note': 'Je notitie blijft privé tenzij je het vakje aanvinkt.',
  'copy.clinical_or_shaming': 'Deze woorden leggen we niet voor aan een gezin.',

  'review.title': 'Jullie week samen',
  'review.intro':
    'Geen cijfers en geen totaal om te verslaan. Lees het hardop voor aan tafel en kies één ding.',
  'review.well.focus_moments': 'Jullie hebben focusmomenten samen afgemaakt.',
  'review.well.adults_joined': 'De volwassenen deden mee.',
  'review.well.goal_progress': 'Jullie gezamenlijke doel is opgeschoten.',
  'review.well.checkins': 'Iemand heeft ingevuld hoe de dag ging.',
  'review.well.you_showed_up': 'Jullie openden de app samen. Dat is een begin.',
  'review.talk.what_was_easy': 'Wat ging deze week vanzelf?',
  'review.talk.what_got_in_the_way': 'Wat kwam ertussen als het niet lukte?',
  'review.talk.tense_moment': 'Er was wat gedoe. Wat gebeurde er vlak daarvoor?',
  'review.talk.adults_next_week': 'Hoe doen de volwassenen volgende week meer mee?',
  'review.talk.one_change': 'Welk klein ding veranderen we voor volgende week?',
  'review.figure.focus_moments_completed': 'Focusmomenten afgemaakt',
  'review.figure.focus_moments_started': 'Focusmomenten gestart',
  'review.figure.average_sleep': 'Gemiddelde slaap (uren)',
  'review.figure.average_mood': 'Gemiddeld gevoel (1-5)',
  'review.figure.active_agreements': 'Afspraken die gelden',
  'review.data_note.no_os_data':
    'Deze week gebruikt wat jullie zelf invulden en wat de timer van de app zag. Geen telefoon heeft iets gemeld.',
  'review.data_note.mixed_with_os':
    'Deze week combineert wat jullie invulden, wat de timer zag en wat de telefoon meldde. Bij elk getal staat welke.',

  'goal.kind.device_free_dinners': 'Maaltijden zonder apparaten',
  'goal.kind.screen_free_evenings': 'Avonden zonder schermen',
  'goal.kind.shared_activities': 'Dingen die we samen deden',
  'goal.kind.bedtime_routine': 'Op tijd tot rust komen',
  'goal.kind.outdoor_time': 'Tijd buiten',
  'celebration.goal.title': 'Samen gehaald',
  'celebration.goal.body':
    'Jullie gezin heeft het gehaald. Deze kaart blijft binnen jullie gezin.',
  'celebration.goal.body_everyone':
    'Iedereen deed mee, de volwassenen ook. Deze kaart blijft binnen jullie gezin.',
  'celebration.private_note': 'Niemand buiten jullie gezin ziet dit.',

  'recommendation.add_adult_rule.title': 'Voeg één regel toe voor de volwassenen',
  'recommendation.add_adult_rule.body':
    'Kies iets wat jullie al aan de kinderen vragen en schrijf het ook voor jezelf op.',
  'recommendation.add_adult_rule.reason':
    'In jullie geldende afspraak staat geen regel die voor een volwassene geldt.',
  'recommendation.invite_second_guardian.title': 'Nodig de andere volwassene uit',
  'recommendation.invite_second_guardian.body':
    'Afspraken houden beter stand als beide volwassenen ze kunnen zien en aanpassen.',
  'recommendation.invite_second_guardian.reason':
    'Er staat één volwassene bij dit account.',
  'recommendation.shorten_focus.title': 'Probeer een korter moment',
  'recommendation.shorten_focus.body':
    'Halveer de tijd een week lang. Een kort moment dat lukt is meer waard dan een lang moment dat je afbreekt.',
  'recommendation.shorten_focus.reason':
    'Minder dan de helft van de gestarte focusmomenten werd afgemaakt.',
  'recommendation.schedule_dinner.title': 'Zet één maaltijd in de agenda',
  'recommendation.schedule_dinner.body':
    'Eén vaste avond per week is genoeg om te beginnen. Kies de makkelijkste.',
  'recommendation.schedule_dinner.reason':
    'Er staat nog geen gezamenlijk eetmoment in de agenda.',
  'recommendation.bedtime_charging.title': 'Zet de opladers uit de slaapkamers',
  'recommendation.bedtime_charging.body':
    'Laad elke telefoon op één plek beneden op, die van jullie ook. Veel gezinnen vinden de avond dan rustiger.',
  'recommendation.bedtime_charging.reason':
    'De ingevulde slaapuren waren deze week gemiddeld korter dan acht, en er is nog geen afspraak over opladen.',
  'recommendation.good_week.title': 'Praat over wat werkte',
  'recommendation.good_week.body':
    'Jullie hebben deze week focusmomenten afgemaakt. Vraag iedereen welk moment die zou willen houden.',
  'recommendation.good_week.reason': 'Er zijn deze week focusmomenten afgemaakt.',
  'recommendation.engine_note':
    'Dit voorstel komt uit een vaste set regels en gebruikt alleen de feiten die eronder staan.',

  'adapter.mock.not_a_measurement':
    'Dit apparaat toont voorbeeldgegevens. Niets hiervan gaat over een echt persoon.',
  'adapter.mock.not_authorized': 'Voorbeeldgegevens staan uit voor dit apparaat.',
  'adapter.ios.not_authorized': 'Schermtijd-toegang is op deze iPhone niet gegeven.',
  'adapter.android.no_usage_access': 'Gebruikstoegang is op deze telefoon niet gegeven.',
  'adapter.android.shield_unsupported':
    'Android kan andere apps niet voor ons pauzeren. Een focusmoment is hier een belofte die we samen houden.',
  'adapter.none.platform_unsupported':
    'Dit apparaat kan geen schermtijd aan ons melden. Je kunt je eigen getallen invullen.',
  'adapter.none.self_report_instead': 'Vul in plaats daarvan je eigen getallen in.',
  'native.ios.requires_family_controls_entitlement':
    'Apple moet deze app het Family Controls-recht geven voordat een iPhone totalen kan melden.',
  'native.ios.requires_development_build':
    'Schermtijd-toegang vraagt om een development build; in Expo Go werkt het niet.',
  'native.ios.category_granularity_only':
    'Apple meldt alleen brede categorieën. FocusFamily krijgt nooit een lijst met apps.',
  'native.ios.no_per_app_detail_shared': 'Details per app blijven op het apparaat.',
  'native.android.requires_usage_access':
    'Android vraagt je om gebruikstoegang te geven in Instellingen. We brengen je erheen en leggen eerst uit waarom.',
  'native.android.no_third_party_shield':
    'Android biedt ons geen ondersteunde manier om andere apps te pauzeren.',
  'native.android.oem_variation':
    'Sommige fabrikanten wijzigen of verwijderen deze cijfers. Dan tonen we niets in plaats van een schatting.',

  'notification.channel_off': 'Meldingen staan uit voor dit account.',
  'notification.category_off': 'Dit soort melding staat uit.',
  'notification.quiet_hours': 'Vastgehouden tot de stille uren voorbij zijn.',
  'notification.security': 'Bericht over accountbeveiliging.',
  'notification.ok': 'Verstuurd.',
  'notification.category.focus_reminder': 'Focusmoment begint',
  'notification.category.checkin_invite': 'Herinnering voor de check-in',
  'notification.category.weekly_review_ready': 'Weekoverzicht klaar',
  'notification.category.agreement_change_proposed': 'Iemand stelt een wijziging voor',
  'notification.category.celebration': 'Iets om te vieren',
  'notification.category.account_security': 'Accountbeveiliging',

  'billing.upgrade_needed': 'Dit hoort bij Family Premium.',
  'billing.unknown_session': 'We konden die afrekensessie niet vinden.',
  'billing.plan.free': 'Gratis',
  'billing.plan.family_premium': 'Family Premium',
  'billing.plan.sponsored': 'Betaald door een werkgever of school',
  'billing.free_forever':
    'Eén afspraak, focusmomenten, check-ins, het weekoverzicht, exporteren en verwijderen zijn gratis en blijven gratis.',
  'billing.no_ads':
    'Geen advertenties, en we verkopen nooit gegevens over jullie gezin.',
  'billing.test_mode': 'Testmodus. Er gaat geen geld heen en weer.',

  'rights.export.title': 'Download je gegevens',
  'rights.export.body': 'Een JSON-bestand met alles wat we over je bewaren.',
  'rights.deletion.title': 'Gegevens verwijderen',
  'rights.deletion.body':
    'We wachten zeven dagen zodat je je kunt bedenken, daarna is het definitief weg.',
  'rights.deletion.scheduled':
    'Het verwijderen staat gepland. Je kunt het tot die tijd annuleren.',
  'rights.not_collected.title': 'Wat we nooit bewaren',
  'rights.consent_history.title': 'Wat is afgesproken, en wanneer',
  'id.format': 'Dat kenmerk klopt niet.',
  'time.format': 'Gebruik een tijd zoals 19:30.',
};
