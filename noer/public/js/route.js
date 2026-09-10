// Navigeren binnen de app. Dit staat apart van app.js zodat schermen niet
// terug hoeven te grijpen naar de router die ze zelf tekent — dat maakt een
// kringetje in de imports, en daar struikelt elke bundelaar over.

export const ga = (pad) => { window.location.hash = pad; };

/** Het huidige pad, zonder de #. */
export const huidigPad = () => window.location.hash.slice(1) || '/thuis';
