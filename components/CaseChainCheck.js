"use client";

import { useState } from "react";
import { Loading, Line } from "./Skeleton";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

/**
 * The case level chain check.
 *
 * This is the one that catches an item being deleted outright. The item's own
 * custody chain disappears with it, so only the case chain can notice that
 * something that was recorded is no longer there.
 */
export default function CaseChainCheck({ caseRef }) {
  const [state, setState] = useState({ status: "idle" });

  async function run() {
    setState({ status: "running" });
    try {
      const res = await fetch(`${API}/api/cases/${caseRef}/verify`, { cache: "no-store" });
      setState({ status: "done", data: await res.json() });
    } catch (err) {
      setState({ status: "error", error: err.message });
    }
  }

  const d = state.data;

  return (
    <div className="panel">
      <div className="row">
        <button
          className={`action${state.status === "running" ? " running" : ""}`}
          onClick={run}
          disabled={state.status === "running"}
        >
          {state.status === "running" ? "Checking" : "Check the case record"}
        </button>
        <span className="event-meta">
          Confirms that no evidence item has been removed from this case.
        </span>
      </div>

      {state.status === "running" && (
        <div style={{ marginTop: 16 }}>
          <Loading label="Checking the case record">
            <Line width="330px" height={19} />
            <Line width="62%" height={12} />
          </Loading>
        </div>
      )}

      {state.status === "error" && (
        <p className="result-line altered" style={{ marginTop: 14 }}>{state.error}</p>
      )}

      {d && (
        <div style={{ marginTop: 16 }}>
          {d.chainIntegrity === "intact" ? (
            <>
              <p className="result-line intact">The case record is complete.</p>
              <p className="event-meta">
                All {d.recordedItems} item{d.recordedItems === 1 ? "" : "s"} ever added to this
                case are still present, and the sequence of additions is unbroken.
              </p>
            </>
          ) : (
            <>
              <p className="result-line altered">
                {d.reason === "item_deleted" || d.chainBreakReason === "item_deleted"
                  ? "An evidence item has been removed from this case."
                  : "The case record has been edited."}
              </p>
              {d.missingItems?.length > 0 && (
                <p className="event-meta">
                  {d.recordedItems} items were recorded as added to this case, but only{" "}
                  {d.presentItems} remain. Missing:{" "}
                  <strong className="mono">{d.missingItems.join(", ")}</strong>. The record of its
                  addition survives, which is how the removal was noticed.
                </p>
              )}
              {d.chainBreakAtSeq !== null && (
                <p className="event-meta">The sequence fails at position {d.chainBreakAtSeq}.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
