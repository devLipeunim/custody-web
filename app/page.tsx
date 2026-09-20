import Link from "next/link";
import { api, FORUM_LABELS, formatSize } from "@/lib/api";
import type { CaseSummary } from "@/types/api";

export const dynamic = "force-dynamic";

function CaseBadge({ c }: { c: CaseSummary }) {
  if (c.altered_count > 0 || c.broken_chain_count > 0) {
    const parts: string[] = [];
    if (c.altered_count > 0) parts.push(`${c.altered_count} altered`);
    if (c.broken_chain_count > 0) parts.push(`${c.broken_chain_count} chain broken`);
    return <span className="badge altered">{parts.join(", ")}</span>;
  }
  if (!c.last_verified_at) return <span className="badge unknown">Not yet verified</span>;
  return <span className="badge intact">All intact</span>;
}

export default async function CaseList() {
  let cases: CaseSummary[] = [];
  let error: string | null = null;

  try {
    cases = await api<CaseSummary[]>("/api/cases");
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  if (error) {
    return (
      <div className="panel">
        <h2>The API is not reachable</h2>
        <p className="sub">Start the backend, then reload this page.</p>
        <pre className="mono">cd hackathonBackend &amp;&amp; npm run dev</pre>
        <p className="mono" style={{ color: "var(--muted)" }}>{error}</p>
      </div>
    );
  }

  const items = cases.reduce((n, c) => n + c.item_count, 0);
  const bytes = cases.reduce((n, c) => n + Number(c.total_bytes), 0);
  const altered = cases.reduce((n, c) => n + c.altered_count, 0);
  const broken = cases.reduce((n, c) => n + c.broken_chain_count, 0);
  const flagged = altered + broken;

  return (
    <>
      <h2>Cases</h2>
      <p className="sub">
        Every item below was fingerprinted on the collecting officer&apos;s device at the moment
        of collection. The status shown is as at the last verification run.
      </p>

      <div className="stats">
        <div className="stat">
          <div className="n">{items}</div>
          <div className="k">
            evidence items across {cases.length} case{cases.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="stat">
          <div className="n">{formatSize(bytes)}</div>
          <div className="k">fingerprinted at collection</div>
        </div>
        <div className="stat">
          <div className={`n ${flagged > 0 ? "bad" : "ok"}`}>{flagged}</div>
          <div className="k">
            {flagged === 0
              ? "items flagged at the last check"
              : [
                  altered > 0 ? `${altered} file${altered === 1 ? "" : "s"} changed` : "",
                  broken > 0 ? `${broken} record${broken === 1 ? "" : "s"} edited` : "",
                ].filter(Boolean).join(", ")}
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Title</th>
              <th>Forum</th>
              <th>Items</th>
              <th>Size</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id}>
                <td className="num"><Link href={`/cases/${c.reference}`}>{c.reference}</Link></td>
                <td>{c.title}</td>
                <td>{FORUM_LABELS[c.forum] ?? c.forum}</td>
                <td className="num">{c.item_count}</td>
                <td className="num">{formatSize(c.total_bytes)}</td>
                <td><CaseBadge c={c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cases.length === 0 && (
        <p className="sub">No cases yet. Run the seeder in the backend.</p>
      )}

      <footer className="provenance">
        All data in this system is synthetic and was generated for demonstration. No real
        persons, cases, accounts or personal data are represented.
      </footer>
    </>
  );
}
