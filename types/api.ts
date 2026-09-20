export type Forum = "disciplinary_panel" | "fraud_investigation" | "criminal";

export type CustodyAction =
  | "collected"
  | "sealed"
  | "transferred"
  | "accessed"
  | "analysed"
  | "returned"
  | "exported"
  | "correction";

export type FileIntegrity = "intact" | "altered" | "awaiting_file" | "missing";
export type ChainIntegrity = "intact" | "broken";
export type ChainBreakReason =
  | "link_mismatch"
  | "content_modified"
  | "fingerprint_contradicted"
  | "item_deleted"
  | null;

export interface CaseSummary {
  id: string;
  reference: string;
  title: string;
  forum: Forum;
  opened_at: string;
  chain_head: string | null;
  item_count: number;
  total_bytes: number;
  altered_count: number;
  broken_chain_count: number;
  last_verified_at: string | null;
}

export interface CaseItemRow {
  id: string;
  reference: string;
  description: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string | null;
  root_hash: string;
  chunk_size_bytes: number;
  chunk_count: number;
  collected_at: string;
  sealed_at: string | null;
  chain_head: string | null;
  collection_lat: number | null;
  collection_lng: number | null;
  collector_name: string;
  collector_badge: string;
  event_count: number;
  last_result: FileIntegrity | null;
  last_chain_result: ChainIntegrity | null;
  last_verified_at: string | null;
}

export interface CaseDetail {
  id: string;
  reference: string;
  title: string;
  forum: Forum;
  opened_at: string;
  chain_head: string | null;
  items: CaseItemRow[];
}

export interface Verification {
  id: string;
  item_id: string;
  run_at: string;
  run_by: string | null;
  result: FileIntegrity;
  altered_chunks: number[] | null;
  chain_result: ChainIntegrity;
}

export interface ItemDetail {
  id: string;
  case_id: string;
  reference: string;
  description: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string | null;
  root_hash: string;
  chunk_size_bytes: number;
  chunk_count: number;
  collected_at: string;
  sealed_at: string | null;
  deposited_at: string | null;
  collected_by: string;
  collection_lat: number | null;
  collection_lng: number | null;
  storage_path: string | null;
  chain_head: string | null;
  case_reference: string;
  case_title: string;
  forum: Forum;
  collector_name: string;
  collector_rank: string | null;
  collector_badge: string;
  last_verification: Verification | null;
}

export interface ChainEvent {
  id: string;
  seq: number;
  action: CustodyAction;
  note: string | null;
  actorName: string;
  actorRank: string | null;
  actorBadge: string;
  deviceTime: string;
  serverTime: string;
  fileHash: string | null;
  prevHash: string;
  eventHash: string;
  correctsEvent: string | null;
  correctsSeq: number | null;
  linkBroken: boolean;
}

export interface ChainResponse {
  itemId: string;
  itemReference: string;
  chainIntegrity: ChainIntegrity;
  chainBreakAtSeq: number | null;
  chainBreakReason: ChainBreakReason;
  events: ChainEvent[];
}

export interface ByteRange {
  start: number;
  end: number;
}

export interface VerifyResult {
  itemId: string;
  itemReference: string;
  description: string;
  fileName: string;
  fileIntegrity: FileIntegrity;
  expectedRootHash: string;
  actualRootHash: string | null;
  chunkCount: number;
  chunkSizeBytes: number;
  alteredChunks: number[] | null;
  alteredByteRange: ByteRange | null;
  fileSizeBytes: number;
  fileSizeNow: number | null;
  depositedAt: string | null;
  storagePath: string | null;
  chainIntegrity: ChainIntegrity;
  chainBreakAtSeq: number | null;
  chainBreakReason: ChainBreakReason;
  eventCount: number;
  verifiedAt: string;
}

export interface CaseVerifyResult {
  caseId: string;
  caseReference: string;
  title: string;
  chainIntegrity: ChainIntegrity;
  chainBreakAtSeq: number | null;
  chainBreakReason: ChainBreakReason;
  missingItems: string[];
  recordedItems: number;
  presentItems: number;
  verifiedAt: string;
}
