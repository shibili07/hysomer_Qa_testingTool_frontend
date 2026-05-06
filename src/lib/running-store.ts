/**
 * Running / invoice injection — state lives on the backend (DB + scheduler).
 * This module polls the API and notifies subscribers so the UI stays in sync.
 */

import { apiFetch } from "./api-client";
import type { Supermarket } from "./supermarkets";
import type { InvoicePayload } from "./invoice-generator";

export type ConnectionStatus = "disconnected" | "connected" | "stopped";

export interface RunningJobOverview {
  supermarketId: string;
  supermarketName: string;
  organizationId: string;
  status: ConnectionStatus;
  invoicesSent: number;
  invoicesFailed: number;
  connectedAt: string | null;
  lastInvoiceAt: string | null;
  intervalMs: number;
}

export interface InvoiceLogEntry {
  id: string;
  timestamp: string;
  invoiceId: string;
  totalAmount: number;
  customerName: string;
  paymentMethod: string;
  itemCount: number;
  /** Mirrors DB `success`; redundant with `status` for filters */
  success?: boolean;
  status: "success" | "failed" | "pending";
  error?: string;
  httpStatus?: number;
  payload: InvoicePayload;
}

export type InjectionLogFilter = "all" | "success" | "failed";

export interface SupermarketConnection {
  supermarketId: string;
  status: ConnectionStatus;
  invoicesSent: number;
  invoicesFailed: number;
  logs: InvoiceLogEntry[];
  connectedAt: string | null;
  lastInvoiceAt: string | null;
}

let overviewRows: RunningJobOverview[] = [];
let listeners: Array<() => void> = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollConsumers = 0;

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export async function refreshOverview(): Promise<void> {
  const res = await apiFetch("/api/running/overview");
  if (!res.ok) {
    return;
  }
  const data = (await res.json()) as { jobs?: RunningJobOverview[] };
  overviewRows = data.jobs ?? [];
  notify();
}

/** Call when Running pages mount — starts a light poll for all subscribers. */
export function startOverviewPolling(intervalMs = 3000): () => void {
  pollConsumers += 1;
  if (!pollTimer) {
    void refreshOverview();
    pollTimer = setInterval(() => {
      void refreshOverview();
    }, intervalMs);
  }
  return () => {
    pollConsumers = Math.max(0, pollConsumers - 1);
    if (pollConsumers === 0 && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

function smKey(sm: Supermarket): string {
  return String(sm.id || sm._id || "");
}

function createFresh(id: string): SupermarketConnection {
  return {
    supermarketId: id,
    status: "disconnected",
    invoicesSent: 0,
    invoicesFailed: 0,
    logs: [],
    connectedAt: null,
    lastInvoiceAt: null,
  };
}

export function getConnection(sm: Supermarket): SupermarketConnection {
  const id = smKey(sm);
  const row = overviewRows.find((j) => j.supermarketId === id);
  if (!row) {
    return createFresh(id);
  }
  return {
    supermarketId: id,
    status: row.status,
    invoicesSent: row.invoicesSent,
    invoicesFailed: row.invoicesFailed,
    logs: [],
    connectedAt: row.connectedAt,
    lastInvoiceAt: row.lastInvoiceAt,
  };
}

export function getAllConnections(): Map<string, SupermarketConnection> {
  const m = new Map<string, SupermarketConnection>();
  for (const row of overviewRows) {
    m.set(row.supermarketId, {
      supermarketId: row.supermarketId,
      status: row.status,
      invoicesSent: row.invoicesSent,
      invoicesFailed: row.invoicesFailed,
      logs: [],
      connectedAt: row.connectedAt,
      lastInvoiceAt: row.lastInvoiceAt,
    });
  }
  return m;
}

export const JOB_LOG_PAGE_SIZE = 15;

export interface JobLogsPage {
  logs: InvoiceLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchJobLogsPage(
  supermarketId: string,
  page: number,
  status: InjectionLogFilter = "all",
  limit = JOB_LOG_PAGE_SIZE
): Promise<JobLogsPage | null> {
  const q = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });
  if (status === "success") {
    q.set("status", "success");
  } else if (status === "failed") {
    q.set("status", "failed");
  }
  const res = await apiFetch(`/api/running/jobs/${supermarketId}/logs?${q.toString()}`);
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as {
    logs?: InvoiceLogEntry[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  return {
    logs: data.logs ?? [],
    total: data.total ?? 0,
    page: data.page ?? page,
    limit: data.limit ?? limit,
    totalPages: data.totalPages ?? 0,
  };
}

export type DailyInjectionOutcomeFilter = "all" | "success" | "failed";

export interface DailyInjectionReportRow {
  date: string;
  supermarketId: string;
  supermarketName: string;
  injectCount: number;
  successCount: number;
  failedCount: number;
}

export async function fetchDailyInjectionReport(params: {
  page?: number;
  limit?: number;
  supermarketId?: string;
  from?: string;
  to?: string;
  outcome?: DailyInjectionOutcomeFilter;
}): Promise<{
  rows: DailyInjectionReportRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} | null> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.supermarketId) q.set("supermarketId", params.supermarketId);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.outcome && params.outcome !== "all") q.set("outcome", params.outcome);

  const res = await apiFetch(`/api/running/reports/daily-injections?${q.toString()}`);
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as {
    rows?: DailyInjectionReportRow[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  return {
    rows: data.rows ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? 20,
    totalPages: data.totalPages ?? 0,
  };
}

export async function connect(sm: Supermarket): Promise<void> {
  const id = smKey(sm);
  const res = await apiFetch(`/api/running/jobs/${id}/start`, { method: "POST" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  await refreshOverview();
}

export async function disconnect(sm: Supermarket): Promise<void> {
  const id = smKey(sm);
  const res = await apiFetch(`/api/running/jobs/${id}/stop`, { method: "POST" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  await refreshOverview();
}

export async function stop(sm: Supermarket): Promise<void> {
  const id = smKey(sm);
  const res = await apiFetch(`/api/running/jobs/${id}/pause`, { method: "POST" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  await refreshOverview();
}

export async function resume(sm: Supermarket): Promise<void> {
  const id = smKey(sm);
  const res = await apiFetch(`/api/running/jobs/${id}/resume`, { method: "POST" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  await refreshOverview();
}

export async function deleteConnection(sm: Supermarket): Promise<void> {
  const id = smKey(sm);
  const res = await apiFetch(`/api/running/jobs/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  await refreshOverview();
}

export async function clearLogs(sm: Supermarket): Promise<void> {
  const id = smKey(sm);
  const res = await apiFetch(`/api/running/jobs/${id}/logs`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}
