import type { Forum, CustodyAction } from "@/types/api";

export const API_BASE = process.env.API_BASE ?? "http://localhost:4000";

export class NotFoundError extends Error {
  readonly notFound = true;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...options });
  if (res.status === 404) throw new NotFoundError(`${path} not found`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${path} returned ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export const FORUM_LABELS: Record<Forum, string> = {
  disciplinary_panel: "Disciplinary panel",
  fraud_investigation: "Fraud investigation",
  criminal: "Criminal",
};

const AUDIO_EXTENSIONS = ["m4a", "mp3", "wav", "aac", "ogg", "flac", "wma", "opus", "amr", "caf"];

/** An exhibit recorded at the scene rather than picked from the device. */
export function isAudio(mimeType: string | null, fileName: string | null): boolean {
  if (mimeType?.startsWith("audio/")) return true;
  const ext = fileName?.split(".").pop()?.toLowerCase();
  return ext ? AUDIO_EXTENSIONS.includes(ext) : false;
}

const ACTION_LABELS: Record<CustodyAction, string> = {
  collected: "collected from the source device",
  sealed: "fingerprint confirmed by the server",
  transferred: "transferred to the evidence store",
  accessed: "opened for review",
  analysed: "examined",
  returned: "returned to the evidence store",
  exported: "a copy was released",
  correction: "a correction was recorded",
};

export const plainAction = (action: CustodyAction): string => ACTION_LABELS[action] ?? action;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const pad = (n: number): string => String(n).padStart(2, "0");

export function formatPlain(value: string | null | undefined): string {
  if (!value) return "not recorded";
  const d = new Date(value);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatSize(bytes: number | string): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export const formatNumber = (n: number): string => Number(n).toLocaleString("en-GB");

export function offlineGap(deviceTime: string, serverTime: string | null): string | null {
  if (!serverTime) return null;
  const ms = new Date(serverTime).getTime() - new Date(deviceTime).getTime();
  if (ms < 60_000) return null;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.round((ms % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m later` : `${minutes}m later`;
}
