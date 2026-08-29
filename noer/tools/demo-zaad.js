// Alleen voor de demo-bundel: als er nog niets in dit apparaat staat, zet er
// dan één ingevuld profiel neer. Zo ziet iemand die de demo opent meteen een
// app die geleefd heeft, in plaats van een leeg scherm.
//
// Heeft de bezoeker al eens geoefend, dan blijft die voortgang met rust.
(function () {
  var SLEUTEL = 'noer.v1';
  try {
    if (localStorage.getItem(SLEUTEL)) return;
  } catch (e) {
    return; // privévenster of opslag geblokkeerd: dan gewoon leeg beginnen
  }

  var dag = function (terug) {
    var d = new Date();
    d.setDate(d.getDate() - terug);
    return d.toISOString().slice(0, 10);
  };

  // Zeven dagen oefenen, met één rustdag ertussen.
  var dagen = {};
  var reeks = [[6, 11, 2, 540], [5, 9, 3, 420], [4, 0, 0, 0], [3, 14, 4, 660],
               [2, 10, 1, 480], [1, 12, 3, 600], [0, 8, 2, 360]];
  reeks.forEach(function (r) {
    if (!r[3]) return;
    dagen[dag(r[0])] = { seconden: r[3], goed: r[1], fout: r[2] };
  });

  // De meeste letters zitten er goed in; drie blijven lastig. Die drie komen
  // op het thuisscherm terug als "deze letters zijn nog lastig".
  var letters = {};
  ['alif', 'ba', 'ta', 'tha', 'jim', 'ha', 'kha', 'dal', 'dhal', 'ra', 'zay',
   'sin', 'shin', 'sad', 'taa', 'ghayn', 'fa', 'qaf', 'kaf', 'lam', 'mim', 'nun']
    .forEach(function (id, i) {
      letters[id] = { goed: 4 + (i % 5), fout: i % 3 === 0 ? 1 : 0 };
    });
  letters.dad = { goed: 2, fout: 6 };
  letters.zaa = { goed: 1, fout: 5 };
  letters.ayn = { goed: 3, fout: 4 };

  var staat = {
    profielen: [{
      id: 'demo', naam: 'Yasmina', leeftijd: 9, avatar: '🦊', kleur: '#f6c453',
      aangemaakt: new Date(Date.now() - 21 * 86400000).toISOString(),
    }],
    actief: null, // de bezoeker kiest zelf, zodat het profielscherm het eerst is
    ouder: { pin: null },
    voortgang: {
      demo: {
        xp: 780,
        badges: ['eerste-stap', 'tien-goed', 'honderd-goed', 'harakat-held',
                 'eerste-soera', 'week-vol', 'foutloos'],
        reeks: { huidig: 6, langste: 9, laatsteDag: dag(0) },
        lessen: {
          'losse-letters': { sterren: 3, goed: 42, fout: 3, af: true },
          'verbonden-letters': { sterren: 3, goed: 28, fout: 2, af: true },
          'moeqattaat': { sterren: 2, goed: 19, fout: 5, af: true },
          'harakat': { sterren: 3, goed: 34, fout: 2, af: true },
          'tanween': { sterren: 2, goed: 21, fout: 6, af: true },
        },
        soeras: {
          'an-nas': { ayaGeleerd: [1, 2, 3, 4, 5, 6], af: true, sterren: 3 },
          'al-ikhlas': { ayaGeleerd: [1, 2, 3, 4], af: true, sterren: 3 },
          'al-kawthar': { ayaGeleerd: [1, 2], af: false, sterren: 2 },
        },
        themas: {
          groeten: { goed: 14, fout: 2, gekend: [0, 1, 2, 3] },
          kleuren: { goed: 24, fout: 3, gekend: [0, 1, 2, 3, 4, 5, 6, 7] },
          dieren: { goed: 12, fout: 5, gekend: [0, 1, 2, 3] },
        },
        letters: letters,
        dagen: dagen,
        foutlozeLessen: 2,
      },
    },
  };

  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(staat));
  } catch (e) {
    // Niets aan te doen; de app werkt ook zonder.
  }
})();
