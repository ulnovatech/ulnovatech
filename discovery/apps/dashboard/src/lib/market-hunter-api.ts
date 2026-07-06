import type { ActionCard } from '@agency/market-hunter';

export function serializeScan(row: {
  id: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  stats: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    status: row.status,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    stats: row.stats,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeActionCardRow(row: {
  id: string;
  scanId: string;
  rank: number;
  status: string;
  card: Record<string, unknown>;
  approvedAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    scanId: row.scanId,
    rank: row.rank,
    status: row.status,
    card: row.card as ActionCard,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    dismissedAt: row.dismissedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
