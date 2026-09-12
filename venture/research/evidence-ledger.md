# Evidence ledger

Append-only. Every material claim used in a decision gets an entry here, and
downstream documents cite the `E-nnn` ID rather than restating the evidence.

Columns: ID / date accessed / source + URL / observation / tag / confidence /
commercial implication.

Tags: `FACT` sourced · `ESTIMATE` reasoned · `ASSUMPTION` chosen ·
`UNVERIFIED` needs access

Confidence: HIGH (primary source, unambiguous) · MEDIUM (credible secondary, or
primary but partial) · LOW (single source, or contested)

---

## Standing caveats on this ledger

- **No entry in this ledger contains a search volume, CPC, conversion rate, ROAS
  or supplier quote**, because no tool in this environment could produce one. See
  `ACCESS-AND-LIMITS.md`. Any such figure appearing downstream is an input
  assumption and is tagged as one.
- The search tooling is US-biased; EU applicability is noted per entry.

---

## Entries

| ID | Accessed | Source | Observation | Tag | Conf. | Implication |
|---|---|---|---|---|---|---|
| E-001 | 2026-09-12 | Shopify / Koongo / Elogy ecommerce statistics round-ups | Europe holds roughly 27% of Shopify's merchant base (~665k stores); fashion, electronics, hobbies & leisure, furniture/homeware lead | FACT | MEDIUM | Europe is a well-served Shopify market — differentiation, not novelty, is the lever |
| E-002 | 2026-09-12 | Obelis, RPC, TÜV SÜD, Baker McKenzie, Clyde & Co (search summaries; primary text unreachable) | EU GPSR 2023/988 applies since 13 Dec 2024 to all non-food consumer goods with no SME exemption. An EU-established operator must be responsible per product; an NL merchant importing from a non-EU supplier IS the importer, and selling own-brand makes them deemed manufacturer — requiring a technical file with risk analysis kept 10 years, traceability, and Art. 19 details shown in the online offer in the local language | FACT | MEDIUM-HIGH | **Decision-changing.** Classic no-inventory dropshipping of unbranded Chinese goods to EU consumers is structurally non-compliant, not merely risky. Forces own-stock, own-brand, few SKUs. Compliance cost is per-SKU, not per-order |
| E-003 | 2026-09-12 | WWD, SupplyChainBrain, PPC Land, MarketScreener | EU €150 customs-duty de minimis abolished 1 July 2026, replaced by a flat €3 per customs declaration line, borne by seller/declarant. A further ~€2 handling fee circa Nov 2026 is reported but unconfirmed. US $800 de minimis suspended since 29 Aug 2025 | FACT | MEDIUM-HIGH | Low-ASP direct-from-China parcel economics are broken. Favours consolidated bulk import into NL and domestic EU fulfilment |
| E-004 | 2026-09-12 | LUCID/ADEME/Fost Plus/Verpact summaries via compliance vendors (self-interested — discount accordingly) | EPR registration is per-country and per-waste-stream. DE LUCID and FR ADEME IDU have no volume threshold; NL packaging has a <50 t/yr exemption; PPWR from 12 Aug 2026 reportedly requires an authorised representative per member state where not established | FACT | MEDIUM | **Market count is a fixed-cost multiplier independent of revenue.** Directly contradicts launching many markets at once. Argues for NL-first, then one adjacent market at a time |
| E-005 | 2026-09-12 | Thuiswinkel Markt Monitor via MarketingTribune / CustomerFirst | Q1 2026 Dutch online spend ~€9bn, −6% YoY, while number of purchases rose >2% (products +4%). Cross-border purchases into NL +18%; China +43% purchases | FACT | MEDIUM | Basket deflation: more orders, lower value. Building a low-AOV business into a deflating basket is the wrong direction. Chinese platforms still taking Dutch share |
| E-006 | 2026-09-12 | FIP report via SGI Europe; padelgids.nl | >35m padel players worldwide, >61% in Europe, >77,000 courts by mid-2025. NL: 876,000 players in 2025, 6th globally with 3,570 courts, courts +25% YoY | FACT | MEDIUM | The only category in the long-list where demand triangulated cleanly across two independent source types. NL is a leading market |
| E-007 | 2026-09-12 | RAI/BOVAG via Bike Europe | 795,970 new bicycles sold in NL 2025 (−7% YoY); revenue €1.53bn (−1.3%); average bicycle price €1,930; e-bikes 49% of units but 73% of revenue | FACT | MEDIUM | Installed base is getting more valuable even as unit sales fall. Accessories attach to the fleet, not to new sales — so the volume decline is a weak negative and the rising asset value is a real positive for protective accessories. Both outlets trace to one RAI/BOVAG release — treat as a single source |
| E-008 | 2026-09-12 | FEDIAF via secondary (report June 2026) | 140m European households (49%) own at least one of Europe's 306m pets; pet food €29.4bn/yr | FACT | MEDIUM | Authoritative on installed base and spend willingness. Says nothing about accessory demand specifically, which remains UNVERIFIED |
| E-009 | 2026-09-12 | Statista via secondary; corroborated directionally by return-analytics sources | EU clothing ecommerce returns centre ~30%, one cited figure to 46%; apparel 20–40%, footwear 17–30%, electronics 8–15% | FACT | MEDIUM | Europe is the worst region for returns. Any sized garment is rejected. Non-sized goods are strongly preferred |
| E-010 | 2026-09-12 | ECDB via Ecommerce News Europe | Bol ~€3.1bn annual revenue vs Amazon.nl ~€1bn (estimated); bol ~46,500 Benelux selling partners | FACT | MEDIUM-LOW | For an NL merchant the competitive question is "can Bol list this cheaper with next-day delivery?", not "what is Amazon doing?" A US-framed analysis would get this wrong |
| E-011 | 2026-09-12 | Triple Whale and one other ad-tech vendor (self-interested, US-biased) | Meta CPM +13% Aug 2025→Jul 2026; another vendor reports CPM $11.82→$14.19 (+20% YoY), median CPA $38.99 | ESTIMATE | LOW-MEDIUM | Direction, not magnitude, is the signal. A paid-social-only, single-purchase, sub-€40 AOV model is structurally fragile. Forces repeat-purchase into the selection criteria |
| E-012 | 2026-09-12 | Compliance vendor summaries (self-interested) | NL WEEE registration via Stichting OPEN is mandatory with no volume threshold (cited min. €175/yr for foreign companies); batteries via Stichting Batterijenregister | FACT | MEDIUM-LOW | Anything electrical creates per-country WEEE + battery registration in every market sold into. This, more than CE marking, is why electronics are excluded |
