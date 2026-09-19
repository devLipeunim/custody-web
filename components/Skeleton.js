// Skeletons.
//
// Each one is laid out to the same shape as the content it stands in for, so
// that when the real thing arrives nothing on the page moves. A spinner in
// the middle of an empty panel tells the reader only that they are waiting.
// A skeleton tells them what they are waiting for, and how much of it there
// is, which on a case with eleven items is worth knowing.

export function Line({ width = "100%", height, className = "" }) {
  return <div className={`sk sk-line ${className}`} style={{ width, height }} />;
}

/** Wraps a loading region so a screen reader announces it once. */
export function Loading({ label, children }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sk-label">{label}</span>
      {children}
    </div>
  );
}

export function TableSkeleton({ columns, rows = 4 }) {
  return (
    <div className="panel" style={{ padding: 0 }}>
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            // Each row fades in a beat after the one above it, so the table
            // fills the way a list is read rather than all at once.
            <tr key={r} className="fade-in" style={{ animationDelay: `${r * 55}ms` }}>
              {columns.map((c, i) => (
                <td key={c}>
                  <Line width={i === 0 ? "88px" : i === 1 ? "72%" : "54px"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeadingSkeleton({ subWidth = "440px" }) {
  return (
    <>
      <div className="sk sk-title" />
      <div className="sk sk-sub" style={{ width: subWidth }} />
    </>
  );
}

/** The item detail's fact panel: a two column definition list. */
export function FactsSkeleton({ rows = 6 }) {
  return (
    <div className="panel">
      <dl className="kv">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{ display: "contents" }}>
            <dt><Line width="150px" height={12} /></dt>
            <dd><Line width={`${52 + ((i * 37) % 38)}%`} height={12} /></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The verification result, while it is being computed.
 *
 * This one matters more than the others. Verification rehashes the file from
 * disk, which on a large item takes long enough to notice, and the reader is
 * waiting on an answer that might be bad news. Showing the shape of the
 * answer, including the row of chunks, means the result lands in place
 * instead of shoving the page around at the moment it is being read.
 */
export function VerifyResultSkeleton({ chunkCount = 8 }) {
  return (
    <Loading label="Recomputing the fingerprint and the custody chain">
      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Is the file unchanged?</h3>
        <Line width="330px" height={19} />
        <div className="chunkmap" style={{ marginTop: 14 }}>
          {Array.from({ length: Math.min(chunkCount, 64) }, (_, i) => (
            <div key={i} className="sk sk-chunk" style={{ animationDelay: `${i * 45}ms` }} />
          ))}
        </div>
        <Line width="60%" height={12} />
        <h3>Has the handling record been edited?</h3>
        <Line width="290px" height={19} />
      </div>
    </Loading>
  );
}

export function TimelineSkeleton({ rows = 4 }) {
  return (
    <div className="panel">
      <ul className="timeline">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} style={{ animationDelay: `${i * 70}ms` }}>
            <span className="knot" style={{ borderColor: "var(--line)" }} />
            <Line width="220px" height={14} />
            <Line width="340px" height={11} className="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
