/**
 * The shortlisted candidates, scored on the dimensions the research could
 * actually support.
 *
 * The three supplier-dependent dimensions — gross margin, contribution margin
 * and supplier quality — are deliberately absent from every candidate. No
 * supplier was contacted, so scoring them would mean inventing 37.5% of the
 * model. They are omitted rather than guessed, which is why every candidate
 * here reports INCOMPLETE.
 *
 * Scores are my judgement applied to the evidence ledger; the ledger IDs behind
 * each are cited so any score can be challenged at its source.
 */

const d = (score, provenance, rationale, evidence) => ({ score, provenance, rationale, evidence });

export const CANDIDATES = {
  'S1 — Padel accessories & consumables': {
    verifiedDemand: d(
      8,
      'ESTIMATE',
      'The only category where demand triangulated across two independent source types: an international federation report and Dutch specialist press. 876k NL players, 3,570 courts, 6th globally. No search-volume data exists to corroborate.',
      'E-006',
    ),
    trendDurability: d(
      8,
      'ESTIMATE',
      'Courts are capital-committed physical infrastructure, not a content trend — 3,570 of them do not disappear in a bad quarter, and NL court count grew 25% YoY. Discounted for a genuine plateau risk: the same source notes court shortage now caps participation growth.',
      'E-006',
    ),
    creativePotential: d(
      8,
      'ESTIMATE',
      'Grip wear, sweat testing and court footage are natively short-form. Demonstrable without claims, which matters given the ban on performance assertions.',
    ),
    competitionDifferentiation: d(
      5,
      'ESTIMATE',
      'The weakest dimension. Barriers are low precisely because the products are simple, established racket brands sit adjacent, and commodity grips are exactly what Temu can list. Differentiation has to come from brand, feel and club-level community rather than specification.',
      'E-005, E-010',
    ),
    shippingFulfilment: d(
      10,
      'ESTIMATE',
      'Best logistics profile in the long-list: light, flat, unbreakable, no sizing, no fitment. Cheap to ship, cheap to return, survives a letterbox.',
      'E-009',
    ),
    repeatAndLtv: d(
      10,
      'ESTIMATE',
      'Overgrips degrade within a few sessions. This is the closest thing to a genuine razor-blade cycle in the entire long-list, and repeat purchase is the only thing that survives rising paid-social costs.',
      'E-011',
    ),
    regulatoryAndReturnRisk: d(
      9,
      'ESTIMATE',
      'GPSR only. No CE marking, no WEEE, no batteries, no chemical regime, no sizing, no health claims. Under GPSR an NL-established seller holds an advantage over non-EU competitors rather than a burden.',
      'E-002, E-012',
    ),
  },

  'S2 — Dutch utility cycling & e-bike accessories': {
    verifiedDemand: d(
      7,
      'ESTIMATE',
      'Strong installed-base evidence — 795,970 bicycles sold in 2025 at a €1,930 average, e-bikes 73% of revenue — but both outlets trace to a single RAI/BOVAG release, so this is one source, not two. Accessory demand specifically was not sized.',
      'E-007',
    ),
    trendDurability: d(
      9,
      'ESTIMATE',
      'Dutch utility cycling is structural rather than trending: decades-old infrastructure and daily behaviour. Accessories attach to the installed fleet, so a −7% new-bike year barely touches it while the rising asset value raises willingness to protect.',
      'E-007',
    ),
    creativePotential: d(
      8,
      'ESTIMATE',
      'Very high and uniquely credible from the Netherlands. "Tested in Dutch rain" is a verifiable fact rather than a marketing line.',
    ),
    competitionDifferentiation: d(
      5,
      'ESTIMATE',
      'Strong established European incumbents — Basil, Ortlieb, AGU, Thule-class — already own the quality end and much of the NL-authenticity story, with Bol supplying the commodity layer beneath. Entering against entrenched brands on their home ground is the core risk.',
      'E-010',
    ),
    shippingFulfilment: d(
      6,
      'ESTIMATE',
      'Bulky-light: volumetric shipping cost is poor relative to value, and fitment-compatibility returns replace sizing returns. Mitigable with a compatibility checker, but it is real friction.',
    ),
    repeatAndLtv: d(
      5,
      'ESTIMATE',
      'Wear-driven replacement and multi-bike households only. No genuine consumable, so the economics lean on first-order contribution — the thing rising CPMs punish hardest.',
      'E-011',
    ),
    regulatoryAndReturnRisk: d(
      8,
      'ESTIMATE',
      'GPSR only, provided child seats and restraint components are excluded — those pull in EN standards and should stay out at launch. No electricals, so no per-country WEEE or battery registration.',
      'E-002, E-012',
    ),
  },

  'S3 — Wet-weather protection (non-apparel)': {
    verifiedDemand: d(
      3,
      'UNVERIFIED',
      'No market data was obtained at all. The case is structural — derived from the cycling installed base, the pet base and the climate — not evidenced. The research flagged this as the weakest survivor and the first to test or cut.',
    ),
    trendDurability: d(
      7,
      'ESTIMATE',
      'Rain is not a trend. But the category is defined by a use case rather than a market, which makes durability hard to assert.',
    ),
    creativePotential: d(
      10,
      'ESTIMATE',
      'Water beading on fabric is the single most demonstrable thing in the long-list, and it proves the product claim in three seconds without words.',
    ),
    competitionDifferentiation: d(
      6,
      'ESTIMATE',
      'Fragmented with no dominant EU DTC brand identified, which cuts both ways: room to enter, and no proof anyone has built a brand here.',
    ),
    shippingFulfilment: d(
      9,
      'ESTIMATE',
      'Light, compressible, unbreakable, nothing sized for a human.',
      'E-009',
    ),
    repeatAndLtv: d(
      5,
      'ESTIMATE',
      'UV and abrasion degrade coated fabrics, giving slow replacement. Better as a cross-sell attached to another category than as its own acquisition target.',
    ),
    regulatoryAndReturnRisk: d(
      7,
      'ESTIMATE',
      'GPSR only, but PFAS in durable water repellents is a live EU restriction and consumer-litigation risk. PFAS-free chemistry must be a hard sourcing requirement, not a marketing claim.',
      'E-002',
    ),
  },

  'S4 — Problem-specific dog gear (non-food, non-medical)': {
    verifiedDemand: d(
      5,
      'UNVERIFIED',
      'Installed base is authoritative — 306m European pets across 140m households — but that is a proxy for spend willingness, not evidence of accessory demand. The addressable slice was not sized by any source.',
      'E-008',
    ),
    trendDurability: d(
      8,
      'ESTIMATE',
      'Pet ownership is structural and the behavioural problems addressed (pulling, recall, travel stress) are permanent features of dog ownership rather than fashions.',
      'E-008',
    ),
    creativePotential: d(
      9,
      'ESTIMATE',
      'Before/after walk footage is the strongest-performing format in the niche and demonstrates the product working on a real problem.',
    ),
    competitionDifferentiation: d(
      7,
      'ESTIMATE',
      'The most defensible positioning of the four: a generic harness is a commodity, but "the harness for a dog that lunges" sold with training content is something a marketplace structurally cannot merchandise.',
      'E-010',
    ),
    shippingFulfilment: d(
      7,
      'ESTIMATE',
      'Light webbing and textile, but chest-girth sizing exists. Less damaging than fashion sizing because there is no aesthetic bracketing, and measurement guides are proven practice — flagged, not fatal.',
      'E-009',
    ),
    repeatAndLtv: d(
      6,
      'ESTIMATE',
      'Chew-through and wear replacement, size upgrades as puppies grow, multi-dog households. Real but slower than a true consumable.',
    ),
    regulatoryAndReturnRisk: d(
      6,
      'ESTIMATE',
      'GPSR only while food and health claims are excluded — but that exclusion has to be enforced in copy, not just in product choice. Training-adjacent language drifts easily into behavioural and welfare assertions, which is a live claims risk.',
      'E-002',
    ),
  },
};
