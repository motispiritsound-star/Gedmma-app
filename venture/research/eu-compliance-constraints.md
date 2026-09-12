# EU / Cross-Border Compliance Constraints for a Netherlands-Based Shopify DTC Store

**Prepared:** 2026-09-12
**All sources accessed:** 2026-09-12
**Merchant profile assumed:** NL-established legal entity (BV or eenmanszaak), Shopify DTC, physical consumer goods, selling into EU + possibly UK/CH/NO/US.

> **THIS IS NOT LEGAL OR TAX ADVICE.** Everything marked **REQUIRES PROFESSIONAL VERIFICATION** must be confirmed by a Dutch/EU product-compliance lawyer, a VAT adviser, and (for EPR) a compliance-scheme agent before commercial commitment.

---

## 0. METHOD, AND A MATERIAL LIMITATION ON THIS RESEARCH

**READ THIS BEFORE TRUSTING ANY CITATION BELOW.**

| Item | Status |
|---|---|
| Web *search* | Available and used extensively |
| Web *page fetch* | **BLOCKED for every domain tested**, including `eur-lex.europa.eu`, `taxation-customs.ec.europa.eu`, `business.gov.nl`, `gov.uk`, `wikipedia.org`, and all law-firm/advisory sites |

**Consequence (UNVERIFIED-BY-PRIMARY-SOURCE):** I could **not open a single primary legal text**. Every finding below is derived from search-engine summaries of secondary sources (law firms, compliance vendors, tax advisers, government summary pages). Where multiple independent secondary sources agree I have marked confidence HIGH; where a single vendor page is the only source I have marked LOW.

**Compliance vendors have a commercial incentive to overstate obligations.** Several sources below (EU Responsible Person services, EPR agents, cookie-banner apps) sell the solution to the problem they describe. I have flagged these.

**Action required:** before spending money, re-verify the starred (★) items directly against EUR-Lex, the NVWA, the Belastingdienst, Verpact/Stichting OPEN, LUCID, and ADEME/SYDEREP from an unrestricted connection.

**Labels used:**
- **FACT** — multiple independent sources agree; treat as reliable pending primary verification
- **ESTIMATE** — a number derived or quoted from commercial sources; directionally useful, not authoritative
- **ASSUMPTION** — my inference, clearly reasoned, not sourced
- **UNVERIFIED** — found once, or contradictory, or could not confirm
- **CONFLICT** — sources actively disagree; flagged inline

---

## 1. EXECUTIVE SUMMARY — THE FIVE CONSTRAINTS THAT MOST CHANGE STRATEGY

### ★ CONSTRAINT 1 — GPSR has largely killed classic AliExpress/CJ dropshipping into the EU. **Yes, this is genuinely true.**

**The honest answer to the question posed: correct, classic no-inventory dropshipping of unbranded Chinese consumer goods to EU consumers is not legally viable as normally practised.** Not "risky" — structurally non-compliant.

The mechanism, not the marketing version:

1. GPSR (Regulation (EU) 2023/988) has applied since **13 December 2024** and covers **all non-food consumer products**, new and second-hand, with **no SME or micro-enterprise exemption**. (FACT, HIGH)
2. Under Art. 16, a product may only be placed on the EU market if an **economic operator established in the EU** is responsible for it. (FACT, HIGH)
3. A Dutch merchant buying from a Chinese supplier and selling to EU consumers **is that operator** — you are the **importer**, and in most cases (selling under your own store brand / white-label) you are treated as the **manufacturer**. (FACT, HIGH)
4. As importer you must hold a copy of the **technical documentation including an internal risk analysis**, and retain it for **10 years**. If you sell under your own name or mark, you assume **full manufacturer obligations** — i.e. *you* must produce the risk analysis and technical file. (FACT, HIGH)
5. Art. 19 requires the **online offer itself** to display: manufacturer name + postal address + electronic address; the EU responsible person's details if the manufacturer is non-EU; product identification (type/batch/serial); and **warnings and safety information in a language the consumer easily understands** — i.e. Dutch for NL, German for DE, French for FR. Footer/T&Cs placement is **not sufficient**; it must be on or one click from the product page. (FACT, HIGH)

**Why this breaks the model:** an AliExpress/CJ supplier will not supply a risk analysis or a technical file, will not accept being named as EU-facing manufacturer, and cannot furnish per-batch traceability. You therefore cannot populate Art. 19 truthfully, and you cannot satisfy the Art. 11 importer document duty. Buying an "EU Responsible Person" subscription (**ESTIMATE: €150–€550/yr typical, up to €1,500/product category** — commercial vendor pricing, LOW confidence, vendors are self-interested) **does not fix this** — an RP represents a compliant file; it does not create one.

**Strategic consequence:** the viable EU model is **own-stock, own-brand, supplier-audited, with a real technical file per SKU**, or **EU/EEA-sourced goods where the supplier is already the EU manufacturer and hands you the file**. Product count must be small because compliance cost is **per SKU**, not per order.

### ★ CONSTRAINT 2 — The €150 de minimis is gone (EU, 1 July 2026) and the US $800 de minimis is gone. Direct-from-China unit economics are broken.

- **EU:** the €150 customs-duty relief was **abolished from 1 July 2026**, replaced by a **flat €3 per customs declaration line** on qualifying low-value B2C consignments, transitional until the Customs Data Hub (~2028) applies full tariff classification. The €3 is a **business cost borne by the seller/IOSS holder/declarant**, not collected from the consumer at the door. (FACT, HIGH — see §4 for a CONFLICT on "per item" vs "per line")
- A separate **e-commerce handling fee (~€2/line) is expected around November 2026**, taking the combined charge toward ~€5/line. (UNVERIFIED — Council-mandate stage reporting only; **do not model as certain**)
- **US:** duty-free de minimis was suspended for all countries from **29 August 2025** and the suspension was continued by executive order in **February 2026**. Every parcel into the US is now dutiable regardless of value. (FACT, MEDIUM-HIGH)

**Strategic consequence:** a €4 product shipped individually from Shenzhen now carries €3 (soon possibly €5) of fixed customs cost plus import VAT plus line-level declaration overhead. **Low-ASP, high-unit-count, direct-ship products are dead.** Viable: higher-ASP items (€40+), consolidated bulk import into NL under an Article 23 licence, and domestic EU fulfilment.

### ★ CONSTRAINT 3 — EPR is a per-country, per-waste-stream fixed cost with effectively no small-seller exemption in your best markets.

Every EU market you add triggers separate registrations in **packaging + WEEE + batteries + (from ~2028) textiles**, each with its own registry, its own fees, and — critically — **from 12 August 2026, PPWR Art. 45 requires an EPR authorised representative in each member state where you are a producer but not established**. (MEDIUM — consistent across sources, but this is a *new* obligation and I could not read Art. 45 directly. ★ verify)

- **NL:** packaging levy has a **<50,000 kg/yr under-threshold** (no declaration, no fee) — but the SUP (single-use plastic) surcharge has **no threshold**. (MEDIUM-HIGH)
- **DE:** LUCID registration is **mandatory with no threshold**, and free to register — but you must also contract a dual system (paid). From 12 Aug 2026 registration is a **personal obligation in your own name**, not delegable to a fulfilment partner. (MEDIUM-HIGH)
- **FR:** **Identifiant Unique (IDU) from ADEME, no threshold, mandatory since 1 Jan 2022**, must appear on invoices and T&Cs, per-stream declarations in SYDEREP, **Triman + Info-Tri sorting label on packaging**, penalties quoted up to **€30,000**. France also runs the EU's only mature **textile EPR**. (MEDIUM)
- **BE:** obligation above **300 kg/yr** household+commercial packaging (Fost Plus/Valipac); **no de minimis for Recupel (WEEE) or Bebat (batteries)**; foreign sellers must appoint a Belgian authorised representative. (MEDIUM)

**Strategic consequence:** **market count is a fixed-cost multiplier, independent of revenue.** Launching NL+BE+DE+FR on day one is a materially more expensive compliance posture than NL-only. Germany and France are the two most expensive first steps.

### ★ CONSTRAINT 4 — Whole product categories are effectively off-limits to a small merchant.

Hard-disqualify for a first venture: **cosmetics/skincare** (EU Responsible Person, CPNP notification, Product Information File, and a qualified-expert Cosmetic Product Safety Report **per formulation**), **food & supplements** (NVWA product-by-product notification, novel-food authorisation, health-claim regime), **toys and children's products** (CE + EN 71 + full technical file today; Toy Safety Regulation (EU) 2025/2509 adds a **mandatory Digital Product Passport** from 1 Aug 2030), **mains-powered or wireless electronics** (LVD + EMC + RED + RoHS + WEEE + batteries + USB-C common charger, and **the importer must sign the Declaration of Conformity in their own name — a factory DoC is legally worthless**). See §8.

### ★ CONSTRAINT 5 — EU consumer law both bans the standard dropship growth playbook and taxes high-return categories.

- **14-day right of withdrawal**, no reason needed; you refund the goods **plus standard outbound delivery** within 14 days; the consumer only bears **return** postage **if you told them so in advance**. (FACT, HIGH)
- **From 19 June 2026** a **mandatory electronic withdrawal function ("withdrawal button")** applies to distance contracts concluded through an online interface — reported by multiple law firms to apply **horizontally to goods**, not just financial services, despite sitting in Directive (EU) 2023/2673. (MEDIUM-HIGH — ★ verify scope; this is the single most commonly misread item in this report)
- **Minimum 2-year legal conformity guarantee**, with **burden of proof reversed in the consumer's favour for the first 12 months**. (FACT, HIGH)
- **Omnibus Directive (EU) 2019/2161:** any advertised discount must reference the **lowest price applied in the preceding 30 days**; **fake reviews and undisclosed paid endorsements are prohibited**; you must disclose whether reviews are verified and how. Penalties for widespread cross-border infringement up to **4% of annual turnover**. (FACT, HIGH)
- A **Digital Fairness Act** proposal targeting **fake countdown timers, urgency cues, dark patterns, influencer marketing and unfair personalisation** is scheduled for **Q4 2026**. (FACT that it is scheduled, MEDIUM; content is a proposal, not law)

**Strategic consequence:** "was €99, now €29" anchoring, seeded reviews, and scarcity timers — the core of the dropship playbook — are **already illegal or about to be**, and are the easiest things for a competitor or consumer body to report. Separately, the returns regime means **apparel/footwear/sizing-dependent goods carry a structural 20–40% return-rate cost with you paying outbound shipping back**. (ESTIMATE on the rate; the legal cost allocation is FACT)

---

## 2. EU GPSR — GENERAL PRODUCT SAFETY REGULATION (EU) 2023/988

### 2.1 Status and scope

| Finding | Label | Confidence |
|---|---|---|
| Applies since **13 December 2024**; repealed and replaced the General Product Safety Directive 2001/95/EC | FACT | HIGH |
| Covers **all non-food consumer products**, new *and* second-hand; exceptions for goods clearly marked "repaired"/"reconditioned" and antiques | FACT | MEDIUM |
| **No exemption for SMEs or micro-enterprises.** The only size-based carve-outs apply to *online marketplace providers*, not to sellers | FACT | HIGH |
| Still in force and unamended as of 2026; the Responsible Person duty is permanent with no sunset | FACT | MEDIUM |
| NVWA is the Dutch enforcement authority | FACT | HIGH |

Sources: https://www.bakermckenzie.com/en/insight/publications/resources/product-risk-radar-articles/general-product-safety-regulation ; https://www.nvwa.nl/onderwerpen/gpsr-productveiligheidsverordening/over-de-gpsr ; https://www.europarl.europa.eu/doceo/document/P-10-2024-001787-ASW_EN.html ; https://www.complir.io/resources/guides/gpsr-compliance-guide-product-companies (accessed 2026-09-12)

### 2.2 Who the Dutch merchant actually is under GPSR

This is the crux and it is routinely misexplained online.

- If you **import from outside the EU** and sell under a supplier's brand → you are the **importer** (Art. 11).
- If you **import and sell under your own brand, name or trademark** (white-label, private-label, "our store brand") → **you are deemed the manufacturer** and carry **all manufacturer obligations** (Art. 9). (FACT, HIGH — confirmed by multiple compliance sources)
- Being an EU-established importer means **you are already the Art. 16 responsible person**. You do **not** need to buy a third-party "EU Responsible Person" service. That service exists for **non-EU** sellers. (ASSUMPTION drawn from the structure of Art. 16 as described across sources — **★ REQUIRES PROFESSIONAL VERIFICATION**, because several vendors market RP services to EU-established sellers who probably do not need them.)

### 2.3 The obligation stack, per SKU

| Obligation | Applies to | Label |
|---|---|---|
| **Internal risk analysis** documented | Manufacturer (= you, if own-brand) | FACT |
| **Technical documentation** kept for **10 years**; importer must hold a copy and verify it exists | Manufacturer + importer | FACT |
| **Product traceability marking:** type / batch / serial / unique identifier on the product | Manufacturer | FACT |
| **Manufacturer name + postal address + electronic address** on the product or packaging | Manufacturer | FACT |
| **Importer's own name and contact details** additionally on product or packaging | Importer | FACT |
| **Warnings and safety information in the language of the destination market** | All | FACT |
| **Art. 19 distance-selling disclosure on the offer page** (manufacturer details, EU operator details, product images, type info, warnings) — visible on the product page or one clearly-labelled click away | Seller | FACT |
| **Accident/incident notification** via the Safety Business Gateway | All operators | FACT (detail of timelines UNVERIFIED) |
| **Recall and consumer-remedy duties** (repair / replacement / refund; direct consumer notification) | All operators | FACT |

Sources: https://www.compliancegate.com/gpsr-importers/ ; https://product-compliance.pro/en/gpsr-importer-obligations/ ; https://www.osborneclarke.com/insights/navigating-eus-new-gpsr-what-manufacturers-and-importers-products-need-know ; https://www.fieldfisher.com/en/insights/new-obligations-under-the-eu-general-product-safety-regulation ; https://www.authorisedrepcompliance.com/obligations-of-economic-operators-in-distance-sales/ ; https://www.thuiswinkel.org/kennisbank/kennisartikelen/online-verkoop-en-marktplaatsen-zo-voldoe-je-aan-de-gpsr/ (accessed 2026-09-12)

### 2.4 Penalties

**UNVERIFIED / LOW confidence.** One source quotes "up to €10,000 for SMEs for a missing risk analysis"; this reads like a German national figure, not an EU-wide one. GPSR leaves penalties to member states. The Dutch penalty regime under the Warenwet/NVWA was **not verifiable** here. ★ **REQUIRES PROFESSIONAL VERIFICATION.**

### 2.5 Verdict on dropshipping — stated plainly

**Classic AliExpress/CJ dropshipping to EU consumers is not compliant and cannot be made compliant by paperwork alone.** The blocker is not the Responsible Person (you are one, by being Dutch). The blocker is that **you cannot produce a technical file and risk analysis for a product you have never held, from a supplier who will not document it, and you cannot truthfully populate the Art. 19 offer disclosures.** Enforcement-wise, marketplaces already delist non-compliant listings; an own-Shopify store is less *visible* to enforcement but not less *liable*, and a single consumer complaint to the NVWA is sufficient to start.

**What remains viable:** own-brand with a real supplier relationship and a per-SKU technical file; EU/EEA-manufactured goods where the file already exists; print-on-demand and similar only where the POD provider is the EU manufacturer and will be named as such (★ verify contractually — most POD contracts push this obligation onto you).

---

## 3. EU EPR — EXTENDED PRODUCER RESPONSIBILITY

You become a "producer" the moment you **first place goods (or packaging) on the market of a given member state**. Shipping from NL to a German consumer makes you a German producer for packaging. There is no way around this by using a 3PL.

### 3.1 Packaging — and the PPWR shift on 12 August 2026 ★

**Regulation (EU) 2025/40 (PPWR)** entered into force 11 February 2025; **core obligations applied from 12 August 2026** — i.e. **already live as of today's date**. (FACT, MEDIUM-HIGH)

Reported obligations now live:
- Packaging (including **e-commerce parcels**) must meet **material and space-efficiency** rules — **empty space in a parcel must not exceed 40%** unless technically unavoidable. (MEDIUM — this is a *design* constraint on your fulfilment, not just admin)
- **Declaration of conformity + technical documentation per packaging type** must exist. (MEDIUM)
- **Art. 45(3): a producer placing packaging on a member state's market without being established there must appoint an EPR authorised representative in that member state** — one per country, **no size exemption**. (MEDIUM — ★ highest-value item to verify directly)

Sources: https://www.gtlaw.com/en/insights/2026/6/countdown-to-the-new-eu-packaging-and-packaging-waste-regulation-compliance-considerations ; https://www.ecosistant.eu/en/eu-packaging-regulation-e-commerce/ ; https://circulatepack.com/knowledge-hub/ppwr-guide ; https://www.certivo.com/blog-details/france-packaging-epr-2026-citeo-idu-authorized-rep-guide (accessed 2026-09-12)

**Per country:**

| Country | Scheme | Threshold | Notes |
|---|---|---|---|
| **NL** | Verpact / Stichting Afvalfonds Verpakkingen | **<50,000 kg/yr → no declaration, no afvalbeheersbijdrage** (FACT, MEDIUM-HIGH) | SUP surcharge has **no** threshold. Declaration for calendar year N is filed by 1 April N+1 |
| **DE** | LUCID (ZSVR) + a contracted dual system | **None** | LUCID registration itself is **free**; the dual-system contract is the real cost. From 12 Aug 2026 registration must be in your **own name** |
| **FR** | ADEME **IDU** + Citeo + SYDEREP | **None** | IDU must appear on invoices and T&Cs; **Triman + Info-Tri label on packaging**; penalties quoted to **€30,000** |
| **BE** | Fost Plus (household) / Valipac (commercial) | **>300 kg/yr** | Below 300 kg you are out of scope |
| **AT / IE / Nordics** | ARA (AT), Repak (IE), national schemes | **NOT VERIFIED** | Could not confirm thresholds — ★ |

Sources: https://winkelfactuur.nl/amp/nl/blog/verpact-50000-kg-grens/ ; https://ondernemersplein.overheid.nl/wetten-en-regels/afvalbeheersbijdrage-verpakkingen-betalen/ ; https://www.verpackungsgesetz.com/en/topics/howto-registration/ ; https://complicoconsulting.com/blog-0572-lucid-registration-germany ; https://vatcompliance.co/blog/the-complete-2026-guide-to-triman-labeling-and-epr-compliance-in-france/ ; https://gramta.com/articles/epr-france ; https://gramta.com/articles/epr-belgium ; https://www.repax.io/epr-compliance/packaging-in-belgium (accessed 2026-09-12)

### 3.2 WEEE / electronics

- **NL:** Nationaal (W)EEE Register, operated via **Stichting OPEN**; mandatory since 1 March 2021 under Regeling AEEA art. 21. Fees are weight- and category-based. (FACT, MEDIUM-HIGH)
- **DE:** stiftung ear / ElektroG — separate national registration. (FACT, MEDIUM)
- **BE:** Recupel adhesion number, **no de minimis**, foreign sellers need a Belgian authorised representative. (MEDIUM)
- **FR:** separate WEEE stream under the same IDU umbrella. (MEDIUM)
- **No EU-wide single WEEE registration exists.** (FACT, HIGH)

Sources: https://nationaalweeeregister.nl/en/ ; https://gramta.com/articles/epr-netherlands ; https://www.clearosystems.com/blog/dutch-epr-schemes-overview ; https://epr.eldris.ai/epr-registration-belgium/ (accessed 2026-09-12)

### 3.3 Batteries — Regulation (EU) 2023/1542

- **Every producer must register per brand and per battery category before the battery is first made available** (Art. 55). (FACT, MEDIUM-HIGH)
- Platforms do **not** absorb the registration duty. (FACT, MEDIUM)
- Existing registrations had to be supplemented by **15 January 2026** with chemical composition and tax number, and assigned to an approved PRO. (MEDIUM)
- Labelling must be on the battery **and on the device containing it**. (MEDIUM)
- Non-established producers must appoint a national authorised representative (confirmed for DE; likely EU-wide). (MEDIUM)

**This catches far more products than people expect** — anything with a built-in cell: LED lights, fans, massagers, watches, earbuds, toys, "smart" anything.

Sources: https://www.xictron.com/en/blog/eu-battery-regulation-online-shop-duties-2026/ ; https://getreadycompliance.eu/other-eu-regulations/eu-battery-regulation-eu-2023-1542/ ; https://cecheck.com/battery-regulation/ (accessed 2026-09-12)

### 3.4 Textiles

- **Directive (EU) 2025/1892** (revised Waste Framework Directive) entered into force **16 October 2025**, making **textile EPR mandatory EU-wide**; member states have 20 months to transpose. (FACT, MEDIUM)
- **CONFLICT:** sources variously state "fully operational national schemes by 2027" and "functioning textile EPR by **17 April 2028**". The **2028** date is the more commonly cited hard deadline; **micro-enterprises reportedly get +12 months (~April 2029)**. Treat the exact date as **UNRESOLVED**. ★
- Separate collection of textile waste has been mandatory across member states **since 1 January 2025**. (FACT, MEDIUM)
- **France already has a live mandatory textile EPR** — selling apparel into FR today is already an EPR-registered activity. (FACT, MEDIUM)

Sources: https://www.my-compliance.eu/news/eu-textile-epr-obligation/ ; https://ukft.org/revised-waste-framework-directive-sep25/ ; https://expra.eu/2025/12/20/eu-publishes-revised-waste-framework-directive-mandatory-textile-epr-and-food-waste-targets-enter-into-force/ ; https://www.carbonfact.com/blog/policy/textile-epr-overview (accessed 2026-09-12)

### 3.5 What EPR costs — ESTIMATE only

No reliable aggregate figure was obtainable. Structurally the cost is: **registration (often free or low) + annual PRO membership + volume-based fees + authorised-representative retainer per country per stream**. Compliance-agent retainers quoted in the market run **€300–€1,500 per country per stream per year** (ESTIMATE, LOW — vendor pricing, self-interested). **★ Get real quotes from two agents before modelling.**

---

## 4. EU CUSTOMS AND IMPORT VAT

### 4.1 The €150 de minimis — abolished

| Finding | Label | Confidence |
|---|---|---|
| The **€150 customs-duty relief was abolished from 1 July 2026** | FACT | HIGH |
| Replaced by a **transitional flat €3 customs duty** on qualifying low-value B2C distance-sale consignments, expected to run until ~1 July 2028 | FACT | MEDIUM-HIGH |
| The €3 is **charged to the business** (seller / importer / IOSS holder / declarant as customs debtor), **not collected from the consumer at the door** | FACT | MEDIUM-HIGH |
| Council political agreement 13 Nov 2025 / 12 Dec 2025; **final legislative approval 11 February 2026; regulation published 30 April 2026** | UNVERIFIED | LOW (single source for the Feb/Apr dates) ★ |
| An additional **e-commerce handling fee (~€2 per declaration line) expected no later than ~1 November 2026**, combined ~€5 | UNVERIFIED | LOW — Council-mandate reporting only. **Do not model as certain** ★ |
| From ~2028 the **EU Customs Data Hub** replaces the flat rate with full HS-code classification duties on **all** goods regardless of value | ESTIMATE | MEDIUM |

**★ CONFLICT — the €3 base.** Sources say variously "**per item**", "**per customs declaration line item**", and "**per tariff line / HS code within a parcel**". The most detailed sources say: **€3 × number of declaration lines**, where goods sharing a tariff classification are grouped on one line in an H7 declaration. **Practical read: a 5-unit parcel of the same SKU = one line = €3; a 5-unit parcel of 5 different SKUs across different HS codes = up to €15.** This materially changes bundle economics. **VERIFY BEFORE MODELLING.**

Sources: https://taxation-customs.ec.europa.eu/news/e-commerce-150-eur-customs-duty-exemption-threshold-be-removed-2026-2025-11-13_en (summary only, page fetch blocked) ; https://www.consilium.europa.eu/en/press/press-releases/2025/12/12/customs-council-agrees-to-levy-customs-duty-on-small-parcels-as-of-1-july-2026/ ; https://www.vatcalc.com/eu/eu-e3-levy-low-value-e-commerce-import-package-july-2026/ ; https://easproject.com/eu-3-customs-duty-ioss-2026/ ; https://zonos.com/blog/eu-customs-reform-2026 ; https://www.fedex.com/en-cn/service-news/eu-customs-reform/de-minimis.html (accessed 2026-09-12)

### 4.2 IOSS — and why a Dutch merchant mostly does not need it

- **IOSS survives.** It remains the VAT simplification for **B2C imports of consignments ≤ €150**, unchanged by the customs reform (which is a *duty* reform, not a *VAT* reform). (FACT, MEDIUM-HIGH)
- **The €150 IOSS VAT ceiling still stands.** Above €150, import VAT and duty are settled at the border (via carrier DDP or charged to the consumer). (FACT, MEDIUM-HIGH)
- **IOSS is primarily for sellers shipping goods from outside the EU direct to EU consumers.** A Dutch merchant holding stock in NL does **not** use IOSS for EU sales — those are intra-EU distance sales under **OSS** (§5).

### 4.3 The two models, compared honestly

**MODEL A — Import stock into NL, fulfil from NL (RECOMMENDED)**
- Import the consignment once: pay/defer import VAT + duty on the whole shipment, **one customs event**, **not €3 per parcel**.
- Use an **Artikel 23 vergunning** (import-VAT reverse charge): you do **not** pay import VAT at the border; it is shifted into your periodic btw return and simultaneously deducted → **cash-flow neutral**. Requires being established in NL, importing regularly, and keeping separate records; applied for in writing at your belastingkantoor and **must be in place before the goods arrive**. (FACT, HIGH)
- Sales to EU consumers are then **intra-EU distance sales** → OSS, no customs at all.
- GPSR-wise you have physically handled the goods and can build a technical file.
- **Cost:** working capital tied up in stock, warehousing, and the risk of dead stock.

**MODEL B — Dropship direct from China to EU consumer**
- Every parcel is a separate customs event: **€3+/line, plus import VAT, plus IOSS or carrier DDP overhead**, plus per-parcel brokerage.
- GPSR Art. 11/19 largely unsatisfiable (§2.5).
- EPR still applies — **you are the producer of the packaging placed on the destination market even though you never touched it**. (ASSUMPTION from producer definition — ★ verify)
- **Verdict: economically and legally inferior on every axis as of 2026.**

Sources: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/zakendoen_met_het_buitenland/zakendoen_buiten_de_eu/aangifte_doen_als_u_zakendoet_buiten_de_eu/aangifte_doen_als_u_goederen_importeert_uit_niet_eu_landen/vergunning_artikel_23_aanvragen ; https://crop.nl/kennisbank/vergunning-artikel-23-verleggen-van-de-invoer-btw/ ; https://www.cargoplot.com/nl/kennis/blog/artikel-23-vergunning-btw-invoer-nederland (accessed 2026-09-12)

---

## 5. VAT

### 5.1 Netherlands

- Rates: **21% standard, 9% reduced, 0%**. Most physical consumer goods → **21%**. (FACT, HIGH)
- 2026 change: **logies (short-stay accommodation) moved from 9% to 21% on 1 Jan 2026** — irrelevant to physical goods, noted only to confirm I checked for 2026 rate changes. (FACT, MEDIUM)
- **Domestic KOR** (small-business exemption) exists for low-turnover NL businesses but **blocks input-VAT deduction** — usually wrong for an importing merchant. ★ **REQUIRES PROFESSIONAL VERIFICATION** on interaction with imports.

Sources: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/berichten/nieuws/btw-logies ; https://www.mkbservicedesk.nl/belastingen/btw/btw-tarieven-en-vrijstellingen (accessed 2026-09-12)

### 5.2 EU OSS (Union scheme) — the single most important VAT fact

- **One EU-wide threshold of €10,000 per calendar year**, net of VAT, covering **all** cross-border B2C distance sales of goods **plus** TBE services **combined across all member states**. (FACT, HIGH)
- Below €10,000: charge **Dutch 21% btw** on EU cross-border consumer sales.
- Above €10,000: **place of supply becomes the customer's country** — you must charge **that country's VAT rate**, from the transaction that breaches the threshold.
- **OSS** lets you register once with the Belastingdienst and file **one quarterly return** covering all member states, instead of 26 separate VAT registrations. (FACT, HIGH)
- **€10,000 is very low.** At a €45 AOV that is ~220 cross-border orders **in total, across the whole EU, per year**. **You will breach it in your first months.** Plan for OSS registration at launch, not later.

Sources: https://www.kvk.nl/en/international/vat-rules-for-e-commerce-in-the-eu/ ; https://customsclearance.nl/en/knowledge-base/one-stop-shop/ ; https://www.vatupdate.com/2025/10/11/eu-vat-compliance-b2c-distance-sales-rules-and-e10000-threshold-guide/ (accessed 2026-09-12)

### 5.3 Cross-border SME scheme (since 1 Jan 2025) — possible but probably wrong for you

An alternative to OSS: if **EU-wide annual turnover ≤ €100,000** and you stay under each country's **national** small-business threshold, you can sell **VAT-exempt** cross-border, via a **VAT number ending "EX"** obtained through a single prior notification in NL, with a **single quarterly report**. (FACT, MEDIUM-HIGH)

**Catch: you lose input-VAT deduction on exempt supplies.** For an importer paying 21% import VAT on stock, that is usually value-destroying. ★ **REQUIRES PROFESSIONAL VERIFICATION** — this is a genuine fork in the road and a Dutch VAT adviser should model it.

Sources: https://sme-vat-rules.ec.europa.eu/sme-scheme/cross-border-sme-scheme_en ; https://www.taxually.com/blog/the-new-sme-scheme-implications-for-eu-vat-compliance ; https://europa.eu/youreurope/business/taxation/vat/vat-exemptions/index_en.htm (accessed 2026-09-12)

### 5.4 Non-EU markets

| Market | Rule | Label / Confidence |
|---|---|---|
| **UK** | **No registration threshold for non-established taxable persons (NETPs) — nil threshold, register from the first taxable supply.** The £135 consignment rule: for goods ≤ £135 shipped direct to UK consumers, **the overseas seller** charges and remits UK VAT (no import VAT at border); above £135, normal import VAT/duty. Online marketplaces take over the ≤£135 liability where the sale goes through them. The £135 concession is **reportedly under government review for abolition** (UNVERIFIED). | FACT / HIGH (nil threshold, £135 mechanism); UNVERIFIED (review) |
| **Switzerland** | Foreign mail-order business with **≥ CHF 100,000/yr turnover from small consignments** into CH is deemed to make domestic supplies → **must register for Swiss VAT**, import as the importer, and charge Swiss VAT. Below that, VAT/duty falls on the consumer at import (bad UX). | FACT / MEDIUM-HIGH |
| **Norway** | **VOEC** scheme for B2C goods **≤ NOK 3,000 per item**; registration mandatory once turnover exceeds **NOK 50,000**; VOEC sellers collect VAT at checkout and remit quarterly. Items > NOK 3,000 are taxed at the border. | FACT / MEDIUM |
| **US** | **Economic nexus: typically $100,000 in sales into a state** (many states have dropped the 200-transaction test — e.g. **Illinois removed it 1 Jan 2026**). **There is no foreign-seller exemption.** Plus: **$800 de minimis suspended since 29 Aug 2025, continued Feb 2026** → every parcel dutiable. | FACT / HIGH (nexus); MEDIUM-HIGH (de minimis) |

Sources: https://sterlingandwells.com/us/blogs/uk-vat-for-overseas-companies/ ; https://ukcompanyhub.com/blog/uk-vat-registration-non-residents.html ; https://www.estv.admin.ch/en/vat-mail-order-trade-and-platform-taxation ; https://www.toll.no/en/corporate/import/the-voec-scheme ; https://www.skatteetaten.no/en/business-and-organisation/vat-and-duties/vat/foreign/e-commerce-voec/register ; https://taxcloud.com/blog/sales-tax-nexus-by-state/ ; https://www.whitehouse.gov/presidential-actions/2026/02/continuing-the-suspension-of-duty-free-de-minimis-treatment-for-all-countries/ ; https://www.federalregister.gov/documents/2026/06/24/2026-12670/indefinite-suspension-of-the-de-minimis-exemption-for-merchandise-arriving-through-all-modes-other (accessed 2026-09-12)

### 5.5 What Shopify actually does and does not do

- Shopify **calculates and collects** VAT at checkout and supports **OSS** and **IOSS** configuration, and can collect **duties/import taxes (DDP)** at checkout. (FACT, MEDIUM-HIGH)
- Shopify has added support for **collecting the EU €3 import duty**. (MEDIUM)
- **Shopify does not file or remit your VAT returns, does not register you anywhere, and is not merchant of record.** You still file OSS with the Belastingdienst, register for UK VAT, VOEC, etc. yourself.
- Duties/import taxes are **not** calculated on shipments within the same country or between EU member states. (FACT, MEDIUM)
- A third-party **Merchant of Record** can absorb VAT/GST registration and remittance for **~2.5–6.5% of transaction value** (ESTIMATE, MEDIUM) — a real option for the UK/CH/NO/US long tail, at margin cost.

Sources: https://help.shopify.com/en/manual/taxes/eu/eu-tax-reference ; https://help.shopify.com/en/manual/international/duties-and-import-taxes/charging-duties ; https://help.shopify.com/en/manual/international/duties-and-import-taxes/considerations ; https://powercommerce.com/blogs/shopify-updates/shopify-and-the-eu-s-3-per-tariff-line-duty-what-merchants-need-to-know-before-july-1-2026 (accessed 2026-09-12)

---

## 6. EU CONSUMER LAW — WHAT IT DOES TO STORE DESIGN

### 6.1 Right of withdrawal (Consumer Rights Directive 2011/83/EU)

| Rule | Label |
|---|---|
| **14 days** from delivery of the goods, no reason required | FACT, HIGH |
| Refund within **14 days** of being informed, including **standard outbound delivery cost** (not the premium if the consumer upgraded to express) | FACT, HIGH |
| **Consumer bears the direct cost of return** — **only if you informed them in advance**. Fail to inform → **you pay returns** | FACT, HIGH |
| Withdrawal period extends (commonly to 12 months) if you fail to inform the consumer of the right | FACT, MEDIUM |
| Model withdrawal form must be made available | FACT, MEDIUM |
| **★ From 19 June 2026: mandatory electronic "withdrawal button"/withdrawal function** on any online interface used to conclude distance contracts; **withdrawing must not be more burdensome than buying**. Introduced by Directive (EU) 2023/2673 (transposition deadline 19 Dec 2025) | MEDIUM-HIGH |

**★ CONFLICT / TRAP.** Directive (EU) 2023/2673 is formally about **distance marketing of financial services**, which makes it easy to dismiss. Multiple independent law firms (Hogan Lovells, Loyens & Loeff, Freshfields, William Fry, Timelex, Simont Braun) state it inserts a **horizontally applicable** withdrawal-function obligation into the Consumer Rights Directive covering **goods, services and digital content**. Shopify has published merchant guidance on it. **Treat as applicable and build the button**, but ★ **REQUIRES PROFESSIONAL VERIFICATION** of the Dutch transposition.

Sources: https://www.hoganlovells.com/en/publications/transposition-under-french-law-of-the-eu-mandatory-withdrawal-button-for-online-sales ; https://www.loyensloeff.com/insights/news--events/news/new-eu-rules-on-withdrawing-from-online-contracts/ ; https://www.timelex.eu/en/blog/withdrawal-button-coming-whats-really-changing ; https://help.shopify.com/en/manual/compliance/legal/eu-right-of-withdrawal ; https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_en.htm (accessed 2026-09-12)

### 6.2 Legal conformity guarantee (Directive (EU) 2019/771)

- **Minimum 2 years** from delivery on new consumer goods, EU-wide. (FACT, HIGH)
- **Burden of proof reversed in the consumer's favour for the first 12 months** — you must prove the goods conformed at delivery. (FACT, HIGH)
- Some member states go further (longer periods, or a 2-year reversal). (FACT, MEDIUM)
- **Netherlands specifically:** Dutch law (BW Book 7) frames conformity around what the consumer may **reasonably expect** given the price and nature of the goods, which for durable goods can exceed two years. **UNVERIFIED here** — ★ **REQUIRES PROFESSIONAL VERIFICATION.**

**Commercial consequence:** cheap, failure-prone electronics and mechanical goods carry a **two-year-plus liability tail** with you funding repair/replacement/refund. This alone disqualifies low-quality gadgets.

Sources: https://eur-lex.europa.eu/eli/dir/2019/771/oj/eng (fetch blocked; summary via search) ; https://www.europe-consommateurs.eu/en/topics/guarantees/after-purchase/warranty/ ; https://www.reuschlaw.de/en/news/reversal-of-the-burden-of-proof-extended-what-sellers-should-know/ (accessed 2026-09-12)

### 6.3 Pre-contractual information and price indication

- Full pre-contractual information set (trader identity, geographic address, total price inclusive of taxes and all delivery/additional charges, payment/delivery arrangements, complaint handling, withdrawal right and conditions, guarantee reminder, duration/termination). (FACT, HIGH)
- **Price Indication Directive 98/6/EC:** selling price must be **unambiguous** = **final price including VAT and all other taxes**, and the **unit price** (per kg/litre/metre) must also be shown where it differs from the selling price. **Any advertising that mentions the selling price must also state the unit price.** (FACT, MEDIUM-HIGH)

**Consequence:** products sold by weight/volume (supplements, cosmetics, liquids, coffee, refills) carry an extra per-listing obligation.

Sources: https://webgate.ec.europa.eu/e-justice/599/EN/price_indication_directive_986 ; https://eur-lex.europa.eu/EN/legal-content/summary/price-indications-on-consumer-products.html (summary via search) (accessed 2026-09-12)

### 6.4 Omnibus Directive (EU) 2019/2161 — the growth-hack killer

| Rule | Label |
|---|---|
| Any announced price reduction must state the **lowest price applied in the 30 days preceding** the reduction | FACT, HIGH |
| **Fake reviews prohibited**; submitting or commissioning fake reviews is an unfair practice | FACT, HIGH |
| You must state **whether and how reviews are verified** as coming from actual purchasers | FACT, HIGH |
| Undisclosed paid placement / paid ranking must be disclosed | FACT, MEDIUM |
| Penalties: up to **4% of annual turnover** (or €2m where turnover data is unavailable) for widespread cross-border infringements | FACT, MEDIUM-HIGH |

**Directly outlawed or high-risk store patterns:** permanent "50% off" anchor pricing; inflated RRP/"compare-at" prices never actually charged; imported/seeded reviews from AliExpress listings; "only 3 left!" counters not tied to real stock; countdown timers that reset on reload.

### 6.5 Digital Fairness Act — forward risk

Commission proposal scheduled for **Q4 2026**, targeting **dark patterns (including fake urgency/countdowns), addictive design, influencer marketing, and unfair personalisation**, with a proposed "fairness-by-design" obligation. **This is a proposal, not law** — but it signals that any strategy dependent on urgency mechanics has a short remaining life. (FACT that it is scheduled, MEDIUM)

Sources: https://www.algoodbody.com/insights-publications/digital-fairness-act-a-necessary-safeguard-or-unnecessary-duplication ; https://www.europarl.europa.eu/RegData/etudes/ATAG/2025/767191/EPRS_ATA(2025)767191_EN.pdf ; https://www.farrer.co.uk/news-and-insights/fake-discounts-and-dodgy-reviews-consumer-law-reforms-for-retailers-selling-in-the-eu/ (accessed 2026-09-12)

---

## 7. GDPR / AVG + ePRIVACY

| Rule | Label |
|---|---|
| **Prior, informed, freely given consent required before placing/reading non-essential cookies or trackers** on the user's device (ePrivacy + Telecommunicatiewet art. 11.7a) | FACT, HIGH |
| **Meta Pixel, Google Analytics, and all ad/tracking scripts must not load or fire until consent is given** | FACT, HIGH |
| **Reject and Accept must be on the same layer with equal prominence** — "Accept all" may not be larger, more colourful, or more prominent than "Reject all" | FACT, HIGH (Autoriteit Persoonsgegevens guidance) |
| **Cookie walls prohibited** — you may not deny site access for refusing tracking cookies | FACT, HIGH |
| AP is enforcing cookie banners actively and publicly | FACT, MEDIUM |
| Shopify provides a **built-in consent banner** (Settings → Customer privacy) scopeable to EEA/UK/California, plus the **Customer Privacy API** that apps and pixels consume | FACT, MEDIUM-HIGH |
| **Google Consent Mode v2 mandatory for EEA/UK traffic since March 2024** for Google advertising products | FACT, MEDIUM |

**Commercial consequence (be blunt about this):** with a compliant banner, a meaningful share of EEA visitors reject tracking. **Your Meta/Google pixel data will be incomplete and your reported ROAS will diverge from reality.** Any acquisition plan assuming full-fidelity pixel attribution in the EU is wrong. Server-side tagging and Consent Mode modelling **do not create consent** — they model gaps. (ASSUMPTION on magnitude; the legal position is FACT)

Also required regardless of cookies: privacy statement, lawful basis, data-subject rights process, **processor agreements (verwerkersovereenkomsten)** with Shopify and every app that touches personal data, and a **record of processing**. ★ **REQUIRES PROFESSIONAL VERIFICATION.**

Sources: https://www.autoriteitpersoonsgegevens.nl/en/themes/internet-and-smart-devices/cookies/clear-cookie-banners ; https://www.autoriteitpersoonsgegevens.nl/en/themes/internet-and-smart-devices/cookies ; https://cookieinformation.com/regulations/cookie-guidelines/the-dutch-cookie-guidelines/ ; https://getkanal.com/blog/consent-mode-v2-shopify ; https://help.littledata.io/partner-recipes/cookie-consent-integrations/shopify-customer-consent-api (accessed 2026-09-12)

---

## 8. PRODUCT CATEGORIES — OFF-LIMITS AND HIGH-BURDEN

| Category | Regime | Verdict |
|---|---|---|
| **Cosmetics / skincare / haircare** | Reg. (EC) 1223/2009: EU-established **Responsible Person**; **CPNP notification per product before market**; **Product Information File**; **Cosmetic Product Safety Report by a qualified toxicologist/pharmacist/chemist per formulation**; GMP ISO 22716; strict ingredient annexes updated continuously; France also requires EPR | **OFF-LIMITS.** CPNP itself is free, but the CPSR/PIF work is the cost. Vendor ESTIMATE: **€10,000–€18,000/yr for ~20 SKUs** (LOW confidence — vendor marketing figure) |
| **Food, supplements, herbal preparations** | NVWA **product-by-product notification before Dutch market entry**; **Novel Food** pre-authorisation for new ingredients; **Regulation 1924/2006** health/nutrition claims — only authorised claims, **medical claims outright prohibited**; allergen labelling; FIC labelling; per-country notification regimes elsewhere in the EU | **OFF-LIMITS.** Also the highest advertising-enforcement risk of any category |
| **Toys & children's products** | Today: Toy Safety Directive 2009/48/EC + **EN 71** series + CE + full technical file + often third-party testing. Future: **Regulation (EU) 2025/2509** (published 12 Dec 2025, in force 1 Jan 2026, **applies 1 Aug 2030**) adds a **mandatory Digital Product Passport per toy model** and tighter chemical rules | **OFF-LIMITS for a first venture.** Child-safety enforcement is the most aggressive in the EU |
| **Mains-powered / wireless / battery electronics** | **LVD 2014/35** + **EMC 2014/30** + **RED 2014/53** (anything with radio/Bluetooth/Wi-Fi) + **RoHS** + **WEEE EPR** + **Batteries Reg. 2023/1542** + **USB-C common charger mandatory since 28 Dec 2024** for phones, tablets, cameras, headphones, earbuds, speakers, e-readers, keyboards, mice, handheld consoles, portable navigation. **The importer must sign the EU Declaration of Conformity in their own company name — a factory-issued DoC is legally invalid** | **HIGH BURDEN / effectively OFF-LIMITS** without a test-lab budget and a competent supplier |
| **Textiles & apparel** | **Reg. (EU) 1007/2011** fibre-composition labelling, durable and legible, **translated for every member state sold into**; **French textile EPR live now**; **EU-wide textile EPR mandatory ~2028**; **ESPR/DPP names textiles a priority group, DPP from ~2027 phasing to 2030**; plus the highest return rate of any category | **HIGH BURDEN.** Legal cost + returns economics combine badly |
| **Leather, wood, furniture, rubber, coffee, cocoa** | **EUDR (deforestation)** — applies **30 Dec 2026** for large operators, **30 June 2027** for micro/small; due-diligence statements and geolocation of plots | **MEDIUM-HIGH BURDEN**, and the deadline is close. Note EUDR has been delayed repeatedly — treat the date as unstable |
| **PPE, medical devices, e-cigarettes, machinery, pressure equipment, pyrotechnics, jewellery (nickel/REACH), candles** | Sector-specific regimes on top of GPSR | **OFF-LIMITS** |
| **Non-electrical, non-textile, adult-use, low-risk hard goods** (e.g. homewares without electronics, tools without motors, stationery, sport accessories, pet accessories, bags) | GPSR + packaging EPR + generic consumer law only | **LOWEST-BURDEN ZONE** — still requires a technical file and risk analysis per SKU |

Sources: https://ecomundo.eu/en/blog/responsible-person-role-cosmetics ; https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-product-notification-portal_en ; https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedingssupplementen/voedingssupplementen-importeren-produceren-of-verkopen ; https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedingsclaims-en-gezondheidsclaims/regels-over-claims-bij-levensmiddelen ; https://www.sgs.com/en-us/news/2025/12/safeguards-18725-eu-toy-safety-regulation-2025-2509-published ; https://www.intertek.com/products-retail/insight-bulletins/2025/1504-eu-published-the-regulation-on-the-safety-of-toys/ ; https://www.compliancegate.com/ce-marking-directives/ ; https://prodlaw.eu/2024/11/deadline-alert-for-electronics-usb-type-c-mandatory-from-december-2024/ ; https://www.compliancegate.com/textiles-labelling-requirements-european-union/ ; https://taxnews.ey.com/news/2026-0237-eu-deforestation-regulation-application-postponed-to-30-december-2026 ; https://www.consilium.europa.eu/en/press/press-releases/2025/12/18/deforestation-council-signs-off-targeted-revision-to-simplify-and-postpone-the-regulation/ ; https://fluxy.one/post/espr-2026-2030-digital-product-passport-guide (accessed 2026-09-12)

---

## 9. PRODUCT SELECTION SCREEN

Apply **before** any product research or sourcing spend. Any single HARD DISQUALIFIER kills the product.

### 9.1 HARD DISQUALIFIERS — do not proceed

- [ ] **D1.** Supplier cannot or will not supply a **technical file + documented risk analysis** (GPSR). *Ask for it in the first message. Most AliExpress/CJ/1688 suppliers will fail here and that is your fastest filter.*
- [ ] **D2.** Product cannot carry **permanent traceability marking** (type/batch/serial) and **your name + address** on the product or its packaging.
- [ ] **D3.** You cannot produce **warnings/safety info and instructions in the language of every market you sell into**.
- [ ] **D4.** Product is a **cosmetic** (anything applied to skin, hair, teeth, nails, lips — including "natural" and "unregulated" positioning).
- [ ] **D5.** Product is **food, a supplement, a herbal preparation, or makes any ingestion-related claim**.
- [ ] **D6.** Product is a **toy or intended/attractive for children under 14**.
- [ ] **D7.** Product is **PPE, a medical device, or makes any health/therapeutic claim** ("relieves pain", "improves posture", "reduces anxiety").
- [ ] **D8.** Product contains a **radio module (Bluetooth/Wi-Fi/RF)** and you cannot obtain valid RED test reports naming you as importer.
- [ ] **D9.** Product plugs into **mains power** and you cannot obtain valid LVD + EMC test reports and sign a DoC in your own name.
- [ ] **D10.** Business model is **dropship-direct-from-China to EU consumer** (fails GPSR Art. 11/19; fails post-de-minimis unit economics).
- [ ] **D11.** Product landed cost model only works **below ~€25 retail** on single-unit international parcels.
- [ ] **D12.** Store plan requires **fake scarcity, reset countdown timers, imported reviews, or an RRP you never charged** (Omnibus).

### 9.2 BURDEN FLAGS — proceed only with budget, or deliberately

| Flag | Trigger | Added burden |
|---|---|---|
| **B1 Battery** | Any integrated or included cell | Batteries Reg. registration per brand/category per country + labelling on battery *and* device |
| **B2 WEEE** | Anything electrical/electronic | Per-country WEEE registration (NL Stichting OPEN, DE stiftung ear, BE Recupel, FR…) |
| **B3 Textile** | Any fibre content | Reg. 1007/2011 labelling in every market language; FR textile EPR now; EU textile EPR ~2028; DPP later; **20–40% return rate (ESTIMATE)** |
| **B4 Unit price** | Sold by weight/volume/length | Unit price on every listing and every price advert |
| **B5 EUDR** | Leather, wood, rubber, cocoa, coffee, palm, soy, cattle | Due diligence statements from 30 Dec 2026 / 30 Jun 2027 |
| **B6 Durability tail** | Mechanical or electronic complexity | 2-year conformity, 12-month reversed burden of proof — model a warranty reserve |
| **B7 Fragile/bulky** | Breakage or oversize | PPWR **40% empty-space cap** on parcels constrains protective packaging design |
| **B8 SKU sprawl** | >15–20 SKUs | Compliance cost is **per SKU** (technical file, labelling, translation). Narrow range beats wide |
| **B9 Multi-HS bundles** | Bundles spanning tariff codes | €3 duty is **per declaration line** — bundles can multiply duty on imports |

### 9.3 POSITIVE SIGNALS

- EU/EEA-manufactured, supplier already the EU manufacturer with a technical file and DoC in hand
- Non-electrical, non-textile, no battery, adult-use, no ingestion, no skin contact claim
- Retail ASP **€40–€150** (absorbs €3–€5 customs, shipping, returns and compliance amortisation)
- Low return rate (not sizing- or fit-dependent)
- Small SKU count, long product life (compliance file amortises over years, not seasons)
- Ships flat/compact, robust — survives the 40% empty-space cap

---

## 10. MARKET SELECTION SCREEN

Compliance cost of adding each market. **"Cost" = fixed annual compliance overhead, independent of revenue.**

| Market | VAT / tax | EPR & product | Consumer law | Verdict |
|---|---|---|---|---|
| **NL** (home) | btw 21%/9%; Art. 23 import-VAT deferment; domestic filing | Packaging **<50,000 kg exempt** (SUP surcharge not exempt); WEEE via Stichting OPEN if electrical | Full EU consumer law; NVWA enforcement; Dutch language | **LAUNCH HERE.** Lowest marginal cost — you are already established |
| **BE** | OSS (once >€10k EU-wide) | Packaging **>300 kg** Fost Plus/Valipac; **no de minimis for Recupel or Bebat**; Belgian authorised rep needed for foreign sellers | **Two languages: NL + FR** mandatory for labelling/warnings | **LOW–MEDIUM.** Cheap on VAT, but dual-language doubles labelling/translation work |
| **DE** | OSS | **LUCID mandatory, no threshold** (free to register) + paid dual-system contract; **stiftung ear** for WEEE; batteries registration; from 12 Aug 2026 registration in own name | German-language everything; **the most litigious market in the EU — competitor *Abmahnung* warning letters over labelling, imprint and price errors are a real, routine business cost** | **MEDIUM–HIGH.** Biggest EU market, highest legal-friction. Do not enter casually |
| **FR** | OSS | **ADEME IDU, no threshold**, penalties to €30,000; IDU on invoices and T&Cs; **Triman + Info-Tri on packaging**; SYDEREP per-stream declarations; **live textile EPR**; PPWR authorised rep from 12 Aug 2026 | French-language mandatory (Toubon); active DGCCRF enforcement | **HIGH.** The most administratively demanding EU market for a small seller |
| **AT** | OSS | ARA/other scheme; **thresholds NOT VERIFIED** ★ | German language (shares assets with DE) | **MEDIUM (UNVERIFIED).** Cheap add-on *after* DE because language assets are shared |
| **IE** | OSS | Repak etc.; **thresholds NOT VERIFIED** ★ | English language; full EU consumer law | **LOW–MEDIUM (UNVERIFIED).** English-language EU market — attractive if EPR confirms cheap |
| **UK** | **Nil VAT registration threshold for non-established sellers — register from the first sale.** £135 consignment rule; UK VAT returns (MTD) | **Separate UK regime: UKCA marking, UK Responsible Person, UK WEEE/packaging EPR** — none of your EU compliance transfers | UK consumer law (Consumer Rights Act 2015), separate from EU | **HIGH.** A whole second compliance stack for one country. **Do not treat as "just another EU-ish market."** ★ verify UKCA/UK RP requirements — not researched in depth here |
| **US** | Sales tax economic nexus (~$100k/state, no foreign-seller exemption); **de minimis suspended — every parcel dutiable** since 29 Aug 2025 | CPSC regulations, state laws (California Prop 65, FTC labelling); product liability exposure with **no EU-style cap** | FTC rules on reviews/endorsements | **HIGH and volatile.** Tariff policy has changed repeatedly in 18 months. The duty-free arbitrage that made US DTC attractive is gone |
| **Nordics (SE/DK/FI)** | OSS (EU members) | National EPR schemes, **NOT VERIFIED** ★ | English widely accepted but local-language labelling still required | **MEDIUM (UNVERIFIED)** |
| **Norway** | **Not EU.** VOEC (≤ NOK 3,000/item; mandatory above NOK 50,000 turnover), quarterly remittance | Norwegian EPR regimes, **NOT VERIFIED** ★ | Norwegian consumer law | **MEDIUM.** VOEC is genuinely simple; everything else is a separate stack |
| **Switzerland** | **Not EU.** Register for Swiss VAT once ≥ **CHF 100,000/yr** from small consignments; below that the customer is hit at the border (bad UX) | Swiss product rules, **NOT VERIFIED** ★ | Swiss law | **MEDIUM–HIGH.** Small market, separate customs border, full second stack |

### 10.1 Recommended phasing (ASSUMPTION — strategy, not law)

1. **Phase 1: NL only.** Prove the product. Stay under the €10,000 EU distance-selling threshold deliberately if possible, or register OSS immediately if not.
2. **Phase 2: NL + BE + one of {DE, AT}** — BE for proximity, DE/AT to reuse German-language assets across two markets.
3. **Phase 3: FR** only once volume justifies IDU + Triman + SYDEREP + authorised representative.
4. **Phase 4: UK or US** only as a deliberate second-stack investment, not an afterthought "Shopify Markets toggle".
5. **Never: "worldwide shipping enabled" on day one.** Every enabled country is an unregistered compliance liability.

---

## 11. ITEMS REQUIRING PROFESSIONAL VERIFICATION

**Dutch/EU product-compliance lawyer:**
1. ★ Whether, as an NL-established importer, you are automatically the GPSR Art. 16 responsible person and therefore need **no** third-party RP service (this is a live €200–€1,500/yr spending decision, and vendors have an incentive to tell you otherwise).
2. ★ Exactly what a defensible GPSR **technical file and internal risk analysis** must contain for a **non-harmonised** consumer product (no CE directive applies) — the practical minimum is not publicly standardised.
3. ★ When own-brand labelling flips you from importer to **deemed manufacturer**, and what that adds.
4. ★ Dutch penalty regime for GPSR breaches (Warenwet / NVWA) — could not verify.
5. ★ Scope of the **19 June 2026 withdrawal button** under Dutch transposition: goods, or financial services only.
6. ★ Dutch conformity-guarantee duration in practice (BW 7:17/7:18) versus the EU 2-year minimum.
7. ★ GPSR obligations of print-on-demand / white-label fulfilment partners, and whether their contracts validly pass the manufacturer role to you.

**Dutch VAT adviser:**
8. ★ **OSS vs the cross-border SME scheme** — modelled against your import-VAT deduction position. This is a genuine fork with real money on it.
9. ★ Artikel 23 licence eligibility, application timing, and record-keeping requirements.
10. ★ Whether the **domestic KOR** is ever right for an importing merchant (probably not — input VAT).
11. ★ UK NETP registration mechanics and the current status of the £135 concession.
12. ★ Whether a Merchant-of-Record model is preferable to direct registration for UK/CH/NO/US.

**EPR compliance agent (get two competing quotes):**
13. ★ **PPWR Art. 45 authorised-representative** obligation — is it genuinely mandatory per country from 12 Aug 2026 for a small NL distance seller, and at what price?
14. ★ Real all-in annual cost of packaging + WEEE + battery EPR per target country.
15. ★ NL 50,000 kg under-threshold: exact scope, and whether the SUP surcharge applies to your packaging.
16. ★ Whether PPWR packaging **declaration of conformity + technical documentation** applies to a merchant who buys generic shipping cartons rather than designing packaging.

**Privacy counsel / DPO-as-a-service:**
17. ★ Cookie-banner configuration sign-off; processor agreements with Shopify and each app; ROPA; whether any app transfers data outside the EEA and on what transfer mechanism.

**Insurance broker:**
18. ★ **Product liability insurance** (Directive (EU) 2024/2853, the revised Product Liability Directive, was not researched here and is a known gap — see §12).

---

## 12. WHAT I COULD NOT VERIFY

**Structural limitation:** ★ **No primary legal source could be opened.** Web page fetching was blocked for every domain tested including EUR-Lex, the European Commission, business.gov.nl, gov.uk and Wikipedia. **Every citation in this document is a secondary source accessed via search summaries on 2026-09-12.** This is the single largest caveat in the report.

**Specific unresolved items:**

1. **★ CONFLICT — €3 duty base.** "Per item" vs "per customs declaration line" vs "per tariff line/HS code". The best sources say per **declaration line** (goods sharing an HS code group into one line). Materially affects bundle/multi-SKU economics. Unresolved.
2. **★ UNVERIFIED — the ~€2 customs handling fee from ~Nov 2026.** Reported only from a June 2025 Council mandate. Do not model as certain.
3. **★ UNVERIFIED — exact legislative dates** for the customs reform (final approval 11 Feb 2026, OJ publication 30 Apr 2026 cited by one source only).
4. **★ CONFLICT — EU textile EPR deadline.** "2027" vs "17 April 2028" (with micro-enterprises ~April 2029). Unresolved.
5. **★ UNVERIFIED — PPWR Art. 45 authorised-representative requirement.** Consistently reported across several 2026 compliance sources, but never confirmed against the regulation text. Highest-value item to verify — it drives per-market fixed cost.
6. **★ UNVERIFIED — withdrawal button scope.** Strong law-firm consensus that it is horizontal to goods, but the parent directive is nominally about financial services.
7. **★ NOT VERIFIED AT ALL — EPR thresholds and schemes for Austria, Ireland, Sweden, Denmark, Finland, Norway, Switzerland.** Those market rows in §10 are incomplete.
8. **★ NOT RESEARCHED — the UK stack.** UKCA marking, UK Responsible Person under the UK GPSR equivalent, UK WEEE/packaging EPR, UK textile labelling. The UK row in §10 flags this as a second full stack but does not enumerate it. **Do this before any UK decision.**
9. **★ NOT RESEARCHED — Product Liability Directive (EU) 2024/2853.** The revised PLD (member-state transposition due ~Dec 2026) extends strict liability, reportedly including to importers and, where no EU manufacturer/importer can be identified, to fulfilment service providers and online platforms. **This is a material gap in a report about importer risk.** Research separately.
10. **★ NOT RESEARCHED — Digital Services Act** obligations for a merchant's own website (largely aimed at intermediaries, but trader-traceability and advertising-transparency provisions may touch you).
11. **★ UNVERIFIED — GPSR penalties in the Netherlands.** The "€10,000 for SMEs" figure is single-source and likely German.
12. **★ ESTIMATE ONLY — all cost figures.** RP services (€150–€5,000/yr), EPR agents (€300–€1,500/country/stream), cosmetics compliance (€10k–€18k/yr for 20 SKUs), MoR fees (2.5–6.5%). All from vendors selling the service. Get real quotes.
13. **★ NOT VERIFIED — whether a dropshipper who never touches goods is the EPR "producer"** of the packaging in the destination market. I assumed yes from the definition; it should be confirmed.
14. **★ NOT VERIFIED — Shopify's current EU feature set in detail** (whether OSS/IOSS/€3-duty support covers your exact configuration). Verify in-product, not from blogs.

---

## 13. ONE-PARAGRAPH BOTTOM LINE

The EU in 2026 has closed the arbitrage that made cheap cross-border dropshipping work. GPSR makes the Dutch seller the legally responsible importer — and usually the deemed manufacturer — with a per-SKU technical file and risk analysis that a commodity Chinese supplier cannot provide; the €150 de minimis is gone and every small parcel now carries fixed customs cost; EPR is a per-country, per-stream fixed overhead with no meaningful small-seller exemption in Germany, France or Belgium; the consumer regime forces 14-day no-reason returns with you paying the outbound leg, a two-year conformity tail, and bans the discount-anchoring, fake-scarcity and seeded-review mechanics the model depends on. **The surviving shape is narrow: a small range of higher-ASP (€40–€150), non-electrical, non-textile, non-ingestible, adult-use own-brand goods, bulk-imported into NL under an Article 23 licence, launched NL-first and expanded one market at a time.** That is not a constraint to work around — it is the product brief.
