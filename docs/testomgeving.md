# Een testomgeving online zetten

Dit is de weg van niets naar een werkende omgeving op je eigen domein, waar een
accountant of een eerste klant zelf kan rondkijken. Reken op een half uur.

Voor de bredere achtergrond (instellingen, migraties, terugdraaien, monitoring)
zie [deployment.md](deployment.md). Dit document is de korte, concrete route.

## Wat je nodig hebt

| Wat | Waar | Ongeveer |
| --- | --- | --- |
| Een kleine Linux-server (2 vCPU, 4 GB, 40 GB schijf) | zie de tabel hieronder | € 5 – 25 per maand |
| Een domeinnaam of subdomein | Je eigen registrar | € 10 per jaar |
| Docker en Docker Compose op die server | staat vaak al klaar in het image | — |

Kies een datacenter in Nederland of elders in de EER. Dat scheelt de discussie
over doorgifte buiten de EER, en het is sneller voor Nederlandse gebruikers.

## 1. Server bestellen

De provider is inwisselbaar: Mizen draait op elke gewone Linux-server met Docker.
Waar het om gaat is Ubuntu 24.04 LTS, 2 vCPU, 4 GB geheugen, 40 GB schijf en een
datacenter in de EER. Deze zes voldoen daaraan.

| Provider | Locatie | Ongeveer |
| --- | --- | --- |
| Hetzner | Falkenstein, Nuremberg, Helsinki | € 4 per maand |
| OVHcloud | Frankrijk, Duitsland | € 8 per maand |
| Scaleway | Amsterdam, Parijs | € 10 per maand |
| Vultr | Amsterdam | € 19 per maand |
| DigitalOcean | Amsterdam | € 22 per maand |
| TransIP | Nederland | € 26 per maand |

De prijzen zijn een orde van grootte, geen offerte; kijk bij de provider zelf wat
het vandaag kost. Het prijsverschil zit in support, netwerk en of je in Nederland
zelf wilt staan, niet in of het werkt.

Is een servertype niet beschikbaar of uitverkocht, dan zit meestal één datacenter
vol. Kies een andere locatie, een maat groter, of een andere provider uit de
tabel; de stappen hierna zijn voor alle zes gelijk.

### Bij Hetzner Cloud

Ga naar [console.hetzner.cloud](https://console.hetzner.cloud), maak een project
en klik op **Add Server**:

| Onderdeel | Wat je kiest |
| --- | --- |
| Location | Falkenstein, Nuremberg of Helsinki |
| Image | Ubuntu 24.04 |
| Type | Shared vCPU → **x86** → **CX22** |
| Networking | IPv4 en IPv6 aan laten staan |
| SSH keys | je publieke sleutel plakken |
| Volumes, Firewalls, Backups | overslaan |

De CX22 heeft 2 vCPU, 4 GB geheugen, 40 GB schijf en 20 TB verkeer. Kies bewust
de x86-reeks en niet CAX: die draait op Arm, en daar is dit pakket niet op
getest.

Voeg bij het bestellen je SSH-sleutel toe; log niet in met een wachtwoord. Laat
je dat veld leeg, dan mailt Hetzner een root-wachtwoord — precies wat je hier
niet wilt.

Heb je nog geen sleutel, maak er dan een. Op Windows in PowerShell (Windows-toets,
`powershell`, Enter), op macOS in Terminal (Cmd + spatie, `terminal`, Enter):

```bash
ssh-keygen -t ed25519 -C "mizen"
```

Er volgen drie vragen:

| Vraag | Antwoord |
| --- | --- |
| `Enter file in which to save the key` | alleen Enter; de standaardplek is goed |
| `Enter passphrase` | een wachtwoordzin, of alleen Enter voor geen |
| `Enter same passphrase again` | hetzelfde nog een keer |

Terwijl je een wachtwoordzin typt beweegt er niets op het scherm; dat hoort zo.
Met een wachtwoordzin typ je hem bij elke verbinding. Zonder gaat het makkelijker,
maar dan geeft je laptop rechtstreeks toegang tot de server. Voor een testomgeving
is dat te doen; zodra er echte klantgegevens in staan, neem een wachtwoordzin.

Daarna de publieke sleutel ophalen — deze zet hem meteen op je klembord:

```bash
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard   # Windows, PowerShell
pbcopy < ~/.ssh/id_ed25519.pub                      # macOS
cat ~/.ssh/id_ed25519.pub                           # of gewoon tonen
```

Wat je krijgt is één regel die begint met `ssh-ed25519` en eindigt op `mizen`.
Die hele regel plak je bij de provider.

Er staan twee bestanden in `~/.ssh`. Alleen `id_ed25519.pub` gaat naar de
provider. `id_ed25519` zonder `.pub` is de privésleutel: die blijft op je eigen
computer en gaat nergens anders heen — geen formulier, geen e-mail, geen chat.

Staat er `already exists. Overwrite (y/n)?`, dan heb je al een sleutel: typ `n`
en gebruik de bestaande. Kent je Windows het commando niet, installeer dan
[Git voor Windows](https://git-scm.com/download/win) en gebruik Git Bash.

## 2. Domein en DNS

Heb je nog geen domein, neem er een bij een registrar. Cloudproviders zijn dat
meestal niet: Hetzner Cloud verkoopt geen domeinen, dus koop je hem los bij
bijvoorbeeld TransIP, Versio, Mijndomein of Hostnet. Een `.nl` kost rond de € 10
per jaar.

Laat het DNS-beheer bij die registrar staan. Je wijst daar één record naar het
IP-adres van je server; nameservers verhuizen naar de cloudprovider levert je
hier niets op.

Eén domein is genoeg per product, niet per omgeving. Onder een domein maak je
zoveel subdomeinen als je wilt, gratis en direct: `mizen.nl` levert ook
`test.mizen.nl`, `demo.mizen.nl` en `app.mizen.nl` op. Een tweede product krijgt
een eigen domein; een tweede omgeving niet.

Zet bij je domeinregistrar één record:

| Type | Naam | TTL | Waarde |
| --- | --- | --- | --- |
| A | `test` | 300 | het IPv4-adres van je server |

Houd de TTL laag zolang je aan het uitproberen bent: een fout is dan binnen vijf
minuten hersteld in plaats van pas de volgende dag. Heb je ook IPv6, zet er dan
een `AAAA`-record bij met dat adres.

Controleer daarna — `nslookup` zit standaard op zowel Windows als macOS, `dig`
niet:

```bash
nslookup test.jouwdomein.nl
```

Zolang hier niet het adres van je server uit komt, heeft verdergaan geen zin: het
certificaat kan dan niet worden aangevraagd, en Let's Encrypt zet je na een
handvol mislukte pogingen tijdelijk op de wachtbank. Vers bestelde domeinen
hebben soms een half uur nodig.

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

## 4. Mizen neerzetten

```bash
git clone <deze repository> /opt/mizen
cd /opt/mizen

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
./scripts/backup.sh /opt/mizen-backups
```

Zet een dagelijkse taak neer en kopieer de bestanden naar een andere plek:

```bash
crontab -e
# elke nacht om 03:15
15 3 * * * cd /opt/mizen && ./scripts/backup.sh /opt/mizen-backups >> /var/log/mizen-backup.log 2>&1
```

Terugzetten gaat met `./scripts/herstel.sh`. Probeer dat een keer op een lege
server voordat je het nodig hebt; zie [disaster-recovery.md](disaster-recovery.md).

## 8. Bijwerken naar een nieuwe versie

```bash
cd /opt/mizen
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
