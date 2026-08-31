// Kleine hulpjes die de databestanden delen.

/**
 * Een opzoektabel zonder prototype.
 *
 * Met een gewoon object geeft tabel['constructor'] de functie Object terug —
 * waar dus geen letter staat. De app leest een id uit het adres (#/letters/…)
 * en toetst met `if (!l) return`; die toets slaagt dan ten onrechte en het
 * scherm klapt er even later op stuk. Zonder prototype geeft elke onbekende
 * sleutel netjes undefined.
 */
export const opSleutel = (lijst, sleutel = 'id') =>
  Object.assign(Object.create(null), Object.fromEntries(lijst.map((x) => [x[sleutel], x])));
