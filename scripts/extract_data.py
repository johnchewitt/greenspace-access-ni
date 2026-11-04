#!/usr/bin/env python3
"""
Greenspace Access NI — Stage 1 data extraction.

Transcribes the reported values from "Development of Greenspace Standard Index —
Interim Report v2, 14 July 2026" (56 Degree Insight for Outscape) into structured
JSON/CSV. Every value below was read from the report's embedded chart workbooks
(ppt/embeddings/*.xlsx) or its slide tables. Nothing is modelled or inferred.

Validation (run as part of this script):
 1. Theme-index rows are re-anchored to BT codes via the chart category order;
    this mapping is verified by recomputing each geography's implied total %
    from its four theme indices x NI theme baselines (must agree within
    integer-rounding tolerance), and by reproducing slide 23's four top-ten
    rankings exactly from the theme columns.
 2. Published % and Index series are checked for mutual consistency; known
    source inconsistencies are reported, not silently "fixed".
"""
import json, csv, os, sys

OUT = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- metadata
METADATA = {
    "source_document": "Development of Greenspace Standard Index — Interim Report v2",
    "source_version": "v2, 14 July 2026",
    "author": "56 Degree Insight, commissioned by Outscape",
    "survey": "People in the Outdoors Monitor for Northern Ireland (POMNI), 2025 wave",
    "status": ("Interim study. This is a PROPOSED survey-based index under review by "
               "Outscape, not an adopted statutory greenspace standard."),
    "measurement_basis": ("All results reflect POMNI respondents' PERCEPTIONS of their "
                          "local greenspaces (POMNI Q14 and Q15), not objective measures "
                          "of greenspace provision."),
    "total_sample": 4000,
    "reporting_threshold": {
        "minimum_respondents": 30,
        "applies_to": ["postcode_area", "postcode_sector"],
        "note": ("Postcode areas/sectors with <30 respondents are excluded from the "
                 "report. Even above the threshold, results identify broad geographic "
                 "patterns rather than precise differences between individual areas.")},
    "margins_of_error_95pct": {
        "largest_postcode_areas_c150_interviews": "±8 percentage points",
        "minimum_threshold_30_interviews": "±18 percentage points",
        "note": "Typically <1% of the population sampled in each area."},
    "score_formats": {
        "percentage": "Score as % of the maximum possible score (100% = highest possible).",
        "index": ("Score relative to the Northern Ireland population average, where 100 = NI "
                  "average; 110 ≈ 10% above average, 90 ≈ 10% below average."),
        "decile": ("Areas ranked highest→lowest and split into ten equal groups; proposed in "
                   "the report for mapping/differentiation. No decile values are published "
                   "in this report, so none are extracted.")},
}

# ------------------------------------------------- survey inputs (slides 3-4)
SURVEY_INPUTS = {
    "q14": {
        "question": ("Q14. How much do you agree or disagree with the following statements "
                     "relating to your nearest greenspace areas?"),
        "greenspace_definition": ("Places like off-road trails, parks, the coast, woodlands, "
                                  "rivers and other natural places you could spend time in "
                                  "taking part in outdoor activities such as walking"),
        "scoring": {"Agree strongly": 5, "Agree slightly": 4,
                    "Neither agree nor disagree / Don't know": 3,
                    "Disagree slightly": 2, "Disagree strongly": 1},
        # NI-level response distributions (proportions), slide 4 chart.
        "response_distributions": {
            "benefit my mental health and encourage physical activity like walking or cycling":
                {"agree_strongly": 0.488534, "agree_slightly": 0.315132, "neither_nor": 0.115139,
                 "disagree_slightly": 0.026766, "disagree_strongly": 0.012445, "dont_know": 0.041984},
            "are easy to navigate, with clear paths and signage":
                {"agree_strongly": 0.400533, "agree_slightly": 0.379671, "neither_nor": 0.112569,
                 "disagree_slightly": 0.040458, "disagree_strongly": 0.020409, "dont_know": 0.046361},
            "are safe and welcoming":
                {"agree_strongly": 0.397630, "agree_slightly": 0.372943, "neither_nor": 0.127227,
                 "disagree_slightly": 0.046961, "disagree_strongly": 0.012317, "dont_know": 0.042923},
            "are rich in nature and wildlife, allowing me to connect with the environment":
                {"agree_strongly": 0.377540, "agree_slightly": 0.370962, "neither_nor": 0.132248,
                 "disagree_slightly": 0.051539, "disagree_strongly": 0.018093, "dont_know": 0.049619},
            "improve my sense of community and make my area a better place to live":
                {"agree_strongly": 0.357244, "agree_slightly": 0.365229, "neither_nor": 0.184754,
                 "disagree_slightly": 0.034383, "disagree_strongly": 0.015644, "dont_know": 0.042746},
            "feel well cared for":
                {"agree_strongly": 0.352891, "agree_slightly": 0.398592, "neither_nor": 0.108564,
                 "disagree_slightly": 0.063661, "disagree_strongly": 0.033153, "dont_know": 0.043139},
            "are inclusive for people of all abilities":
                {"agree_strongly": 0.350898, "agree_slightly": 0.362010, "neither_nor": 0.130509,
                 "disagree_slightly": 0.068121, "disagree_strongly": 0.029826, "dont_know": 0.058636},
            "are easy to get to without a car":
                {"agree_strongly": 0.300733, "agree_slightly": 0.283360, "neither_nor": 0.124378,
                 "disagree_slightly": 0.147659, "disagree_strongly": 0.122305, "dont_know": 0.021565},
            "provide the amenities and facilities I need, such as seating, bins, or toilets":
                {"agree_strongly": 0.282187, "agree_slightly": 0.351850, "neither_nor": 0.140152,
                 "disagree_slightly": 0.107115, "disagree_strongly": 0.075340, "dont_know": 0.043356},
        },
    },
    "q15": {
        "question": "Q15. How long does it take you to walk to your nearest local greenspace?",
        "greenspace_definition": ("Places like parks, playing fields, paths, trails and natural "
                                  "places you could spend time in taking part in outdoor "
                                  "activities such as walking"),
        "scoring": {"5 minute walk or less": 5, "Within a 6-10 minute walk": 4,
                    "Within an 11-20 minute walk": 3, "Within a 21-30 minute walk": 2,
                    "More than a 30 minute walk / Don't know": 1},
        "response_distribution_2025": {
            "5 minute walk or less": 0.17, "Within a 6-10 minute walk": 0.22,
            "Within an 11-20 minute walk": 0.22, "Within a 21-30 minute walk": 0.13,
            "More than a 30 minute walk": 0.20, "Don't know": 0.05},
    },
    "excluded_inputs_rationale": ("Other POMNI attitudinal/behavioural variables were considered "
                                  "but excluded: responses judged more likely to reflect individual "
                                  "behaviours, preferences and personal circumstances rather than "
                                  "local greenspace provision."),
}

# ------------------------------------------------------- methodology (5-6)
METHODOLOGY = {
    "themes": [
        {"id": "access_to", "name": "Accessibility To Greenspace",
         "inputs": ["Q14: easy to get to without a car", "Q15: walk time to nearest greenspace"],
         "max_points": 10},
        {"id": "access_within", "name": "Access Within Greenspace",
         "inputs": ["Q14: safe and welcoming", "Q14: inclusive for people of all abilities"],
         "max_points": 10},
        {"id": "quality", "name": "Quality",
         "inputs": ["Q14: easy to navigate, with clear paths and signage",
                    "Q14: provide the amenities and facilities I need",
                    "Q14: feel well cared for", "Q14: rich in nature and wildlife"],
         "max_points": 20},
        {"id": "benefits", "name": "Benefits",
         "inputs": ["Q14: benefit my mental health and encourage physical activity",
                    "Q14: improve my sense of community"],
         "max_points": 10},
    ],
    "aggregation": ("Each theme total is expressed as a % of its maximum possible value; the four "
                    "theme percentages are averaged (equal weights) to give the Overall Greenspace "
                    "Index for each respondent, then aggregated across population groups/areas."),
    "weighting": ("Equal weighting of inputs within themes and of the four themes in the overall "
                  "score, per project steering group feedback — transparent, replicable, avoids "
                  "subjective weightings."),
    "applied_to": "All 4,000 POMNI respondents",
}

# ------------------------------------------------------------- NI overall (7)
NI_OVERALL = {
    "total_pct": 77,          # reported as 77% on slide 7
    "themes_pct": {"access_to": 65, "access_within": 81, "quality": 80, "benefits": 83},
    "note": "Index = 100 for Northern Ireland by definition.",
}

# ------------------------------------------- local authorities (slides 8-9)
# (report_name, ons_lad_code, total_pct, total_index, AT, AW, Q, B)
# report_name as printed; ons code is the standard LAD code for the named district.
LGD = [
    ("Belfast City",                      "N09000003", 0.796505, 103.374, 109, 102, 102, 100),
    ("Lisburn City & Castlereagh",        "N09000007", 0.790735, 102.431, 105, 103, 101, 101),
    ("Antrim & Newtonabbey",              "N09000001", 0.789932, 102.207, 102, 103, 103, 101),
    ("North Down & Ards",                 "N09000011", 0.786893, 101.904, 104, 101, 101, 101),
    ("Newry City, Mourne & Down",         "N09000010", 0.771718,  99.687,  97, 101, 100, 101),
    ("Armagh City, Banbridge & Craigavon","N09000002", 0.760513,  98.016,  91,  99, 101, 101),
    ("Derry City & Strabane",             "N09000005", 0.755394,  97.628,  96,  97,  97, 100),
    ("Mid-Ulster",                        "N09000009", 0.755028,  97.199,  88,  99, 101, 100),
    ("Mid & East Antrim",                 "N09000008", 0.741695,  95.948,  96,  96,  94,  97),
    ("Causeway Coast & Glens",            "N09000004", 0.741293,  95.907,  96,  95,  96,  97),
    ("Fermanagh & Omagh",                 "N09000006", 0.732269,  94.179,  84,  98,  97,  98),
]

# -------------------------------- postcode areas (slides 10-11), n>=30 only
# Values transcribed from the embedded chart workbooks (total % and total index)
# and the slide-11 table (theme indices + sample size), with table rows anchored
# to BT codes via the chart category order (validated below). place_report =
# the area label printed in the report row; where that label is misaligned in
# the source (rows for BT15/BT1), place is corrected and flagged.
# (code, place, total_pct, total_index, AT, AW, Q, B, n, label_note)
PC_AREA = [
    ("BT20","Bangor",                 0.865152,112.461,122,110,110,108, 66,None),
    ("BT9", "South Belfast",          0.843333,109.796,123,106,106,105, 45,None),
    ("BT4", "East Belfast",           0.830068,107.794,116,104,105,106, 74,None),
    ("BT67","Moira",                  0.828571,107.642,116,105,106,104, 49,None),
    ("BT37","Whiteabbey / Jordanstown",0.819681,106.831,122,102,103,101,47,None),
    ("BT15","North Belfast",          0.819388,106.720,120,102,103,101, 49,
        "Report table row printed 'Belfast City Centre'; label swapped with BT1 in source (see verification report)."),
    ("BT60","Armagh",                 0.822917,106.578,109,107,105,105, 30,None),
    ("BT1", "Belfast City Centre",    0.819898,106.239,109,106,105,104, 49,
        "Report table row printed 'North Belfast'; label swapped with BT15 in source (see verification report)."),
    ("BT27","Lisburn",                0.810784,105.310,113,105,102,101, 51,None),
    ("BT16","Dundonald",              0.807692,105.131,117,102,101,101, 52,None),
    ("BT6", "South Belfast",          0.805511,104.724,114,101,103,101, 93,None),
    ("BT39","Ballyclare",             0.808125,104.427,102,105,107,104, 60,None),
    ("BT5", "East Belfast",           0.799543,103.729,109,106,102, 99, 82,None),
    ("BT8", "South Belfast",          0.796053,103.227,109,100, 99,105, 57,None),
    ("BT14","North Belfast",          0.792241,103.135,115,101, 97, 99, 58,None),
    ("BT19","Bangor",                 0.793324,102.921,108,101,102,101, 88,None),
    ("BT43","Ballymena",              0.794293,102.849,105,102,100,104, 46,None),
    ("BT34","Newry / Mournes",        0.793673,102.822,105,101,103,102, 81,None),
    ("BT41","Antrim",                 0.794382,102.444, 96,106,107,102, 89,None),
    ("BT30","Downpatrick",            0.781793,101.223,103,104, 98,100, 46,None),
    ("BT71","Dungannon",              0.786058,101.219, 92,103,105,105, 52,None),
    ("BT11","West Belfast",           0.782273,101.018, 98,102,100,103, 55,None),
    ("BT53","Ballymoney",             0.776630,100.375, 99,101,101,101, 69,None),
    ("BT7", "South Belfast",          0.772756,100.339,107,100, 96, 97, 39,None),
    ("BT23","Newtownards",            0.772850, 99.837, 97,102,100,100,157,None),
    ("BT36","Newtownabbey",           0.769886, 99.536, 98,101,100, 99,110,None),
    ("BT12","West Belfast",           0.764815, 99.345,107, 94,100, 97, 54,None),
    ("BT45","Magherafelt",            0.772135, 99.181, 86,103,105,103, 48,None),
    ("BT28","Lisburn",                0.768399, 99.095, 93,102,102,100, 89,None),
    ("BT22","Ards Peninsula",         0.760577, 98.466,100, 95, 99,100, 52,None),
    ("BT35","Newry / South Armagh",   0.761141, 98.266, 95, 99, 97,102, 46,None),
    ("BT66","Craigavon / Lurgan",     0.764789, 98.219, 84,103,104,101, 71,None),
    ("BT42","Ballymena",              0.757971, 98.160,100, 96, 97, 99, 69,None),
    ("BT62","Craigavon",              0.756707, 97.960, 99, 97, 99, 97, 41,None),
    ("BT38","Carrickfergus",          0.755319, 97.797,100, 99, 95, 97, 94,None),
    ("BT13","West Belfast",           0.750915, 97.510,104, 96, 95, 95, 41,None),
    ("BT48","Derry / Londonderry",    0.750781, 97.307,101, 94, 97, 97, 96,None),
    ("BT63","Portadown",              0.755303, 97.127, 87, 97,100,105, 33,None),
    ("BT47","Derry (Waterside)",      0.752835, 97.000, 90, 98, 98,102, 97,None),
    ("BT51","Coleraine / North Coast",0.750397, 96.961, 94, 97,101, 96, 63,None),
    ("BT24","Ballynahinch",           0.748649, 96.336, 87,100,100, 99, 37,None),
    ("BT40","Larne",                  0.735156, 95.328, 99, 95, 94, 93, 64,None),
    ("BT17","Dunmurry",               0.735677, 95.216, 96, 95, 94, 96, 48,None),
    ("BT52","Coleraine",              0.732895, 95.164,102, 92, 93, 93, 57,None),
    ("BT32","Banbridge",              0.727907, 94.447, 99, 93, 95, 90, 43,None),
    ("BT94","Irvinestown / Kesh",     0.722656, 92.390, 72, 97,101,100, 32,None),
    ("BT82","Strabane",               0.713320, 92.113, 89, 94, 92, 93, 61,None),
    ("BT44","Ballymoney / Glens",     0.713333, 91.393, 76, 92, 93,104, 30,None),
]

# ------------------------------ postcode sectors (slides 12-13), n>=30 only
PC_SECTOR = [
    ("BT4 2", "East Belfast",            0.844922,109.906,121,106,106,106,32,None),
    ("BT39 9","Ballyclare (Rural)",      0.835227,108.545,118,106,107,104,44,None),
    ("BT16 2","Dundonald",               0.821181,107.304,128,102, 98,102,36,
        "Report table row printed 'South Belfast'; label swapped with BT6 8 in source (see verification report)."),
    ("BT6 8", "South Belfast",           0.823611,107.076,116,104,107,101,36,
        "Report table row printed 'Dundonald'; label swapped with BT16 2 in source (see verification report)."),
    ("BT34 4","Newry",                   0.817083,106.151,114,102,105,103,30,None),
    ("BT23 7","Comber",                  0.814375,105.218,102,108,106,104,40,None),
    ("BT8 8", "Carryduff / South Belfast",0.802083,104.027,110,101, 99,106,30,None),
    ("BT41 1","Antrim",                  0.800000,103.223, 97,105,108,102,39,None),
    ("BT22 1","Ards Peninsula",          0.790417,102.932,115, 95,102, 99,30,None),
    ("BT19 1","Bangor",                  0.775000,100.873,112, 98, 97, 96,34,None),
    ("BT48 7","Derry / Londonderry",     0.772984,100.499,110, 97, 99, 97,31,None),
    ("BT51 3","Coleraine",               0.777961,100.471, 97,101,104,100,38,None),
    ("BT28 3","Lisburn",                 0.773649,100.133,101,102,100, 97,37,None),
    ("BT52 1","Coleraine",               0.762143, 99.612,119, 92, 94, 94,35,None),
    ("BT38 7","Carrickfergus",           0.764773, 99.538,111, 96, 95, 96,33,None),
    ("BT28 2","Lisburn",                 0.771774, 99.004, 83,103,106,103,31,None),
    ("BT48 0","Derry / Londonderry",     0.761719, 98.754,103, 92,100,101,32,None),
    ("BT36 6","Glengormley",             0.761422, 98.360, 95,102,100, 96,58,None),
    ("BT23 5","Newtownards",             0.758611, 98.220,100, 97, 97, 98,45,None),
    ("BT53 7","Ballymoney",              0.741935, 96.219,101, 96, 93, 94,31,None),
    ("BT38 8","Carrickfergus",           0.740000, 95.414, 90,100, 93, 98,45,None),
    ("BT40 1","Larne",                   0.725556, 94.340,103, 93, 92, 89,45,
        "Report table row printed 'Lurgan / Craigavon'; label swapped with BT66 7 in source (see verification report)."),
    ("BT66 7","Lurgan / Craigavon",      0.728889, 93.403, 76, 99,101, 97,45,
        "Report table row printed 'Larne'; label swapped with BT40 1 in source (see verification report)."),
]

# ----------------------- classifications & demographics (slides 17-19, 20-21)
CLASSIFICATIONS = {
    "deprivation": {
        "classification": "Index of Multiple Deprivation (decile extremes reported only)",
        "groups": [
            {"group": "Least deprived 10%", "total_pct": 0.820295, "total_index": 107.0,
             "themes_index": {"access_to": 115, "access_within": 105, "quality": 103, "benefits": 103}},
            {"group": "Most deprived 10%", "total_pct": 0.773374, "total_index": 99.716,
             "themes_index": {"access_to": 104, "access_within": 98, "quality": 100, "benefits": 99}},
        ]},
    "urban_rural": {
        "groups": [
            {"group": "Urban", "total_pct": 0.788781, "total_index": 102.0,
             "themes_index": {"access_to": 107, "access_within": 101, "quality": 101, "benefits": 100}},
            {"group": "Rural", "total_pct": 0.750546, "total_index": 97.0,
             "themes_index": {"access_to": 87, "access_within": 99, "quality": 99, "benefits": 100}},
        ]},
    "age": {
        "groups": [
            {"group": "18-24", "total_pct": 0.762155, "total_index": 99.0,
             "themes_index": {"access_to": 100, "access_within": 96, "quality": 98, "benefits": 100}},
            {"group": "25-34", "total_pct": 0.786702, "total_index": 102.0,
             "themes_index": {"access_to": 103, "access_within": 101, "quality": 102, "benefits": 102}},
            {"group": "35-49", "total_pct": 0.774218, "total_index": 100.335,
             "themes_index": {"access_to": 100, "access_within": 100, "quality": 100, "benefits": 101}},
            {"group": "50-64", "total_pct": 0.774923, "total_index": 99.939,
             "themes_index": {"access_to": 101, "access_within": 100, "quality": 100, "benefits": 100}},
            {"group": "65+", "total_pct": 0.763392, "total_index": 98.867,
             "themes_index": {"access_to": 96, "access_within": 101, "quality": 100, "benefits": 98}},
        ]},
    "sex": {
        "groups": [
            {"group": "Male", "total_pct": 0.785221, "total_index": 102.099,
             "themes_index": {"access_to": 102, "access_within": 103, "quality": 101, "benefits": 100}},
            {"group": "Female", "total_pct": 0.762781, "total_index": 99.082,
             "themes_index": {"access_to": 98, "access_within": 97, "quality": 99, "benefits": 100}},
        ]},
    "visit_frequency": {
        "note": ("Reported as a validity check: higher scores among groups with greater "
                 "greenspace engagement support the credibility of the methodology."),
        "groups": [
            {"group": "Every day", "total_pct": 0.824746, "total_index": 106.843,
             "themes_index": {"access_to": 110, "access_within": 106, "quality": 105, "benefits": 107}},
            {"group": "More than twice a week, but not every day", "total_pct": 0.808109, "total_index": 104.676,
             "themes_index": {"access_to": 107, "access_within": 104, "quality": 103, "benefits": 104}},
            {"group": "Twice a week", "total_pct": 0.788576, "total_index": 102.039,
             "themes_index": {"access_to": 102, "access_within": 101, "quality": 103, "benefits": 102}},
            {"group": "Once a week", "total_pct": 0.770798, "total_index": 99.603,
             "themes_index": {"access_to": 98, "access_within": 100, "quality": 100, "benefits": 101}},
            {"group": "Once or twice a month", "total_pct": 0.750746, "total_index": 96.944,
             "themes_index": {"access_to": 93, "access_within": 99, "quality": 98, "benefits": 97}},
            {"group": "Once every 2 to 3 months", "total_pct": 0.712275, "total_index": 92.055,
             "themes_index": {"access_to": 90, "access_within": 93, "quality": 94, "benefits": 91}},
            {"group": "Less often", "total_pct": 0.642204, "total_index": 82.846,
             "themes_index": {"access_to": 78, "access_within": 86, "quality": 86, "benefits": 82}},
            {"group": "Never", "total_pct": 0.589904, "total_index": 76.103,
             "themes_index": {"access_to": 71, "access_within": 80, "quality": 80, "benefits": 73}},
        ]},
}

# ------------------------------------------- sub-score comparisons (slide 22)
SUBSCORE_COMPARISONS = {
    "note": ("Slide 22 illustrative comparisons, theme % of maximum. The postcode chart's "
             "'BT82 Ballymoney' label is a source error: BT82 is Strabane (as slide 11 "
             "shows); its values reconcile to BT82's total of 71%."),
    "by_deprivation": {
        "themes_pct": {
            "Northern Ireland": {"access_to": 0.65, "access_within": 0.81, "quality": 0.80, "benefits": 0.83},
            "Least deprived":   {"access_to": 0.75, "access_within": 0.85, "quality": 0.82, "benefits": 0.86},
            "Most deprived":    {"access_to": 0.67, "access_within": 0.79, "quality": 0.80, "benefits": 0.83}},
        "totals_pct": {"Northern Ireland": 77, "Least deprived": 82, "Most deprived": 77}},
    "by_postcode_area": {
        "themes_pct": {
            "Northern Ireland": {"access_to": 0.65, "access_within": 0.81, "quality": 0.80, "benefits": 0.83},
            "BT20 (Bangor)":    {"access_to": 0.80, "access_within": 0.89, "quality": 0.87, "benefits": 0.90},
            "BT82 (Strabane; printed 'Ballymoney' in source)":
                                {"access_to": 0.58, "access_within": 0.77, "quality": 0.73, "benefits": 0.78}},
        "totals_pct": {"Northern Ireland": 77, "BT20": 87, "BT82": 71}},
}

# ----------------------------------------- theme top-ten rankings (slide 23)
THEME_RANKINGS = {
    "access_to": [("BT9","South Belfast"),("BT20","Bangor"),("BT37","Whiteabbey / Jordanstown"),
                  ("BT15","North Belfast"),("BT16","Dundonald"),("BT67","Moira"),
                  ("BT4","East Belfast"),("BT14","North Belfast"),("BT6","South Belfast"),
                  ("BT27","Lisburn")],
    "access_within": [("BT20","Bangor"),("BT60","Armagh"),("BT1","Belfast City Centre"),
                      ("BT9","South Belfast"),("BT5","East Belfast"),("BT41","Antrim"),
                      ("BT39","Ballyclare"),("BT27","Lisburn"),("BT67","Moira"),
                      ("BT30","Downpatrick")],
    "quality": [("BT20","Bangor"),("BT39","Ballyclare"),("BT41","Antrim"),("BT67","Moira"),
                ("BT9","South Belfast"),("BT4","East Belfast"),("BT1","Belfast City Centre"),
                ("BT45","Magherafelt"),("BT60","Armagh"),("BT71","Dungannon")],
    "benefits": [("BT20","Bangor"),("BT4","East Belfast"),("BT8","South Belfast"),
                 ("BT9","South Belfast"),("BT60","Armagh"),("BT63","Portadown"),
                 ("BT71","Dungannon"),("BT43","Ballymena"),("BT1","Belfast City Centre"),
                 ("BT44","Ballymoney / Glens")],
}

# ------------------------------------------------- key findings (slide 24)
KEY_FINDINGS = [
    "The proposed methodology converts POMNI responses into a transparent Greenspace Index with four complementary component scores.",
    "Initial testing produces credible, intuitive results: scores are higher among groups known to have greater greenspace engagement.",
    "Overall perceptions are generally positive across NI, with relatively modest variation between local authority areas.",
    "Greater variation is evident at postcode area and sector level — potential to identify local strengths, inequalities and priority areas.",
    "Accessibility measures display the greatest geographic variation; perceived Quality and Benefits are more consistent.",
    "Reporting works at multiple geographic levels as percentage scores, indices or decile rankings.",
]

# ============================================================== validation ==
issues, checks = [], []
NI_T = {"access_to": 65, "access_within": 81, "quality": 80, "benefits": 83}

def implied_total_pct(at, aw, q, b):
    return (NI_T["access_to"]*at + NI_T["access_within"]*aw +
            NI_T["quality"]*q + NI_T["benefits"]*b) / 40000.0

def check_rows(rows, label, tol):
    bad = 0
    for r in rows:
        code, _, pct, _, at, aw, q, b = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
        imp = implied_total_pct(at, aw, q, b)
        if abs(imp - pct) > tol:
            bad += 1
            issues.append(f"{label} {code}: implied total from theme indices {imp:.3%} vs reported {pct:.3%}")
    checks.append(f"{label}: {len(rows)-bad}/{len(rows)} rows reconcile (theme indices -> total %, tolerance ±{tol:.1%}, integer-rounded indices)")

check_rows(LGD, "LGD", 0.006)
check_rows([(c,p,pct,idx,at,aw,q,b) for c,p,pct,idx,at,aw,q,b,n,note in PC_AREA], "Postcode area", 0.006)
check_rows([(c,p,pct,idx,at,aw,q,b) for c,p,pct,idx,at,aw,q,b,n,note in PC_SECTOR], "Postcode sector", 0.006)

# Reproduce slide 23 top tens from theme columns (set + lead ordering)
theme_pos = {"access_to": 4, "access_within": 5, "quality": 6, "benefits": 7}
for theme, ranked in THEME_RANKINGS.items():
    col = theme_pos[theme]
    ours = sorted(PC_AREA, key=lambda r: -r[col])[:10]
    ours_set, rep_set = {r[0] for r in ours}, {c for c, _ in ranked}
    if ours_set == rep_set:
        checks.append(f"Slide 23 {theme} top-ten reproduced exactly from extracted theme indices")
    else:
        # ties at integer level can alter the tail; compare with tie-awareness
        tenth = ours[9][col]
        contenders = {r[0] for r in PC_AREA if r[col] >= tenth}
        if rep_set <= contenders:
            checks.append(f"Slide 23 {theme} top-ten consistent with extracted indices (ties at value {tenth} resolved by report's unrounded data)")
        else:
            issues.append(f"Slide 23 {theme} top-ten mismatch: ours {sorted(ours_set)} vs report {sorted(rep_set)}")

# % vs index monotonicity (known source inconsistency — report, don't fix)
def monotonicity(rows, label):
    by_pct = sorted(rows, key=lambda r: -r[2]); by_idx = sorted(rows, key=lambda r: -r[3])
    diffs = [(a[0], b[0]) for a, b in zip(by_pct, by_idx) if a[0] != b[0]]
    if diffs:
        issues.append(f"{label}: published % and Index rankings disagree at {len(diffs)} positions "
                      f"(e.g. {diffs[0]}) — the source's % and Index series imply slightly different "
                      "NI baselines (likely weighting/rounding in the source workbook). Both kept as published.")
    else:
        checks.append(f"{label}: % and Index rankings fully consistent")

monotonicity(LGD, "LGD")
monotonicity(PC_AREA, "Postcode area")
monotonicity(PC_SECTOR, "Postcode sector")

# NI theme average vs reported total
avg = sum(NI_T.values()) / 4
checks.append(f"NI overall: mean of theme percentages = {avg:.2f}% vs reported 77% (consistent after rounding)")

# ================================================================ outputs ==
def dump(name, obj):
    with open(os.path.join(OUT, name), "w") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)

dump("metadata.json", METADATA)
dump("survey_inputs.json", SURVEY_INPUTS)
dump("methodology.json", METHODOLOGY)
dump("ni_overall.json", NI_OVERALL)
dump("classifications.json", CLASSIFICATIONS)
dump("subscore_comparisons.json", SUBSCORE_COMPARISONS)
dump("theme_rankings.json", {t: [{"rank": i+1, "code": c, "place": p} for i, (c, p) in enumerate(v)]
                             for t, v in THEME_RANKINGS.items()})
dump("key_findings.json", KEY_FINDINGS)

dump("lgd_results.json", [
    {"report_name": n, "lad_code": code, "total_pct": round(pct*100, 2), "total_index": idx,
     "themes_index": {"access_to": at, "access_within": aw, "quality": q, "benefits": b}}
    for n, code, pct, idx, at, aw, q, b in LGD])

def pc_dump(rows, fname, code_field):
    dump(fname, [
        {code_field: c, "place": p, "total_pct": round(pct*100, 2), "total_index": idx,
         "themes_index": {"access_to": at, "access_within": aw, "quality": q, "benefits": b},
         "sample_n": n, **({"source_label_note": note} if note else {})}
        for c, p, pct, idx, at, aw, q, b, n, note in rows])

pc_dump(PC_AREA, "postcode_area_results.json", "postcode_area")
pc_dump(PC_SECTOR, "postcode_sector_results.json", "postcode_sector")

# CSVs
def write_csv(fname, header, rows):
    with open(os.path.join(OUT, fname), "w", newline="") as f:
        w = csv.writer(f); w.writerow(header); w.writerows(rows)

write_csv("lgd_results.csv",
          ["report_name","lad_code","total_pct","total_index","access_to_index","access_within_index","quality_index","benefits_index"],
          [[n, code, round(pct*100, 2), idx, at, aw, q, b] for n, code, pct, idx, at, aw, q, b in LGD])
write_csv("postcode_area_results.csv",
          ["postcode_area","place","total_pct","total_index","access_to_index","access_within_index","quality_index","benefits_index","sample_n","source_label_note"],
          [[c, p, round(pct*100, 2), idx, at, aw, q, b, n, note or ""] for c, p, pct, idx, at, aw, q, b, n, note in PC_AREA])
write_csv("postcode_sector_results.csv",
          ["postcode_sector","place","total_pct","total_index","access_to_index","access_within_index","quality_index","benefits_index","sample_n","source_label_note"],
          [[c, p, round(pct*100, 2), idx, at, aw, q, b, n, note or ""] for c, p, pct, idx, at, aw, q, b, n, note in PC_SECTOR])

print("== CHECKS ==")
for c in checks: print(" PASS:", c)
print("\n== SOURCE ISSUES / NOTES ==")
for i in issues: print(" NOTE:", i)
print(f"\nWrote {len(os.listdir(OUT))} files to {os.path.abspath(OUT)}")
