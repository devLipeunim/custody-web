import Link from "next/link";
import { notFound } from "next/navigation";
import { api, formatPlain, formatSize, formatNumber, plainAction } from "@/lib/api";
import VerifyPanel from "@/components/VerifyPanel";

export const dynamic = "force-dynamic";

/** The gap between the device clock and the server clock, stated openly. */
function offlineGap(deviceTime, serverTime) {
  const ms = new Date(serverTime) - new Date(deviceTime);
  if (ms < 60 * 1000) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m later` : `${m}m later`;
}

/**
 * The item's standing, stated up front.
 *
 * The chain is recomputed on every page load, so that half of this is always
 * current. The file's standing is as at the last verification run, because
 * rehashing a 30GB exhibit to paint a banner would make the page unusable.
 * The wording keeps the difference visible rather than implying both were
 * checked just now.
 */
function IntegrityBanner({ item, chain }) {
  const last = item.last_verification;
  const chainBroken = chain.chainIntegrity === "broken";

  if (chainBroken) {
    return (
      <div className="banner altered">
        <span className="headline">The handling record has been edited.</span>
        <span className="detail">
          The chain breaks at entry {chain.chainBreakAtSeq + 1}. Everything above it remains
          verified.
        </span>
      </div>
    );
  }
  if (last?.result === "altered") {
    return (
      <div className="banner altered">
        <span className="headline">This file has been changed since collection.</span>
        <span className="detail">As at {formatPlain(last.run_at)}. Verify again to confirm.</span>
      </div>
    );
  }
  if (last?.result === "missing") {
    return (
      <div className="banner altered">
        <span className="headline">The exhibit is no longer in the evidence store.</span>
        <span className="detail">As at {formatPlain(last.run_at)}.</span>
      </div>
    );
  }
  if (last?.result === "awaiting_file") {
    return (
      <div className="banner warn">
        <span className="headline">Sealed in the field, exhibit not yet deposited.</span>
        <span className="detail">
          The fingerprint is recorded and the handling record is unbroken.
        </span>
      </div>
    );
  }
  if (last?.result === "intact") {
    return (
      <div className="banner intact">
        <span className="headline">Unchanged since collection.</span>
        <span className="detail">
          Checked {formatPlain(last.run_at)}. The handling record is unbroken.
        </span>
      </div>
    );
  }
  return (
    <div className="banner unknown">
      <span className="headline">Not yet verified.</span>
      <span className="detail">
        The handling record is unbroken. Run a verification to check the file itself.
      </span>
    </div>
  );
}

export default async function ItemDetail({ params }) {
  const { id } = await params;
  let item, chain;
  try {
    item = await api(`/api/items/${id}`);
    chain = await api(`/api/items/${id}/chain`);
  } catch (err) {
    if (err.notFound) notFound();
    throw err;
  }

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
          <dt>File</dt>
          <dd>{item.file_name} · {formatSize(item.file_size_bytes)} ({formatNumber(item.file_size_bytes)} bytes)</dd>
          <dt>Fingerprinted as</dt>
          <dd>
            {item.chunk_count} chunk{item.chunk_count === 1 ? "" : "s"} of{" "}
            {formatSize(item.chunk_size_bytes)}, SHA-256, Merkle root
          </dd>
          <dt>Collected by</dt>
          <dd>{item.collector_name}{item.collector_rank ? `, ${item.collector_rank}` : ""} ({item.collector_badge})</dd>
          <dt>Collected at (device clock)</dt>
          <dd>{formatPlain(item.collected_at)}</dd>
          <dt>Sealed at (server clock)</dt>
          <dd>
            {formatPlain(item.sealed_at)}
            {offlineGap(item.collected_at, item.sealed_at) && (
              <> <span className="badge warn">{offlineGap(item.collected_at, item.sealed_at)}</span>{" "}
                <span className="event-meta">
                  collected with no network, confirmed by the server on sync
                </span>
              </>
            )}
          </dd>
          {item.collection_lat != null && (
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
            <strong>This record has been edited.</strong> Each entry is locked to the one before
            it, and that lock fails at entry {chain.chainBreakAtSeq + 1}. Everything above the
            break remains verified. Nothing below it can be relied upon.
          </div>
        )}
        <ul className="timeline">
          {chain.events.map((e) => {
            const gap = offlineGap(e.deviceTime, e.serverTime);
            const isBreak = e.seq === chain.chainBreakAtSeq;
            return (
              <li
                key={e.id}
                className={[e.linkBroken ? "broken" : "", isBreak ? "break-point" : ""].join(" ").trim()}
                // Top to bottom, in the order the chain was written and the
                // order a reader takes it in.
                style={{ animationDelay: `${Math.min(e.seq * 60, 600)}ms` }}
              >
                <span className="knot" />
                <div className="event-head">
                  {plainAction(e.action)}
                  {isBreak && <span className="badge altered" style={{ marginLeft: 8 }}>link broken here</span>}
                </div>
                <div className="event-meta">
                  {formatPlain(e.deviceTime)} · {e.actorName}
                  {e.actorRank ? `, ${e.actorRank}` : ""}
                  {gap && <> · <span title="server clock on sync">confirmed by server {gap}</span></>}
                </div>
                {e.note && <div className="event-note">{e.note}</div>}
                {e.correctsSeq !== null && e.correctsSeq !== undefined && (
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
