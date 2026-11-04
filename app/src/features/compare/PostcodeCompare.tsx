import { useMemo, useState } from "react";
import { Chart } from "../../charts/Chart";
import { postcodeOption, postcodeRows, type PostcodeKind } from "../../charts/postcode";
import { integrity, rankings, THEME_LABELS, THEME_ORDER } from "../../data";
import { themeSeries } from "../../config/branding";
import type { FormatId } from "../../data";

export function PostcodeCompare({ kind }: { kind: PostcodeKind }) {
  const [format, setFormat] = useState<FormatId>("index");
  const rows = postcodeRows(kind);
  const option = useMemo(() => postcodeOption(kind, format), [kind, format]);
  const height = rows.length * 16 + 90;
  const label = kind === "areas" ? "postcode areas" : "postcode sectors";

  return (
    <section className="prose-block glass">
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <h3 style={{ marginRight: "auto" }}>
          {rows.length} {label} · reported at n ≥ 30
        </h3>
        <div className="format-toggle" style={{ width: 230 }} role="group" aria-label="Score format">
          <button aria-pressed={format === "pct"} onClick={() => setFormat("pct")}>
            % of maximum
          </button>
          <button aria-pressed={format === "index"} onClick={() => setFormat("index")}>
            Index (NI = 100)
          </button>
        </div>
      </div>
      <p style={{ margin: "4px 0 0" }}>
        No open-licence postcode boundaries exist for Northern Ireland, so these results are
        presented as charts rather than maps. Bars are coloured by the same defined class
        bands as the council map — read them as <b>bands, not a league table</b>:{" "}
        {integrity.moe.toLowerCase()}, so small differences and adjacent positions are not
        meaningful.
      </p>
      <Chart
        option={option}
        className="chart-box"
        style={{ height }}
        ariaLabel={`All ${label} with published scores, coloured by class band; hover for sample sizes`}
      />
      <p className="legend-note">
        Hover any bar for its sample size. Source: interim report, {label} with fewer than 30
        respondents excluded at source.
      </p>
    </section>
  );
}

/** The four top-ten theme rankings exactly as published (report slide 23). */
export function ThemeLeaders() {
  const data = rankings as Record<string, { rank: number; code: string; place: string }[]>;
  return (
    <section className="prose-block glass">
      <h3>Theme leaders — postcode areas, as published</h3>
      <p style={{ margin: "2px 0 10px" }}>
        The interim report's own top-ten postcode areas for each theme, reproduced exactly.
        Rankings reflect the report's unrounded data; ties and margins of error mean nearby
        positions should not be over-interpreted.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {THEME_ORDER.map((t) => (
          <div key={t}>
            <p
              className="section-label"
              style={{ color: themeSeries[t], margin: "0 0 6px" }}
            >
              {THEME_LABELS[t]}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <tbody>
                {data[t].map((r) => (
                  <tr key={r.rank}>
                    <td style={{ color: "var(--gani-ink-3)", padding: "3px 6px 3px 0", width: 18, fontVariantNumeric: "tabular-nums" }}>
                      {r.rank}
                    </td>
                    <td style={{ color: "var(--gani-cream)", fontWeight: 700, padding: "3px 8px 3px 0", width: 42 }}>
                      {r.code}
                    </td>
                    <td style={{ color: "var(--gani-ink-2)", padding: "3px 0" }}>{r.place}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
