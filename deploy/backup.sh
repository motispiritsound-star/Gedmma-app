#!/bin/sh
# Back-up van de hele administratie: één databasebestand.
#
# SQLite draait in WAL-modus, dus een simpele kopie kan een half geschreven
# transactie meenemen. ".backup" maakt daarom een consistente kopie, ook terwijl
# het dashboard gewoon doordraait.
#
#   sudo cp deploy/backup.sh /usr/local/bin/webscan-backup
#   sudo chmod +x /usr/local/bin/webscan-backup
#   crontab -e   →   15 3 * * *  /usr/local/bin/webscan-backup
set -eu

DB="${WEBSCAN_DB:-/srv/webscan/data/webscan.db}"
DOEL="${WEBSCAN_BACKUP_DIR:-/srv/webscan/backups}"
BEWAAR_DAGEN="${WEBSCAN_BACKUP_DAYS:-30}"

mkdir -p "$DOEL"
BESTAND="$DOEL/webscan-$(date +%Y%m%d-%H%M).db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB" ".backup '$BESTAND'"
else
  # Zonder sqlite3 op de server: stop het dashboard heel even, kopieer, start weer.
  echo "sqlite3 niet gevonden — kopie zonder consistentiegarantie." >&2
  cp "$DB" "$BESTAND"
fi

gzip -f "$BESTAND"
find "$DOEL" -name 'webscan-*.db.gz' -mtime "+$BEWAAR_DAGEN" -delete

echo "Back-up: $BESTAND.gz"
# Zet hem daarna ergens ánders neer — een back-up op dezelfde server is geen back-up:
#   rclone copy "$DOEL" remote:webscan-backups
