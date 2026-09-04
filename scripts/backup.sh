#!/bin/sh
# Maakt een back-up van de database en van de geüploade documenten.
#
#   ./scripts/backup.sh [map]
#
# De back-up is versleuteld noch verkleind: doe dat in de opslag waar hij
# terechtkomt. Zet hem niet op dezelfde server als de database; een back-up die
# samen met het origineel verdwijnt is geen back-up.
#
# Terugzetten: zie scripts/herstel.sh en docs/disaster-recovery.md.
set -eu

MAP="${1:-./backups}"
STEMPEL="$(date -u +%Y%m%dT%H%M%SZ)"
COMPOSE="docker compose -f docker-compose.prod.yml"

mkdir -p "$MAP"

echo "Database wegschrijven ..."
$COMPOSE exec -T db pg_dump -U gedmma_owner -d gedmma --format=custom \
  > "$MAP/gedmma-$STEMPEL.dump"

echo "Documenten wegschrijven ..."
$COMPOSE run --rm --no-deps -T -v "$(cd "$MAP" && pwd):/backup" api \
  tar -czf "/backup/opslag-$STEMPEL.tar.gz" -C /data opslag

echo ""
echo "Klaar:"
ls -lh "$MAP/gedmma-$STEMPEL.dump" "$MAP/opslag-$STEMPEL.tar.gz"
echo ""
echo "Zet deze bestanden weg op een andere plek dan deze server."
echo "Controleer minstens eens per kwartaal of terugzetten ook echt werkt."
