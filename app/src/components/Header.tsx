import { useMemo, useRef, useState } from "react";
import { APP_NAME, APP_SUBTITLE } from "../config/branding";
import {
  LGD_DISPLAY,
  lgd,
  postcodeAreas,
  postcodeSectors,
  fmtPct1,
} from "../data";
import { useAppDispatch, useAppState, type Mode } from "../state/AppState";

const MODES: { id: Mode; label: string; short?: string; signature?: boolean }[] = [
  { id: "overview", label: "OVERVIEW" },
  { id: "explore", label: "EXPLORE" },
  { id: "understand", label: "STANDARDS" },
  { id: "access", label: "ACCESSIBILITY", short: "ACCESS" },
  { id: "insights", label: "INSIGHTS" },
  { id: "pvp", label: "PERCEPTION VS PROVISION", short: "PERCEPTION", signature: true },
  { id: "story", label: "STORY", signature: true },
  { id: "about", label: "ABOUT" },
];

interface SearchHit {
  kind: "Council" | "Postcode area" | "Postcode sector";
  label: string;
  detail: string;
  code?: string;
  pcCode?: string;
}

function useSearchIndex(): SearchHit[] {
  return useMemo(
    () => [
      ...lgd.map((r) => ({
        kind: "Council" as const,
        label: LGD_DISPLAY[r.lad_code],
        detail: fmtPct1(r.total_pct),
        code: r.lad_code,
      })),
      ...postcodeAreas.map((r) => ({
        kind: "Postcode area" as const,
        label: `${r.postcode_area} · ${r.place}`,
        detail: fmtPct1(r.total_pct),
        pcCode: r.postcode_area,
      })),
      ...postcodeSectors.map((r) => ({
        kind: "Postcode sector" as const,
        label: `${r.postcode_sector} · ${r.place}`,
        detail: fmtPct1(r.total_pct),
        pcCode: r.postcode_sector,
      })),
    ],
    [],
  );
}

export function Header() {
  const { mode } = useAppState();
  const dispatch = useAppDispatch();
  const index = useSearchIndex();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return index.filter((h) => h.label.toLowerCase().includes(needle)).slice(0, 9);
  }, [q, index]);

  const choose = (h: SearchHit) => {
    setQ("");
    if (h.code) {
      if (mode !== "explore" && mode !== "pvp") dispatch({ type: "mode", mode: "explore" });
      dispatch({ type: "select", code: h.code });
    } else if (h.pcCode) {
      // Postcode results render as markers at reference points on the Explore map.
      if (mode !== "explore") dispatch({ type: "mode", mode: "explore" });
      dispatch({
        type: "geography",
        geography: h.kind === "Postcode area" ? "districts" : "sectors",
      });
      dispatch({ type: "selectPostcode", code: h.pcCode });
    }
  };

  return (
    <header className="app-header">
      <div className="wordmark">
        <img src={`${import.meta.env.BASE_URL}leaf.svg`} alt="" />
        <div>
          <div className="wordmark-title">
            Greenspace <em>Access</em> NI
          </div>
          <div className="wordmark-sub">{APP_SUBTITLE}</div>
        </div>
      </div>

      <nav className="mode-nav" aria-label="Application modes">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={m.signature ? "signature" : undefined}
            aria-current={mode === m.id}
            aria-label={m.label}
            onClick={() => dispatch({ type: "mode", mode: m.id })}
          >
            {m.short ? (
              <>
                <span className="nav-long">{m.label}</span>
                <span className="nav-short" aria-hidden="true">{m.short}</span>
              </>
            ) : (
              m.label
            )}
          </button>
        ))}
      </nav>

      <div className="header-tools">
        <div className="geo-search">
          <svg className="magnifier" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQ("");
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, hits.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && hits[cursor]) choose(hits[cursor]);
            }}
            placeholder="Find a council or postcode…"
            aria-label="Search councils and postcode geographies"
          />
          {hits.length > 0 && (
            <div className="geo-search-results glass-strong" role="listbox">
              {hits.map((h, i) => (
                <button
                  key={`${h.kind}${h.label}`}
                  onClick={() => choose(h)}
                  role="option"
                  aria-selected={i === cursor}
                  style={i === cursor ? { background: "rgba(67,220,193,0.12)" } : undefined}
                >
                  <span>
                    {h.label}
                    <span className="kind"> · {h.kind}</span>
                  </span>
                  <span className="kind">{h.detail}</span>
                </button>
              ))}
              <p className="legend-note" style={{ padding: "4px 10px" }}>
                Postcode results map as markers at reference points — no open-licence
                boundaries exist.
              </p>
            </div>
          )}
        </div>
        <button
          className="icon-btn"
          title="About, data & methodology"
          aria-label="About, data and methodology"
          onClick={() => dispatch({ type: "mode", mode: "about" })}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16v-5M12 8h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </button>
        <button
          className="icon-btn"
          title={`Take a quick tour of ${APP_NAME}`}
          aria-label="Take a quick tour"
          onClick={() => dispatch({ type: "tour", step: 0 })}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.3 9a2.8 2.8 0 1 1 3.9 2.6c-.8.35-1.2 1-1.2 1.9v.3M12 17.5h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
