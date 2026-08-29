/**
 * The explainer scene, told from the side of someone who needs a job doing.
 *
 * Every frame is a pure function of one number: the time in milliseconds. The
 * renderer sets that number and takes a picture, over and over, so the output
 * is exact — no dropped frames, no dependence on how fast this machine happens
 * to be, and the same file every time it is built.
 *
 * Loaded by scene.html, which supplies the markup this drives.
 */

/* eslint-disable no-var */

// --- Timing -----------------------------------------------------------------

/**
 * The shots, in order, with the length of each in milliseconds. Read this as
 * the storyboard: it is the only place the pacing lives.
 */
var SHOTS = [
  { key: 'hook', ms: 3000 },
  { key: 'describe', ms: 5200 },
  { key: 'quotes', ms: 5600 },
  { key: 'choose', ms: 4200 },
  { key: 'privacy', ms: 3400 },
  { key: 'end', ms: 3600 },
];

var TIMELINE = (function () {
  var at = 0;
  return SHOTS.map(function (shot) {
    var entry = { key: shot.key, start: at, end: at + shot.ms };
    at += shot.ms;
    return entry;
  });
})();

var DURATION = TIMELINE[TIMELINE.length - 1].end;

// --- Easing -----------------------------------------------------------------

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

/** 0 before `from`, 1 after `to`, eased in between. */
function ramp(t, from, to) {
  if (to <= from) return t >= to ? 1 : 0;
  return clamp((t - from) / (to - from), 0, 1);
}

/** Decelerating: fast to start, settling at the end. Used for anything arriving. */
function easeOut(p) {
  return 1 - Math.pow(1 - p, 3);
}

/** A little overshoot, for something that lands with weight. */
function easeBack(p) {
  var c = 1.70158;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
}

/** Rises to 1 and falls back to 0 — for a shot that comes and goes. */
function inOut(t, start, end, fade) {
  var f = fade === undefined ? 400 : fade;
  return Math.min(ramp(t, start, start + f), 1 - ramp(t, end - f, end));
}

function lerp(a, b, p) {
  return a + (b - a) * p;
}

// --- The scene --------------------------------------------------------------

var COPY = {
  nl: {
    hookTop: 'De woonkamer moet geschilderd.',
    hookBottom: 'Wie bel je?',
    steps: ['Beschrijf je klus', 'Ontvang offertes', 'Vergelijk en kies'],
    describeCaption: 'Eén keer beschrijven. Twee minuten werk.',
    quotesCaption: 'Vakmensen uit je eigen gemeente reageren.',
    chooseCaption: 'Prijs, beoordelingen en ervaring naast elkaar.',
    privacyTitle: 'Je adres blijft van jou',
    privacyBody:
      'Vakmensen zien je gemeente en je wijk. Je straat en je telefoonnummer krijgt alleen de vakman aan wie jij de klus gunt.',
    endTitle: 'Vind een vakman bij je in de buurt',
    endMeta: 'Gratis voor particulieren · Geen betaalgegevens',
    endUrl: 'buurklus.nl',
    job: { title: 'Woonkamer van 25 m² schilderen', meta: 'Utrecht · Binnen een week' },
    fields: [
      { label: 'Vakgebied', value: 'Schilderwerk' },
      { label: 'Gemeente', value: 'Utrecht' },
      { label: 'Wanneer', value: 'Binnen een week' },
    ],
    typed: 'Woonkamer van 25 m², muren en plafond, gebroken wit.',
    quotes: [
      { name: 'Schildersbedrijf Bakker', price: '€ 1.250', stars: 5, meta: '18 jaar ervaring' },
      { name: 'Van Dijk Afbouw', price: '€ 1.480', stars: 4, meta: '34 beoordelingen' },
      { name: 'Klusbedrijf Yilmaz', price: '€ 990', stars: 5, meta: 'Reageert binnen 40 min' },
    ],
    chosen: 'Gekozen',
    quotesCount: '{n} van 6 offertes',
  },
};

var state = { locale: 'nl' };

function el(id) {
  return document.getElementById(id);
}

function show(node, opacity, translateY, scale) {
  node.style.opacity = String(opacity);
  var parts = [];
  if (translateY) parts.push('translateY(' + translateY + 'px)');
  if (scale !== undefined && scale !== 1) parts.push('scale(' + scale + ')');
  node.style.transform = parts.length ? parts.join(' ') : 'none';
}

/** Which shot a moment belongs to, and how far into it we are. */
function shotAt(t) {
  for (var i = 0; i < TIMELINE.length; i += 1) {
    if (t < TIMELINE[i].end || i === TIMELINE.length - 1) {
      var shot = TIMELINE[i];
      return { key: shot.key, start: shot.start, end: shot.end, local: t - shot.start };
    }
  }
  return null;
}

function renderStars(node, filled) {
  node.innerHTML =
    '<span class="on">' + '★'.repeat(filled) + '</span>' + '<span class="off">' + '★'.repeat(5 - filled) + '</span>';
}

/** Fills the markup with this run's language. Called once, before rendering. */
function build(locale) {
  state.locale = locale;
  var c = COPY[locale];

  el('hookTop').textContent = c.hookTop;
  el('hookBottom').textContent = c.hookBottom;
  el('privacyTitle').textContent = c.privacyTitle;
  el('privacyBody').textContent = c.privacyBody;
  el('endTitle').textContent = c.endTitle;
  el('endMeta').textContent = c.endMeta;
  el('endUrl').textContent = c.endUrl;
  el('jobTitle').textContent = c.job.title;
  el('jobMeta').textContent = c.job.meta;
  el('quotesCount').textContent = c.quotesCount.replace('{n}', '3');

  el('fields').innerHTML = c.fields
    .map(function (field, index) {
      return (
        '<div class="field" data-i="' +
        index +
        '"><span class="field__label">' +
        field.label +
        '</span><span class="field__value">' +
        field.value +
        '</span></div>'
      );
    })
    .join('');

  el('quotes').innerHTML = c.quotes
    .map(function (quote, index) {
      return (
        '<div class="quote" data-i="' +
        index +
        '">' +
        '<div class="quote__row"><span class="quote__name">' +
        quote.name +
        '</span><span class="quote__price">' +
        quote.price +
        '</span></div>' +
        '<div class="quote__row"><span class="stars" data-stars="' +
        quote.stars +
        '"></span><span class="quote__meta">' +
        quote.meta +
        '</span></div>' +
        '<span class="quote__chosen">' +
        c.chosen +
        '</span>' +
        '</div>'
      );
    })
    .join('');

  Array.prototype.forEach.call(document.querySelectorAll('.stars'), function (node) {
    renderStars(node, Number(node.getAttribute('data-stars')));
  });
}

// --- Per-shot rendering ------------------------------------------------------

function renderHook(local, length) {
  var top = el('hookTop');
  var bottom = el('hookBottom');
  show(top, ramp(local, 200, 900), lerp(24, 0, easeOut(ramp(local, 200, 900))));
  show(bottom, ramp(local, 900, 1600), lerp(24, 0, easeOut(ramp(local, 900, 1600))));

  var out = ramp(local, length - 500, length);
  el('hook').style.opacity = String(1 - out);
}

function renderDescribe(local) {
  var c = COPY[state.locale];

  // The description types itself in, a character at a time.
  var typing = ramp(local, 900, 3000);
  var shown = Math.round(typing * c.typed.length);
  el('typed').textContent = c.typed.slice(0, shown);
  el('caret').style.opacity = typing >= 1 ? '0' : Math.floor(local / 420) % 2 ? '0.15' : '1';

  Array.prototype.forEach.call(el('fields').children, function (node, index) {
    var at = 3100 + index * 320;
    var p = easeOut(ramp(local, at, at + 420));
    show(node, p, lerp(14, 0, p));
  });
}

function renderQuotes(local) {
  var arrived = 0;
  Array.prototype.forEach.call(el('quotes').children, function (node, index) {
    var at = 500 + index * 900;
    var p = ramp(local, at, at + 620);
    if (p > 0.5) arrived += 1;
    show(node, p, lerp(26, 0, easeBack(p)));
    node.classList.remove('quote--chosen', 'quote--dimmed');
  });

  // Counts up with the cards. Fixed at three it claimed a quote that was not
  // on screen yet, which is a small lie on a frame anyone can pause.
  var count = el('quotesCount');
  count.textContent = COPY[state.locale].quotesCount.replace('{n}', String(arrived));
  count.style.opacity = String(arrived > 0 ? 1 : 0);
}

function renderChoose(local) {
  var cards = el('quotes').children;
  Array.prototype.forEach.call(cards, function (node) {
    show(node, 1, 0);
  });

  // The third quote is the cheapest and the fastest to reply; the eye is
  // walked down to it before it is picked, rather than it simply lighting up.
  var walk = ramp(local, 300, 1800);
  var focus = Math.min(2, Math.floor(walk * 3));
  Array.prototype.forEach.call(cards, function (node, index) {
    node.classList.toggle('quote--dimmed', walk > 0.05 && index !== focus);
  });

  var picked = local > 2100;
  Array.prototype.forEach.call(cards, function (node, index) {
    node.classList.toggle('quote--chosen', picked && index === 2);
    if (picked) node.classList.toggle('quote--dimmed', index !== 2);
  });

  // A fingertip lands on the chosen card.
  var tap = inOut(local, 1900, 2600, 200);
  var press = ramp(local, 2000, 2200);
  var tapNode = el('tap');
  tapNode.style.opacity = String(tap);
  tapNode.style.transform = 'scale(' + lerp(1.5, 0.9, easeOut(press)) + ')';
}

/**
 * Two beats rather than one. First the address on the card blurs away while
 * the phone is still there, so the claim is shown before it is stated; then
 * the phone clears and the sentence has the frame to itself.
 *
 * The first version laid a translucent panel over a fading phone, which put
 * two half-visible things on the same pixels and made both hard to read.
 */
function renderPrivacy(local, length) {
  var hide = ramp(local, 250, 1100);
  el('jobMeta').style.filter = 'blur(' + hide * 5 + 'px)';
  el('jobMeta').style.opacity = String(1 - hide * 0.8);

  var p = easeOut(ramp(local, 1300, 2000));
  var out = ramp(local, length - 450, length);
  el('privacy').style.opacity = String(Math.min(p, 1 - out));
  el('privacy').style.transform = 'translateY(' + lerp(22, 0, p) + 'px)';
}

function renderEnd(local) {
  var p = easeOut(ramp(local, 200, 1000));
  el('end').style.opacity = String(p);
  el('endMark').style.transform = 'scale(' + lerp(0.8, 1, easeBack(ramp(local, 200, 1100))) + ')';
  show(el('endTitle'), ramp(local, 600, 1300), lerp(16, 0, easeOut(ramp(local, 600, 1300))));
  show(el('endMeta'), ramp(local, 900, 1600), lerp(16, 0, easeOut(ramp(local, 900, 1600))));
  show(el('endUrl'), ramp(local, 1200, 1900), lerp(16, 0, easeOut(ramp(local, 1200, 1900))));
}

// --- The frame ---------------------------------------------------------------

/** Draws the whole scene at time `t`. The only entry point the renderer uses. */
function render(t) {
  var shot = shotAt(t);
  var length = shot.end - shot.start;

  // Everything is hidden first, then the shot in play puts back what it needs.
  el('hook').style.opacity = '0';
  el('privacy').style.opacity = '0';
  el('end').style.opacity = '0';
  el('tap').style.opacity = '0';

  // The phone is on screen for the three middle shots and the privacy line,
  // rising as the hook clears and sinking away before the end card.
  var phoneIn = ramp(t, TIMELINE[0].end - 120, TIMELINE[0].end + 620);
  // The phone leaves partway through the privacy shot, once the blurred
  // address has made its point, so the sentence that follows stands alone.
  var phoneOut = ramp(t, TIMELINE[4].start + 950, TIMELINE[4].start + 1650);
  var phone = el('phone');
  phone.style.opacity = String(Math.min(phoneIn, 1 - phoneOut));
  phone.style.transform =
    'translateY(' + lerp(40, 0, easeOut(phoneIn)) + 'px) scale(' + lerp(0.94, 1, easeOut(phoneIn)) + ')';

  // The screen inside the phone: the form for the first shot, the quotes after.
  var toQuotes = ramp(t, TIMELINE[1].end - 350, TIMELINE[1].end + 150);
  el('screenForm').style.opacity = String(1 - toQuotes);
  el('screenQuotes').style.opacity = String(toQuotes);
  el('screenForm').style.display = toQuotes >= 1 ? 'none' : 'grid';
  el('screenQuotes').style.display = toQuotes <= 0 ? 'none' : 'grid';

  // The step label above the phone.
  var stepIndex = { describe: 0, quotes: 1, choose: 2 }[shot.key];
  var stepNode = el('step');
  if (stepIndex === undefined) {
    stepNode.style.opacity = '0';
  } else {
    var c = COPY[state.locale];
    el('stepNumber').textContent = String(stepIndex + 1);
    el('stepLabel').textContent = c.steps[stepIndex];
    stepNode.style.opacity = String(inOut(shot.local, 0, length, 320));
  }

  // The caption under the phone.
  var captions = {
    describe: COPY[state.locale].describeCaption,
    quotes: COPY[state.locale].quotesCaption,
    choose: COPY[state.locale].chooseCaption,
  };
  var caption = el('caption');
  if (captions[shot.key]) {
    caption.textContent = captions[shot.key];
    caption.style.opacity = String(inOut(shot.local, 0, length, 320));
  } else {
    caption.style.opacity = '0';
  }

  if (shot.key === 'hook') renderHook(shot.local, length);
  if (shot.key === 'describe') renderDescribe(shot.local);
  if (shot.key === 'quotes') renderQuotes(shot.local);
  if (shot.key === 'choose') renderChoose(shot.local);
  if (shot.key === 'privacy') renderPrivacy(shot.local, length);
  if (shot.key === 'end') renderEnd(shot.local);

  // The quotes keep whatever the choose shot left them in, so the privacy
  // line is delivered over a screen that still shows the decision.
  if (shot.key === 'privacy') {
    var cards = el('quotes').children;
    Array.prototype.forEach.call(cards, function (node, index) {
      show(node, 1, 0);
      node.classList.toggle('quote--chosen', index === 2);
      node.classList.toggle('quote--dimmed', index !== 2);
    });
  }

  // Reset the blur outside the shot that applies it.
  if (shot.key !== 'privacy') {
    el('jobMeta').style.filter = 'none';
    el('jobMeta').style.opacity = '1';
  }
}

window.scene = { build: build, render: render, duration: DURATION, timeline: TIMELINE };
