import type { ReactNode } from "react";

interface LineProps {
  width?: string | number;
  height?: number;
  className?: string;
}

export function Line({ width = "100%", height, className = "" }: LineProps) {
  return <div className={`sk sk-line ${className}`} style={{ width, height }} />;
}

export function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sk-label">{label}</span>
      {children}
    </div>
  );
}

export function TableSkeleton({ columns, rows = 4 }: { columns: string[]; rows?: number }) {
  return (
    <div className="panel" style={{ padding: 0 }}>
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
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

export function PageHeadingSkeleton({ subWidth = "440px" }: { subWidth?: string }) {
  return (
    <>
      <div className="sk sk-title" />
      <div className="sk sk-sub" style={{ width: subWidth }} />
    </>
  );
}

export function FactsSkeleton({ rows = 6 }: { rows?: number }) {
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
 * Placeholder for a verification in progress, including the chunk row, so the
 * result lands in place rather than displacing content as it is being read.
 */
export function VerifyResultSkeleton({ chunkCount = 8 }: { chunkCount?: number }) {
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

export function TimelineSkeleton({ rows = 4 }: { rows?: number }) {
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
