# Data Extraction Verification Report

**Project:** Greenspace Access NI — Stage 1
**Source:** *Development of Greenspace Standard Index — Interim Report v2*, 56 Degree Insight for Outscape, 14 July 2026 (PowerPoint, 24 slides)
**Extraction method:** Values were read from the report's **embedded chart workbooks** (`ppt/embeddings/*.xlsx`, the exact data behind each chart, at full precision) and from the report's slide tables (theme indices and sample sizes). No values were estimated from chart pixels, modelled, or invented. The transcription and all checks below are encoded in `scripts/extract_data.py`, which regenerates every file in `data/`.

## What was extracted

| Dataset | File(s) | Rows | Source slides |
|---|---|---|---|
| NI overall + four theme scores | `ni_overall.json` | 1 + 4 | 7 |
| Local authority results (% / index / 4 theme indices) | `lgd_results.json/.csv` | 11 | 8–9 |
| Postcode area results (+ sample sizes) | `postcode_area_results.json/.csv` | 48 | 10–11 |
| Postcode sector results (+ sample sizes) | `postcode_sector_results.json/.csv` | 23 | 12–13 |
| IMD, urban/rural, age, sex, visit-frequency splits | `classifications.json` | 19 groups | 17–21 |
| Sub-score comparisons (NI vs deprivation extremes; NI vs BT20 vs BT82) | `subscore_comparisons.json` | — | 22 |
| Theme top-ten rankings | `theme_rankings.json` | 4 × 10 | 23 |
| Q14/Q15 response distributions + scoring framework | `survey_inputs.json` | 9 + 6 cats | 3–4 |
| Methodology (themes, inputs, weighting, aggregation) | `methodology.json` | — | 5–6 |
| Sample sizes, thresholds, margins of error, caveats | `metadata.json` | — | 2, 6 |
| Summary findings | `key_findings.json` | 6 | 24 |

Decile rankings are described in the report as a proposed reporting format but **no decile values are published**, so none were extracted.

## Verification checks (all passing)

1. **Theme-index → total reconciliation (82/82 rows).** For every LGD, postcode area and postcode sector, the total % implied by its four integer theme indices × the NI theme baselines (65/81/80/83%) agrees with the published total % within integer-rounding tolerance (±0.6pp).
2. **Slide 23 cross-check.** Sorting the extracted theme-index columns reproduces the report's four top-ten rankings: Access To and Quality exactly; Access Within and Benefits exactly up to ties at index 104 (which the report resolved with its unrounded data).
3. **Chart-to-workbook identity.** Every charted value matches its embedded workbook at full precision (the workbooks are the charts' data source).
4. **NI overall.** Mean of the four theme percentages = 77.25%, consistent with the reported 77%.
5. **LGD % vs index.** The two LGD series rank identically (fully consistent).

## Source anomalies found (documented, not "corrected" silently)

1. **Place-name labels misaligned on three row pairs.** The theme-index tables on slides 11 and 13 sit alongside bar charts ordered by Total Index, and the data rows align 1:1 with the bars — but the place-name column appears to have retained the Total-% sort order from the source workbook. Result: the labels of **BT15 ↔ BT1**, **BT16 2 ↔ BT6 8**, and **BT40 1 ↔ BT66 7** are swapped in the printed report. Proof: with the chart-order mapping, sorting Access To reproduces slide 23's top ten exactly (BT15 #4, BT1 absent) and Quality's top ten includes BT1 but not BT15 — both impossible under the printed labels. The extracted data assigns values by BT code (authoritative) and records the printed label in `source_label_note`.
2. **"BT82 Ballymoney" on slide 22.** BT82 is **Strabane** (as slide 11's own table shows); the chart's theme values reconcile to BT82's published total (71%). Extracted as BT82/Strabane with the source label noted.
3. **% and Index series imply slightly different NI baselines.** At postcode area (31 rank positions) and sector (10 positions) level, the published Total-% and Total-Index rankings disagree slightly (e.g. BT60 has a higher % than BT37 but a lower index). The implied NI denominator varies between ~76.9% and ~78.1% across rows, suggesting the two series were computed with slightly different weighting/rounding in the source workbook. **Both series are kept exactly as published**; the application should never recompute one from the other. Recommend confirming the intended baseline with 56 Degree Insight before final publication.
4. **Map legend (slides 14–16)** shows a 0–100 colour ramp although plotted Total Index values span ~91–112; treat the report maps as illustrative only.

## Known limitations to carry into the application

- Perception data (POMNI Q14/Q15), **not** objective provision measurement.
- Interim, proposed methodology — not an adopted statutory standard.
- n = 4,000 overall; postcode geographies reported only at n ≥ 30; 95% margins of error ≈ ±8pp (n≈150) to ±18pp (n=30); typically <1% of each area's population sampled. Small apparent differences between places are **not** statistically significant and the UI must not imply they are.
- LGD-level sample sizes are not published in the report.
- The report notes an accompanying Excel document with more detailed outputs — not supplied; postcode-level theme *percentages* (as opposed to indices) and decile values would come from it.
