"use client";

import { useState } from "react";
import { Loading, Line } from "./Skeleton";
import type { CaseVerifyResult } from "@/types/api";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

type State =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; data: CaseVerifyResult }
  | { status: "error"; error: string };

export default function CaseChainCheck({ caseRef }: { caseRef: string }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function run(): Promise<void> {
    setState({ status: "running" });
    try {
      const res = await fetch(`${API}/api/cases/${caseRef}/verify`, { cache: "no-store" });
      setState({ status: "done", data: (await res.json()) as CaseVerifyResult });
    } catch (err) {
      setState({ status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  }

  const running = state.status === "running";

  return (
    <div className="panel">
      <div className="row">
        <button className={`action${running ? " running" : ""}`} onClick={run} disabled={running}>
          {running ? "Checking" : "Check the case record"}
        </button>
        <span className="event-meta">
          Confirms that no evidence item has been removed from this case.
        </span>
      </div>

      {running && (
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

      {state.status === "done" && (
        <div style={{ marginTop: 16 }}>
          {state.data.chainIntegrity === "intact" ? (
            <>
              <p className="result-line intact">The case record is complete.</p>
              <p className="event-meta">
                All {state.data.recordedItems} item
                {state.data.recordedItems === 1 ? "" : "s"} ever added to this case are still
                present, and the sequence of additions is unbroken.
              </p>
            </>
          ) : (
            <>
              <p className="result-line altered">
                {state.data.chainBreakReason === "item_deleted"
                  ? "An evidence item has been removed from this case."
                  : "The case record has been edited."}
              </p>
              {state.data.missingItems.length > 0 && (
                <p className="event-meta">
                  {state.data.recordedItems} items were recorded as added to this case, but only{" "}
                  {state.data.presentItems} remain. Missing:{" "}
                  <strong className="mono">{state.data.missingItems.join(", ")}</strong>. The
                  record of its addition survives, which is how the removal was detected.
                </p>
              )}
              {state.data.chainBreakAtSeq !== null && (
                <p className="event-meta">
                  The sequence fails at position {state.data.chainBreakAtSeq}.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
