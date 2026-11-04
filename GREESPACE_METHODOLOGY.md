# Greenspace Standards Index — Methodology

Faithful record of the methodology in *Development of Greenspace Standard Index — Interim
Report v2* (56 Degree Insight for Outscape, 14 July 2026). The application must present the
index exactly as defined here and must not recompute, reweight or extend it.

> **Status.** This is a **proposed, survey-based index** developed from POMNI data, shared
> by 56 Degree Insight to obtain Outscape's feedback before the framework is finalised. It
> is an **interim output**, not an adopted statutory greenspace standard. All scores measure
> **residents' perceptions**, not objective greenspace provision.

## 1. Data source

- **Survey:** People in the Outdoors Monitor for Northern Ireland (POMNI), 2025 wave; **4,000 respondents**.
- **Inputs:** Q14 (nine agree/disagree statements about the respondent's nearest greenspaces) and Q15 (walk time to nearest local greenspace). These were selected because they directly measure local greenspace experience, cover accessibility, quality and benefits, and are asked of all respondents. Other POMNI attitude/behaviour variables were considered and excluded (more likely to reflect individual behaviours, preferences and circumstances than local provision).
- POMNI captures perceptions, which may vary with health, mobility, awareness and personal circumstances — different from, and complementary to, GIS-based provision measures.

## 2. Scoring of responses

| Q14 response | Points | | Q15 response | Points |
|---|---|---|---|---|
| Agree strongly | 5 | | 5 minute walk or less | 5 |
| Agree slightly | 4 | | 6–10 minute walk | 4 |
| Neither / Don't know | 3 | | 11–20 minute walk | 3 |
| Disagree slightly | 2 | | 21–30 minute walk | 2 |
| Disagree strongly | 1 | | More than 30 minutes / Don't know | 1 |

## 3. The four themes

| # | Theme | Inputs | Max points |
|---|---|---|---|
| 1 | **Accessibility To Greenspace** | Q14 "easy to get to without a car" + Q15 walk time | 10 |
| 2 | **Access Within Greenspace** | Q14 "safe and welcoming" + "inclusive for people of all abilities" | 10 |
| 3 | **Quality** | Q14 "easy to navigate, clear paths and signage" + "amenities and facilities I need" + "feel well cared for" + "rich in nature and wildlife" | 20 |
| 4 | **Benefits** | Q14 "benefit my mental health / encourage physical activity" + "improve my sense of community" | 10 |

Each theme total is expressed as a **percentage of its maximum**; the overall score is the
**average of the four theme percentages**. **Equal weighting** applies to inputs within
themes and to the four themes (steering-group decision: transparent, replicable across
future POMNI waves, avoids subjective weightings). Scores are computed per respondent, then
aggregated by geography / population group.

## 4. The three reporting formats (keep distinct in the UI)

1. **Percentage of maximum possible score** — absolute performance; 100% = highest possible. NI overall = **77%**.
2. **Index relative to the NI average (100)** — 110 ≈ 10% above average; 90 ≈ 10% below.
3. **Decile ranking** — areas ranked and split into ten equal groups; proposed for mapping/differentiation. *No decile values are published in the interim report*, so the app may compute deciles **only** as an explicit UI ranking of the published values, labelled as derived.

The application must always label which format is on screen and never mix them in one scale.

## 5. Headline published values

- **NI overall: 77%.** Themes: Accessibility To **65%**, Access Within **81%**, Quality **80%**, Benefits **83%**.
- 11 local authorities: totals 73.2%–79.7% (index 94.2–103.4) — "relatively modest variation".
- 48 postcode areas (71.3%–86.5%) and 23 postcode sectors (72.6%–84.5%) — greater variation; Accessibility To varies most (indices 72–123); Quality and Benefits are more consistent.
- Full values: `data/*.json|csv` (see DATA_EXTRACTION_VERIFICATION.md for provenance and source anomalies).

## 6. Statistical integrity rules (binding on every UI surface)

1. **Minimum reporting threshold:** postcode areas/sectors shown only at **n ≥ 30 respondents**; smaller areas are excluded in the source and must not appear.
2. **Uncertainty:** 95% margins of error ≈ **±8pp** for the largest postcode areas (c.150 interviews) to **±18pp** at the n=30 threshold; typically **<1%** of an area's population is sampled. Surface sample sizes and uncertainty wherever area results are shown.
3. **No false precision:** results identify **broad geographic patterns**, not precise differences between individual areas. Never present small differences (or adjacent ranks) as statistically significant; avoid league-table framing at postcode level.
4. **Perception, not provision:** never equate a survey score with measured physical accessibility; keep the two visually and verbally distinct (see COMPARE spec).
5. **Interim status:** label the index as proposed/interim pending methodology confirmation.
6. **Published values are canonical:** display the report's % and index values as published (both series retained even where their implied baselines differ slightly — see verification report §3); do not recompute one from the other.

## 7. Validity evidence reported

Scores rise monotonically with visit frequency (Never 59%/index 76 → Every day 82%/index 107),
i.e. higher scores among groups with greater greenspace engagement — reported as supporting
the credibility of the approach.

## 8. Next steps stated in the report

Confirm the four-component structure and methodology; agree preferred reporting and mapping;
confirm postcode reporting thresholds; review integration alongside existing GIS measures in
the Greenspace NI Map (this project); apply to future POMNI waves for consistent monitoring.
