import type { ThemeId } from "../../data";

/**
 * The published scoring method (report pp.4–6), as pure functions so the
 * interactive explainer is unit-testable. Statement→theme assignment and
 * point values follow GREESPACE_METHODOLOGY.md exactly.
 */

export const Q14_SCALE = [
  { label: "Agree strongly", points: 5 },
  { label: "Agree slightly", points: 4 },
  { label: "Neither / Don't know", points: 3 },
  { label: "Disagree slightly", points: 2 },
  { label: "Disagree strongly", points: 1 },
] as const;

export const Q15_SCALE = [
  { label: "5 minute walk or less", points: 5 },
  { label: "6–10 minute walk", points: 4 },
  { label: "11–20 minute walk", points: 3 },
  { label: "21–30 minute walk", points: 2 },
  { label: "More than 30 minutes / Don't know", points: 1 },
] as const;

export const Q14_STATEMENTS: { text: string; theme: ThemeId }[] = [
  { text: "are easy to get to without a car", theme: "access_to" },
  { text: "are safe and welcoming", theme: "access_within" },
  { text: "are inclusive for people of all abilities", theme: "access_within" },
  { text: "are easy to navigate, with clear paths and signage", theme: "quality" },
  { text: "provide the amenities and facilities I need", theme: "quality" },
  { text: "feel well cared for", theme: "quality" },
  { text: "are rich in nature and wildlife", theme: "quality" },
  { text: "benefit my mental health and encourage physical activity", theme: "benefits" },
  { text: "improve my sense of community", theme: "benefits" },
];

export const THEME_MAX: Record<ThemeId, number> = {
  access_to: 10, // Q14 car-free statement + Q15 walk time
  access_within: 10,
  quality: 20,
  benefits: 10,
};

export interface ScoreResult {
  points: Record<ThemeId, number>;
  max: Record<ThemeId, number>;
  themes: Record<ThemeId, number>; // % of maximum, rounded to 1dp
  overall: number; // average of the four theme percentages, rounded to 1dp
}

export function computeScores(q14: number[], q15: number): ScoreResult {
  if (q14.length !== Q14_STATEMENTS.length) {
    throw new Error(`expected ${Q14_STATEMENTS.length} Q14 answers`);
  }
  const points: Record<ThemeId, number> = {
    access_to: q15,
    access_within: 0,
    quality: 0,
    benefits: 0,
  };
  Q14_STATEMENTS.forEach((st, i) => {
    points[st.theme] += q14[i];
  });
  const themes = Object.fromEntries(
    (Object.keys(points) as ThemeId[]).map((t) => [
      t,
      +((points[t] / THEME_MAX[t]) * 100).toFixed(1),
    ]),
  ) as Record<ThemeId, number>;
  const overall = +(
    (themes.access_to + themes.access_within + themes.quality + themes.benefits) / 4
  ).toFixed(1);
  return { points, max: THEME_MAX, themes, overall };
}
