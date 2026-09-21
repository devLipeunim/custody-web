import Link from "next/link";
import { notFound } from "next/navigation";
import {
  api, formatPlain, formatSize, formatNumber, plainAction, offlineGap, isAudio, NotFoundError,
} from "@/lib/api";
import VerifyPanel from "@/components/VerifyPanel";
import type { ChainResponse, ItemDetail } from "@/types/api";

export const dynamic = "force-dynamic";

function IntegrityBanner({ item, chain }: { item: ItemDetail; chain: ChainResponse }) {
  if (chain.chainIntegrity === "broken") {
    const entry = (chain.chainBreakAtSeq ?? 0) + 1;
    const contradicted = chain.chainBreakReason === "fingerprint_contradicted";
    return (
      <div className="banner altered">
        <span className="headline">
          {contradicted
            ? "The fingerprint held against this exhibit has been changed."
            : "The handling record has been edited."}
        </span>
        <span className="detail">
          {contradicted
            ? `Entry ${entry} records a different fingerprint from the one now stored against this
               exhibit, which means the stored fingerprint was changed after collection.`
            : `The chain breaks at entry ${entry}. Everything above it remains verified.`}
        </span>
      </div>
    );
  }

  const last = item.last_verification;
  if (!last) {
    return (
      <div className="banner unknown">
        <span className="headline">Not yet verified.</span>
        <span className="detail">
          The handling record is unbroken. Run a verification to check the file itself.
        </span>
      </div>
    );
  }

  switch (last.result) {
    case "altered":
      return (
        <div className="banner altered">
          <span className="headline">This file has been changed since collection.</span>
          <span className="detail">As at {formatPlain(last.run_at)}. Verify again to confirm.</span>
        </div>
      );
    case "missing":
      return (
        <div className="banner altered">
          <span className="headline">The exhibit is no longer in the evidence store.</span>
          <span className="detail">As at {formatPlain(last.run_at)}.</span>
        </div>
      );
    case "awaiting_file":
      return (
        <div className="banner warn">
          <span className="headline">Sealed in the field, exhibit not yet deposited.</span>
          <span className="detail">
            The fingerprint is recorded and the handling record is unbroken.
          </span>
        </div>
      );
    default:
      return (
        <div className="banner intact">
          <span className="headline">Unchanged since collection.</span>
          <span className="detail">
            Checked {formatPlain(last.run_at)}. The handling record is unbroken.
          </span>
        </div>
      );
  }
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let item: ItemDetail;
  let chain: ChainResponse;
  try {
    item = await api<ItemDetail>(`/api/items/${id}`);
    chain = await api<ChainResponse>(`/api/items/${id}/chain`);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const sealGap = offlineGap(item.collected_at, item.sealed_at);

  return (
    <>
      <p className="sub" style={{ marginBottom: 8 }}>
        <Link href={`/cases/${item.case_reference}`}>← {item.case_reference}</Link>
      </p>
      <h2>{item.reference}</h2>
      <p className="sub">{item.description}</p>

      <IntegrityBanner item={item} chain={chain} />

      <div className="panel">
        <dl className="kv">
          <dt>{isAudio(item.mime_type, item.file_name) ? "Recording" : "File"}</dt>
          <dd>
            {item.file_name} · {formatSize(item.file_size_bytes)}
            {item.file_size_bytes >= 1024 && ` (${formatNumber(item.file_size_bytes)} bytes)`}
            {isAudio(item.mime_type, item.file_name) && (
              <div className="event-meta">
                Audio captured at the scene. The recording stays on the collecting device until it
                is deposited, so only its fingerprint is held here.
              </div>
            )}
          </dd>
          <dt>Fingerprinted as</dt>
          <dd>
            {item.chunk_count} chunk{item.chunk_count === 1 ? "" : "s"} of{" "}
            {formatSize(item.chunk_size_bytes)}, SHA-256, Merkle root
          </dd>
          <dt>Collected by</dt>
          <dd>
            {item.collector_name}
            {item.collector_rank ? `, ${item.collector_rank}` : ""} ({item.collector_badge})
          </dd>
          <dt>Collected at (device clock)</dt>
          <dd>{formatPlain(item.collected_at)}</dd>
          <dt>Sealed at (server clock)</dt>
          <dd>
            {formatPlain(item.sealed_at)}
            {sealGap && (
              <>
                {" "}<span className="badge warn">{sealGap}</span>{" "}
                <span className="event-meta">
                  collected with no network, confirmed by the server on sync
                </span>
              </>
            )}
          </dd>
          {item.collection_lat !== null && (
            <>
              <dt>Collection location</dt>
              <dd className="mono">{item.collection_lat}, {item.collection_lng}</dd>
            </>
          )}
        </dl>
      </div>

      <VerifyPanel
        itemRef={item.reference}
        chunkCount={item.chunk_count}
        chunkSizeBytes={item.chunk_size_bytes}
        fileSizeBytes={Number(item.file_size_bytes)}
      />

      <h3>Who has handled it</h3>
      <div className="panel">
        {chain.chainIntegrity === "broken" && (
          <div className="break-notice">
            {chain.chainBreakReason === "fingerprint_contradicted" ? (
              <>
                <strong>The stored fingerprint has been changed.</strong> Entry{" "}
                {(chain.chainBreakAtSeq ?? 0) + 1} records the fingerprint this exhibit carried
                when it was written, and it is not the one now held against the exhibit. The
                entries themselves are unedited.
              </>
            ) : (
              <>
                <strong>This record has been edited.</strong> Each entry is locked to the one
                before it, and that lock fails at entry {(chain.chainBreakAtSeq ?? 0) + 1}.
                Everything above the break remains verified. Nothing below it can be relied upon.
              </>
            )}
          </div>
        )}
        <ul className="timeline">
          {chain.events.map((e) => {
            const gap = offlineGap(e.deviceTime, e.serverTime);
            const isBreak = e.seq === chain.chainBreakAtSeq;
            return (
              <li
                key={e.id}
                className={[e.linkBroken ? "broken" : "", isBreak ? "break-point" : ""]
                  .join(" ").trim()}
                style={{ animationDelay: `${Math.min(e.seq * 60, 600)}ms` }}
              >
                <span className="knot" />
                <div className="event-head">
                  {plainAction(e.action)}
                  {isBreak && (
                    <span className="badge altered" style={{ marginLeft: 8 }}>
                      link broken here
                    </span>
                  )}
                </div>
                <div className="event-meta">
                  {formatPlain(e.deviceTime)} · {e.actorName}
                  {e.actorRank ? `, ${e.actorRank}` : ""}
                  {gap && <> · <span title="server clock on sync">confirmed by server {gap}</span></>}
                </div>
                {e.note && <div className="event-note">{e.note}</div>}
                {e.correctsSeq !== null && (
                  <div className="event-note">
                    <em>
                      Corrects entry {e.correctsSeq + 1}. The original was not removed or edited,
                      because entries can only be added.
                    </em>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
