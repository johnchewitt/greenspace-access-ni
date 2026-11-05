import { useAppDispatch, useAppState, type InsightsTab } from "../../state/AppState";
import { integrity } from "../../data";
import type { NIProvision } from "../pvp/provision";
import type { ProvisionState } from "../pvp/PvpMode";
import { CompareOverlay } from "../compare/CompareOverlay";
import { InsightsOverlay } from "./InsightsOverlay";
import { OpportunityExplorer } from "./OpportunityExplorer";

const TABS: { id: InsightsTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "compare", label: "Comparisons" },
  { id: "opportunities", label: "Opportunities" },
];

export function InsightsHub({
  provision,
  niProvision,
}: {
  provision: ProvisionState;
  niProvision: NIProvision | null;
}) {
  const { insightsTab } = useAppState();
  const dispatch = useAppDispatch();
  return (
    <>
      <div className="insights-tabs glass-strong" role="tablist" aria-label="Insights views">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={insightsTab === t.id}
            className={insightsTab === t.id ? "on" : ""}
            onClick={() => dispatch({ type: "insightsTab", tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>
      {insightsTab === "dashboard" && (
        <InsightsOverlay provision={provision} niProvision={niProvision} />
      )}
      {insightsTab === "compare" && <CompareOverlay provision={provision} />}
      {insightsTab === "opportunities" && (
        <div className="overlay-stage" role="region" aria-label="Opportunity screening">
          <div className="overlay-inner">
            <p className="section-label">Insights · opportunity screening</p>
            <h1 className="overlay-hero">Starting points, from the evidence</h1>
            <p className="overlay-lede">
              Published indicators flag places where better provision or access may warrant
              investigation. A flag is a question worth asking — not an approved investment
              priority. {integrity.significance}.
            </p>
            <OpportunityExplorer
              provision={provision}
              niProvision={niProvision}
              active={insightsTab === "opportunities"}
            />
          </div>
        </div>
      )}
    </>
  );
}
