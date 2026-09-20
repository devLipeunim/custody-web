"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VerifyResultSkeleton } from "./Skeleton";
import type { VerifyResult } from "@/types/api";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

const fmt = (n: number): string => Number(n).toLocaleString("en-GB");

type State =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; data: VerifyResult }
  | { status: "error"; error: string };

interface Props {
  itemRef: string;
  chunkCount: number;
  chunkSizeBytes: number;
  fileSizeBytes: number;
}

export default function VerifyPanel({ itemRef, chunkCount, chunkSizeBytes, fileSizeBytes }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });
  const started = useRef(false);
  const router = useRouter();

  async function run(): Promise<void> {
    setState({ status: "running" });
    try {
      const res = await fetch(`${API}/api/items/${itemRef}/verify`, { cache: "no-store" });
      setState({ status: "done", data: (await res.json()) as VerifyResult });
      router.refresh();
    } catch (err) {
      setState({ status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  }

  useEffect(() => {
    if (started.current || typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("verify") !== "1") return;
    started.current = true;
    void run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const running = state.status === "running";
  const altered = new Set(state.status === "done" ? state.data.alteredChunks ?? [] : []);

  return (
    <div className="panel">
      <div className="row">
        <button className={`action${running ? " running" : ""}`} onClick={run} disabled={running}>
          {running ? "Recomputing" : "Verify this item now"}
        </button>
        <a className="button" href={`${API}/api/items/${itemRef}/report`} target="_blank" rel="noreferrer">
          Open the report
        </a>
        <a className="button" href={`${API}/api/items/${itemRef}/report?download=1`}>
          Download PDF
        </a>
      </div>
      <p className="event-meta" style={{ marginTop: 10 }}>
        Verification re-reads the file from storage, rehashes it in{" "}
        {fmt(chunkSizeBytes / 1024 / 1024)}MB chunks and recomputes every link in the custody
        record. Nothing stored is trusted.
      </p>

      {running && <VerifyResultSkeleton chunkCount={chunkCount} />}

      {state.status === "error" && (
        <p className="result-line altered" style={{ marginTop: 14 }}>{state.error}</p>
      )}

      {state.status === "done" && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }} className="fade-up">Is the file unchanged?</h3>

          {state.data.fileIntegrity === "intact" && (
            <p className="result-line intact">Yes. The file is identical to what was collected.</p>
          )}

          {state.data.fileIntegrity === "altered" && (
            <>
              <p className="result-line altered">No. The file has been changed since collection.</p>
              {state.data.alteredByteRange && state.data.alteredChunks && (
                <p>
                  The change lies between byte{" "}
                  <strong>{fmt(state.data.alteredByteRange.start)}</strong> and byte{" "}
                  <strong>{fmt(state.data.alteredByteRange.end)}</strong>
                  {state.data.alteredChunks.length === 1
                    ? `, in chunk ${(state.data.alteredChunks[0] ?? 0) + 1} of ${state.data.chunkCount}.`
                    : `, across chunks ${state.data.alteredChunks.map((c) => c + 1).join(", ")} of ${state.data.chunkCount}.`}
                </p>
              )}
            </>
          )}

          {state.data.fileIntegrity === "awaiting_file" && (
            <>
              <p className="result-line" style={{ color: "var(--warn)" }}>
                Not yet checked. The exhibit has not reached the evidence store.
              </p>
              <p>
                The fingerprint was taken at the scene and is recorded, and the handling record
                below is unaffected. There is nothing in the store yet to compare it against.
              </p>
            </>
          )}

          {state.data.fileIntegrity === "missing" && (
            <p className="result-line altered">
              The file was in the store and is no longer there, so it could not be checked.
            </p>
          )}

          {(state.data.fileIntegrity === "intact" || state.data.fileIntegrity === "altered") && (
            <>
              <div className="chunkmap">
                {Array.from({ length: state.data.chunkCount }, (_, i) => (
                  <div
                    key={i}
                    className={`chunk ${altered.has(i) ? "altered" : "ok"}`}
                    style={{ animationDelay: `${Math.min(i * 38, 900)}ms` }}
                    title={
                      `Chunk ${i + 1}: bytes ${fmt(i * state.data.chunkSizeBytes)} to ` +
                      `${fmt(Math.min((i + 1) * state.data.chunkSizeBytes - 1, fileSizeBytes - 1))}` +
                      (altered.has(i) ? " (altered)" : " (matches)")
                    }
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="chunk-legend">
                {state.data.chunkCount} chunk{state.data.chunkCount === 1 ? "" : "s"} of{" "}
                {fmt(state.data.chunkSizeBytes / 1024 / 1024)}MB.{" "}
                {altered.size === 0
                  ? "Every chunk matches the fingerprint taken at collection."
                  : altered.size === 1
                    ? `1 chunk no longer matches. The other ${state.data.chunkCount - 1} ${
                        state.data.chunkCount - 1 === 1 ? "is" : "are"} untouched.`
                    : `${altered.size} chunks no longer match. The rest are untouched.`}
              </p>
            </>
          )}

          <h3 className="fade-up" style={{ animationDelay: "120ms" }}>
            Has the handling record been edited?
          </h3>
          {state.data.chainIntegrity === "intact" ? (
            <p className="result-line intact">
              No. All {state.data.eventCount} entries are locked to the one before them.
            </p>
          ) : (
            <p className="result-line altered">
              Yes. The sequence breaks at entry {(state.data.chainBreakAtSeq ?? 0) + 1}
              {state.data.chainBreakReason === "content_modified"
                ? ", whose contents no longer match the record made when it was written."
                : state.data.chainBreakReason === "fingerprint_contradicted"
                ? ", which records a different fingerprint for this exhibit than the one now held against it."
                : ", which does not follow from the entry before it."}
            </p>
          )}

          <div className="spacer" />
          <dl className="kv fade-in" style={{ animationDelay: "220ms" }}>
            <dt>Fingerprint at collection</dt>
            <dd className="mono">{state.data.expectedRootHash}</dd>
            <dt>Fingerprint now</dt>
            <dd className="mono">{state.data.actualRootHash ?? "file not found"}</dd>
            <dt>Verified at</dt>
            <dd>{new Date(state.data.verifiedAt).toLocaleString("en-GB")}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
