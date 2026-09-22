# De platen bij de twee reeksen

Hier horen twee bestanden:

| Bestand | Waar het staat |
| --- | --- |
| `sba.webp` | Bij *Sba de Atlasleeuw* op `/leesboeken` |
| `sleutel.webp` | Bij *De sleutels van Marokko* op `/leesboeken` |

**Ze staan er.** De twee platen hieronder zijn de geschilderde versies; valt er
ooit een weg, dan valt de pagina terug op de vectortekening en is de site niet
kapot, alleen minder mooi.
dan niet kapot, alleen minder mooi — dat is met opzet, zodat een ontbrekend
bestand nooit een gat in de etalage slaat.

**Formaat.** Liggend, ongeveer 3:2 of 4:3, minstens 1200 pixels breed.
`.webp` op kwaliteit 82 is ruim genoeg en blijft onder de 200 kB; een plaat
van twee megabyte laat de pagina op een telefoon in de wachtstand staan.

Omzetten kan met:

```bash
cwebp -q 82 -resize 1400 0 sba.png -o site-assets/boeken/sba.webp
```

Daarna `npm run site` en de plaat staat erin.
