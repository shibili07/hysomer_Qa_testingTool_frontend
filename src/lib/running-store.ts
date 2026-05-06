// Running store – manages supermarket connection state and per-minute invoice injection.
// All state is kept client-side (in-memory + localStorage) because this is a testing tool
// that simulates real supermarket data flow against the Hysomer ingestion server.

import { Supermarket } from "./supermarkets";
import { buildInvoicePayload, postInvoice, InvoicePayload, PostResult } from "./invoice-generator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionStatus = "disconnected" | "connected" | "stopped";

export interface InvoiceLogEntry {
  id: string;
  timestamp: string;
  invoiceId: string;
  totalAmount: number;
  customerName: string;
  paymentMethod: string;
  itemCount: number;
  status: "success" | "failed" | "pending";
  error?: string;
  payload: InvoicePayload;
}

export interface SupermarketConnection {
  supermarketId: string;
  status: ConnectionStatus;
  invoicesSent: number;
  invoicesFailed: number;
  logs: InvoiceLogEntry[];
  connectedAt: string | null;
  lastInvoiceAt: string | null;
}

// ─── In-memory state ──────────────────────────────────────────────────────────

const connections = new Map<string, SupermarketConnection>();
const intervals = new Map<string, ReturnType<typeof setInterval>>();
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreate(sm: Supermarket): SupermarketConnection {
  const id = sm.id || sm._id || "";
  if (!connections.has(id)) {
    // Attempt to restore from localStorage
    const saved = localStorage.getItem(`running_${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SupermarketConnection;
        // Always start disconnected on page load – intervals are lost
        parsed.status = "disconnected";
        connections.set(id, parsed);
      } catch {
        connections.set(id, createFresh(id));
      }
    } else {
      connections.set(id, createFresh(id));
    }
  }
  return connections.get(id)!;
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

function persist(conn: SupermarketConnection) {
  try {
    // Only persist the last 200 logs to avoid bloating localStorage
    const toSave = { ...conn, logs: conn.logs.slice(-200) };
    localStorage.setItem(`running_${conn.supermarketId}`, JSON.stringify(toSave));
  } catch {
    // localStorage full – silently ignore
  }
}

// ─── Core injection logic ─────────────────────────────────────────────────────

async function injectOneInvoice(sm: Supermarket, conn: SupermarketConnection) {
  const payload = buildInvoicePayload(
    sm.organization_id,
    "qatest@hysomer.com",
    conn.invoicesSent
  );

  const logEntry: InvoiceLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    invoiceId: payload.externalInvoiceId,
    totalAmount: payload.totalAmount,
    customerName: payload.customer.name,
    paymentMethod: payload.paymentMethod,
    itemCount: payload.items.length,
    status: "pending",
    payload,
  };

  // Add pending log
  conn.logs.unshift(logEntry);
  notify();

  // Post to ingestion server
  const result: PostResult = await postInvoice(payload, sm.api_key, sm.organization_id);

  // Update log entry
  logEntry.status = result.ok ? "success" : "failed";
  logEntry.error = result.error;
  if (result.ok) {
    conn.invoicesSent += 1;
  } else {
    conn.invoicesFailed += 1;
  }
  conn.lastInvoiceAt = new Date().toISOString();
  persist(conn);
  notify();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getConnection(sm: Supermarket): SupermarketConnection {
  return getOrCreate(sm);
}

export function getAllConnections(): Map<string, SupermarketConnection> {
  return connections;
}

export function connect(sm: Supermarket) {
  const id = sm.id || sm._id || "";
  const conn = getOrCreate(sm);

  if (conn.status === "connected") return;

  conn.status = "connected";
  conn.connectedAt = conn.connectedAt || new Date().toISOString();
  persist(conn);
  notify();

  // Inject immediately, then every 60 seconds
  injectOneInvoice(sm, conn);
  const iv = setInterval(() => {
    if (conn.status === "connected") {
      injectOneInvoice(sm, conn);
    }
  }, 60_000);
  intervals.set(id, iv);
}

export function disconnect(sm: Supermarket) {
  const id = sm.id || sm._id || "";
  const conn = getOrCreate(sm);
  conn.status = "disconnected";
  conn.connectedAt = null;
  const iv = intervals.get(id);
  if (iv) {
    clearInterval(iv);
    intervals.delete(id);
  }
  persist(conn);
  notify();
}

export function stop(sm: Supermarket) {
  const id = sm.id || sm._id || "";
  const conn = getOrCreate(sm);
  conn.status = "stopped";
  const iv = intervals.get(id);
  if (iv) {
    clearInterval(iv);
    intervals.delete(id);
  }
  persist(conn);
  notify();
}

export function resume(sm: Supermarket) {
  const conn = getOrCreate(sm);
  if (conn.status !== "stopped") return;
  connect(sm);
}

export function deleteConnection(sm: Supermarket) {
  const id = sm.id || sm._id || "";
  disconnect(sm);
  connections.delete(id);
  localStorage.removeItem(`running_${id}`);
  notify();
}

export function clearLogs(sm: Supermarket) {
  const conn = getOrCreate(sm);
  conn.logs = [];
  conn.invoicesSent = 0;
  conn.invoicesFailed = 0;
  persist(conn);
  notify();
}
