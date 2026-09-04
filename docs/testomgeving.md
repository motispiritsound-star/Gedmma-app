# Een testomgeving online zetten

Dit is de weg van niets naar een werkende omgeving op je eigen domein, waar een
accountant of een eerste klant zelf kan rondkijken. Reken op een half uur.

Voor de bredere achtergrond (instellingen, migraties, terugdraaien, monitoring)
zie [deployment.md](deployment.md). Dit document is de korte, concrete route.

## Wat je nodig hebt

| Wat | Waar | Ongeveer |
| --- | --- | --- |
| Een kleine Linux-server (2 vCPU, 4 GB, 40 GB schijf) | Hetzner, TransIP, DigitalOcean, Vultr | € 5 – 10 per maand |
| Een domeinnaam of subdomein | Je eigen registrar | € 10 per jaar |
| Docker en Docker Compose op die server | staat vaak al klaar in het image | — |

Kies een datacenter in Nederland of elders in de EER. Dat scheelt de discussie
over doorgifte buiten de EER, en het is sneller voor Nederlandse gebruikers.

## 1. Server bestellen

Neem Ubuntu 24.04 LTS. Voeg bij het bestellen je SSH-sleutel toe; log niet in
met een wachtwoord.

Heb je nog geen sleutel:

```bash
ssh-keygen -t ed25519 -C "gedmma"
cat ~/.ssh/id_ed25519.pub    # deze regel plak je bij de provider
```

## 2. DNS instellen

Zet bij je domeinregistrar één record:

| Type | Naam | Waarde |
| --- | --- | --- |
| A | `test` | het IPv4-adres van je server |

Heb je ook IPv6, zet er dan een `AAAA`-record bij. Controleer daarna:

```bash
dig +short test.jouwdomein.nl
```

Zolang hier niet het adres van je server uit komt, heeft verdergaan geen zin:
het certificaat kan dan niet worden aangevraagd. DNS heeft soms een paar minuten
nodig.

## 3. Server klaarmaken

```bash
ssh root@<ip-van-je-server>

# Bijwerken en Docker installeren
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh

# Firewall: alleen SSH en web naar buiten open
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Automatische beveiligingsupdates
apt install -y unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades
```

De database en de API publiceren geen poort naar buiten; alleen Caddy luistert
op 80 en 443. Poort 5432 hoort nooit open te staan.

## 4. Gedmma neerzetten

```bash
git clone <deze repository> /opt/gedmma
cd /opt/gedmma

# Geheimen genereren en het instellingenbestand vullen
cp .env.productie.example .env
npm run geheimen >> .env      # of: node scripts/geheimen.js >> .env
nano .env                     # DOMEIN, BEHEER_EMAIL en de lege regels invullen
```

In `.env` moeten in elk geval staan: `DOMEIN`, `BEHEER_EMAIL`, en de vier
geheimen. Verwijder de lege regels die je met de gegenereerde waarden hebt
gedubbeld.

Zet `REGISTRATIE_OPEN=ja` — alleen even, om het eerste account aan te maken.

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f api
```

De eerste keer duurt het bouwen een paar minuten. Caddy vraagt intussen het
certificaat aan. Als `https://test.jouwdomein.nl` een slotje toont, staat hij.

## 5. Het eerste account en de demo-administratie

Ga naar `https://test.jouwdomein.nl`, kies "Nog geen account? Maak er een aan"
en maak jouw eigen account. Dat wordt de eigenaar van de organisatie.

Vul daarna de demo-administratie. Het demoscript zit in de container:

```bash
docker compose -f docker-compose.prod.yml exec api node scripts/demo.js
```

Dat maakt een tweede account (`demo@voorbeeld.test`) met een gevulde
administratie: een ontwerpstudio met tien facturen, acht inkoopbonnen, een
ingelezen bankafschrift en 46 uur op drie projecten. Het script noemt aan het
eind het wachtwoord.

**Zet daarna registratie dicht.** Vanaf dat moment komt er alleen iemand binnen
die je zelf uitnodigt:

```bash
nano .env                     # REGISTRATIE_OPEN=nee
docker compose -f docker-compose.prod.yml up -d api
```

Controleer dat het werkt: op het aanmeldscherm hoort "Nog geen account?" nu een
melding te geven dat je een uitnodiging nodig hebt.

## 6. De accountant uitnodigen

In de applicatie: **Instellingen → Wie mag erbij → Uitnodigen**. Kies de rol
**Accountant**: die mag boeken, rapporteren en perioden heropenen, maar geen
gebruikers beheren.

Staat `MAIL_DRIVER=logboek`, dan wordt de uitnodigingsmail niet verstuurd maar
in de log geschreven. De link haal je er zo uit:

```bash
docker compose -f docker-compose.prod.yml logs api | grep -i uitnodiging | tail -5
```

Stuur die link zelf door. Wil je echte e-mail, zet dan `MAIL_DRIVER=smtp` en vul
`SMTP_URL` in.

Geef er het testscript bij: [testscript-accountant.md](testscript-accountant.md).

## 7. Back-ups

Zolang het een proefopstelling met verzonnen gegevens is, is een back-up vooral
oefenen. Doe het toch — dan weet je dat het werkt voordat het ertoe doet.

```bash
./scripts/backup.sh /opt/gedmma-backups
```

Zet een dagelijkse taak neer en kopieer de bestanden naar een andere plek:

```bash
crontab -e
# elke nacht om 03:15
15 3 * * * cd /opt/gedmma && ./scripts/backup.sh /opt/gedmma-backups >> /var/log/gedmma-backup.log 2>&1
```

Terugzetten gaat met `./scripts/herstel.sh`. Probeer dat een keer op een lege
server voordat je het nodig hebt; zie [disaster-recovery.md](disaster-recovery.md).

## 8. Bijwerken naar een nieuwe versie

```bash
cd /opt/gedmma
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Migraties draaien automatisch bij het starten van de API. Ze zijn voorwaarts:
een nieuwe versie voegt toe, verwijdert niets van wat een oudere versie nodig
had. Terugdraaien staat in [deployment.md](deployment.md#terugdraaien).

## Wat deze omgeving wél en niet is

**Wel**: een echte installatie van de volledige applicatie, met HTTPS, een eigen
database, back-ups en dezelfde code als in dit repository.

**Niet**: een omgeving die geschikt is voor een echte administratie van een
klant. Daarvoor ontbreken nog:

* een juridische toets van de compliancedocumentatie (zie
  [compliance-matrix.md](compliance-matrix.md) — geen enkele regel is
  geverifieerd);
* een verwerkersovereenkomst met wie de gegevens erin zet;
* bewaakte back-ups met een aantoonbare hersteltest;
* monitoring en een piketregeling als er 's nachts iets omvalt;
* versleuteling in rust op schijfniveau en een sleutelbeheerproces.

Zet er daarom verzonnen gegevens in, en houd `OMGEVING_LABEL` gevuld zodat
iedereen die inlogt ziet waar hij is.

## Als er iets misgaat

| Wat je ziet | Waar het meestal aan ligt |
| --- | --- |
| Geen slotje, "certificaat kon niet worden aangevraagd" | DNS wijst nog niet naar de server, of poort 80 is dicht |
| "De database is niet bereikbaar" op `/health/ready` | De database start nog; `docker compose logs db` |
| Aanmelden lukt niet, wel een account aangemaakt | `REGISTRATIE_OPEN` stond dicht toen je het account maakte |
| Alles traag na een tijd | Schijf vol door logs; `docker system prune` en logrotatie instellen |

Controleer de gezondheid van de API met:

```bash
curl -s https://test.jouwdomein.nl/health/ready
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 50 api
```

Een gezond antwoord ziet er zo uit:

```json
{ "status": "ok", "migraties": 9 }
```
