import Link from "next/link";
import { notFound } from "next/navigation";
import { api, FORUM_LABELS, formatPlain, formatSize, NotFoundError } from "@/lib/api";
import CaseChainCheck from "@/components/CaseChainCheck";
import type { CaseDetail, CaseItemRow } from "@/types/api";

export const dynamic = "force-dynamic";

function ItemBadge({ item }: { item: CaseItemRow }) {
  if (!item.last_result) return <span className="badge unknown">Not yet verified</span>;
  if (item.last_result === "altered") return <span className="badge altered">Altered</span>;
  if (item.last_result === "awaiting_file") return <span className="badge warn">Awaiting exhibit</span>;
  if (item.last_result === "missing") return <span className="badge altered">File missing</span>;
  if (item.last_chain_result === "broken") return <span className="badge altered">Chain broken</span>;
  return <span className="badge intact">Intact</span>;
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let kase: CaseDetail;
  try {
    kase = await api<CaseDetail>(`/api/cases/${id}`);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <>
      <p className="sub" style={{ marginBottom: 8 }}><Link href="/">← All cases</Link></p>
      <h2>{kase.reference}</h2>
      <p className="sub">
        {kase.title} · {FORUM_LABELS[kase.forum] ?? kase.forum} · opened {formatPlain(kase.opened_at)}
      </p>

      <CaseChainCheck caseRef={kase.reference} />

      <h3>Evidence items</h3>
      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Description</th>
              <th>Size</th>
              <th>Collected</th>
              <th>Events</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {kase.items.map((i) => (
              <tr key={i.id}>
                <td className="num"><Link href={`/items/${i.reference}`}>{i.reference}</Link></td>
                <td>
                  {i.description}
                  <div className="event-meta">{i.file_name} · {i.collector_name}</div>
                </td>
                <td className="num">
                  {formatSize(i.file_size_bytes)}
                  <div className="event-meta">
                    {i.chunk_count} chunk{i.chunk_count === 1 ? "" : "s"}
                  </div>
                </td>
                <td className="num">{formatPlain(i.collected_at)}</td>
                <td className="num">{i.event_count}</td>
                <td><ItemBadge item={i} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
