"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

const fmt = (n) => Number(n).toLocaleString("en-GB");

/**
 * Verification, and the chunk map.
 *
 * The chunk map is the strongest visual we have. On failure it renders a row
 * of blocks, green for matching and red for altered, so a judge can see which
 * part of a file changed from the back of the room. Saying "bytes 20,971,520
 * to 25,165,823 were altered" is a different kind of claim from "the hash does
 * not match", and the picture is what makes that land.
 */
export default function VerifyPanel({ itemRef, chunkCount, chunkSizeBytes, fileSizeBytes }) {
  const [state, setState] = useState({ status: "idle" });

  async function run() {
    setState({ status: "running" });
    try {
      const res = await fetch(`${API}/api/items/${itemRef}/verify`, { cache: "no-store" });
      setState({ status: "done", data: await res.json() });
    } catch (err) {
      setState({ status: "error", error: err.message });
    }
  }

  const d = state.data;
  const altered = new Set(d?.alteredChunks ?? []);

  return (
    <div className="panel">
      <div className="row">
        <button className="action" onClick={run} disabled={state.status === "running"}>
          {state.status === "running" ? "Recomputing…" : "Verify this item now"}
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

      {state.status === "error" && (
        <p className="result-line altered" style={{ marginTop: 14 }}>{state.error}</p>
      )}

      {d && (
        <div style={{ marginTop: 18 }}>
          {/* The two questions are answered separately, because they fail for
              different reasons and a panel needs to know which one went wrong. */}
          <h3 style={{ marginTop: 0 }}>Is the file unchanged?</h3>
          {d.fileIntegrity === "intact" && (
            <p className="result-line intact">Yes. The file is identical to what was collected.</p>
          )}
          {d.fileIntegrity === "altered" && (
            <>
              <p className="result-line altered">No. The file has been changed since collection.</p>
              {d.alteredByteRange && (
                <p>
                  The change lies between byte{" "}
                  <strong>{fmt(d.alteredByteRange.start)}</strong> and byte{" "}
                  <strong>{fmt(d.alteredByteRange.end)}</strong>
                  {d.alteredChunks.length === 1
                    ? `, in chunk ${d.alteredChunks[0]} of ${d.chunkCount}.`
                    : `, across chunks ${d.alteredChunks.join(", ")} of ${d.chunkCount}.`}
                </p>
              )}
            </>
          )}
          {d.fileIntegrity === "awaiting_file" && (
            <>
              <p className="result-line" style={{ color: "var(--warn)" }}>
                Not yet checked. The exhibit has not reached the evidence store.
              </p>
              <p>
                The fingerprint was taken at the scene and is recorded, and the handling
                record below is unaffected. There is simply nothing in the store yet to
                compare it against. The moment the exhibit is deposited it can be checked
                against the fingerprint taken on the officer&apos;s device.
              </p>
            </>
          )}
          {d.fileIntegrity === "missing" && (
            <p className="result-line altered">
              The file was in the store and is no longer there, so it could not be checked.
            </p>
          )}

          {d.fileIntegrity !== "missing" && d.fileIntegrity !== "awaiting_file" && (
            <>
              <div className="chunkmap">
                {Array.from({ length: d.chunkCount }, (_, i) => (
                  <div
                    key={i}
                    className={`chunk ${altered.has(i) ? "altered" : "ok"}`}
                    title={
                      `Chunk ${i}: bytes ${fmt(i * d.chunkSizeBytes)} to ` +
                      `${fmt(Math.min((i + 1) * d.chunkSizeBytes - 1, fileSizeBytes - 1))}` +
                      (altered.has(i) ? " — ALTERED" : " — matches")
                    }
                  >
                    {i}
                  </div>
                ))}
              </div>
              <p className="chunk-legend">
                {d.chunkCount} chunk{d.chunkCount === 1 ? "" : "s"} of{" "}
                {fmt(d.chunkSizeBytes / 1024 / 1024)}MB.{" "}
                {altered.size === 0
                  ? "Every chunk matches the fingerprint taken at collection."
                  : `${altered.size} chunk${altered.size === 1 ? "" : "s"} no longer match. The rest are untouched.`}
              </p>
            </>
          )}

          <h3>Has the handling record been edited?</h3>
          {d.chainIntegrity === "intact" ? (
            <p className="result-line intact">
              No. All {d.eventCount} entries are locked to the one before them.
            </p>
          ) : (
            <p className="result-line altered">
              Yes. The sequence breaks at entry {d.chainBreakAtSeq + 1}
              {d.chainBreakReason === "content_modified"
                ? ", whose contents no longer match the record made when it was written."
                : ", which does not follow from the entry before it."}
            </p>
          )}

          <div className="spacer" />
          <dl className="kv">
            <dt>Fingerprint at collection</dt>
            <dd className="mono">{d.expectedRootHash}</dd>
            <dt>Fingerprint now</dt>
            <dd className="mono">{d.actualRootHash ?? "file not found"}</dd>
            <dt>Verified at</dt>
            <dd>{new Date(d.verifiedAt).toLocaleString("en-GB")}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
