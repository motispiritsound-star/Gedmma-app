#!/bin/sh
# Zet een back-up terug.
#
#   ./scripts/herstel.sh backups/gedmma-20260904T090000Z.dump [backups/opslag-....tar.gz]
#
# Dit overschrijft de huidige gegevens. Het script vraagt daarom eerst om een
# bevestiging, en het weigert te draaien zonder bestandsnaam.
set -eu

DUMP="${1:?geef het pad naar het .dump-bestand}"
OPSLAG="${2:-}"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "Dit overschrijft de database van deze omgeving met $DUMP."
printf 'Typ "ja" om door te gaan: '
read -r bevestiging
[ "$bevestiging" = "ja" ] || { echo "Afgebroken."; exit 1; }

echo "API stoppen zodat er niet wordt geschreven tijdens het terugzetten ..."
$COMPOSE stop api web

echo "Database terugzetten ..."
$COMPOSE exec -T db pg_restore -U gedmma_owner -d gedmma --clean --if-exists < "$DUMP"

if [ -n "$OPSLAG" ]; then
  echo "Documenten terugzetten ..."
  $COMPOSE run --rm --no-deps -T -v "$(cd "$(dirname "$OPSLAG")" && pwd):/backup" api \
    tar -xzf "/backup/$(basename "$OPSLAG")" -C /data
fi

echo "Alles weer starten ..."
$COMPOSE start api web

echo ""
echo "Klaar. Controleer daarna zelf:"
echo "  - klopt het aantal facturen en boekingen?"
echo "  - is het auditspoor nog ongeschonden? (Instellingen > Wat is er gebeurd)"
echo "  - zijn eerder ingediende verwijderverzoeken opnieuw uitgevoerd?"
