// The dashboard talks to the Custody API over the local network.
//
// Everything here is server side and uncached: an integrity dashboard that
// serves a stale "intact" is worse than one that is slow.

export const API_BASE = process.env.API_BASE || "http://localhost:4000";

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...options });
  if (res.status === 404) {
    // Distinguished from a real failure so the page can render Next's own
    // not-found rather than an error stack. A mistyped evidence reference is
    // an ordinary thing to do, not a fault.
    const err = new Error(`${path} not found`);
    err.notFound = true;
    throw err;
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${path} returned ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export const FORUM_LABELS = {
  disciplinary_panel: "Disciplinary panel",
  fraud_investigation: "Fraud investigation",
  criminal: "Criminal",
};

const ACTION_LABELS = {
  collected: "collected from the source device",
  sealed: "fingerprint confirmed by the server",
  transferred: "transferred to the evidence store",
  accessed: "opened for review",
  analysed: "examined",
  returned: "returned to the evidence store",
  exported: "a copy was released",
  correction: "a correction was recorded",
};

export const plainAction = (a) => ACTION_LABELS[a] ?? a;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function formatPlain(value) {
  if (!value) return "not recorded";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatSize(bytes) {
  const n = Number(bytes);
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export const formatNumber = (n) => Number(n).toLocaleString("en-GB");
