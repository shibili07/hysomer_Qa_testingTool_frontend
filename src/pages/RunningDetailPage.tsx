import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Cable,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock,
  CreditCard,
  Loader2,
  Pause,
  Play,
  Power,
  PowerOff,
  ShoppingCart,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { listSupermarkets, Supermarket } from "@/lib/supermarkets";
import {
  connect,
  disconnect,
  stop,
  resume,
  clearLogs,
  getConnection,
  subscribe,
  startOverviewPolling,
  fetchJobLogsPage,
  JOB_LOG_PAGE_SIZE,
  InvoiceLogEntry,
  type InjectionLogFilter,
} from "@/lib/running-store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

// ─── Hook to subscribe to store changes ───────────────────────────────────────

function useRunningState() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);
}

// ─── Log entry component (Sentry-style) ───────────────────────────────────────

function LogEntryRow({
  entry,
  isLatest,
}: {
  entry: InvoiceLogEntry;
  isLatest: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(entry.timestamp);

  const statusIcon =
    entry.status === "success" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    ) : entry.status === "failed" ? (
      <XCircle className="h-4 w-4 text-rose-500" />
    ) : (
      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
    );

  const statusClasses =
    entry.status === "success"
      ? "border-l-emerald-500 bg-emerald-50/30"
      : entry.status === "failed"
      ? "border-l-rose-500 bg-rose-50/30"
      : "border-l-amber-500 bg-amber-50/30";

  return (
    <div
      className={`border-l-[3px] rounded-r-xl transition-all duration-300 ${statusClasses} ${
        isLatest ? "animate-pulse-once ring-1 ring-emerald-200/50" : ""
      }`}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-zinc-50/50"
        type="button"
      >
        {/* Status icon */}
        <div className="shrink-0">{statusIcon}</div>

        {/* Timestamp column */}
        <div className="w-[120px] shrink-0">
          <p className="text-[11px] font-bold tabular-nums text-zinc-500">
            {time.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </p>
          <p className="text-[10px] font-medium text-zinc-400">
            {time.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Invoice ID */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-zinc-900">
            {entry.invoiceId}
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
            <User className="h-3 w-3" />
            {entry.customerName}
            <span className="text-zinc-300">·</span>
            <ShoppingCart className="h-3 w-3" />
            {entry.itemCount} items
          </p>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold tabular-nums text-zinc-900">
            ₹{entry.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-0.5 flex items-center justify-end gap-1">
            <CreditCard className="h-3 w-3 text-zinc-400" />
            <span className="text-[11px] font-semibold text-zinc-400">{entry.paymentMethod}</span>
          </div>
        </div>

        {/* Status badge */}
        <Badge
          variant={
            entry.status === "success"
              ? "success"
              : entry.status === "failed"
              ? "danger"
              : "secondary"
          }
          className="shrink-0 text-[10px] px-2 py-0.5"
        >
          {entry.status === "pending"
            ? "Sending..."
            : entry.status === "failed" && entry.httpStatus != null
              ? `failed · HTTP ${entry.httpStatus}`
              : entry.status}
        </Badge>

        {/* Expand toggle */}
        <div className="shrink-0 text-zinc-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/40 px-6 py-4 space-y-4 animate-in slide-in-from-top-1 fade-in-0 duration-200">
          {(entry.error || entry.httpStatus != null) && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
              <p className="text-xs font-bold text-rose-700">Error Response</p>
              {entry.httpStatus != null && (
                <p className="mt-1 text-[11px] font-semibold text-rose-800">
                  HTTP {entry.httpStatus}
                </p>
              )}
              {entry.error && (
                <p className="mt-1 text-xs font-mono text-rose-600 break-all">{entry.error}</p>
              )}
            </div>
          )}

          {/* Customer info */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Customer</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div>
                <span className="text-zinc-400">Name: </span>
                <span className="font-semibold text-zinc-700">{entry.payload.customer.name}</span>
              </div>
              <div>
                <span className="text-zinc-400">Email: </span>
                <span className="font-semibold text-zinc-700">{entry.payload.customer.email}</span>
              </div>
              <div>
                <span className="text-zinc-400">City: </span>
                <span className="font-semibold text-zinc-700">{entry.payload.customer.city}</span>
              </div>
              <div>
                <span className="text-zinc-400">Phone: </span>
                <span className="font-semibold text-zinc-700">{entry.payload.customer.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Items ({entry.payload.items.length})
            </p>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-3 py-2 text-left font-bold text-zinc-500">Product</th>
                    <th className="px-3 py-2 text-right font-bold text-zinc-500">Qty</th>
                    <th className="px-3 py-2 text-right font-bold text-zinc-500">Price</th>
                    <th className="px-3 py-2 text-right font-bold text-zinc-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.payload.items.map((item, i) => (
                    <tr key={i} className="border-b border-zinc-50 last:border-0">
                      <td className="px-3 py-2 font-medium text-zinc-800">{item.productName}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">₹{item.unitPrice}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-zinc-900">
                        ₹{item.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 bg-zinc-50">
                    <td colSpan={3} className="px-3 py-2 text-right font-bold text-zinc-500">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-zinc-950">
                      ₹{entry.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-white border border-zinc-200 p-2.5 text-center">
              <p className="text-zinc-400 font-medium">Subtotal</p>
              <p className="font-bold tabular-nums text-zinc-800">₹{entry.payload.subtotalAmount.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-white border border-zinc-200 p-2.5 text-center">
              <p className="text-zinc-400 font-medium">Tax</p>
              <p className="font-bold tabular-nums text-zinc-800">₹{entry.payload.totalTax.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-white border border-zinc-200 p-2.5 text-center">
              <p className="text-zinc-400 font-medium">Discount</p>
              <p className="font-bold tabular-nums text-zinc-800">₹{entry.payload.discountAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Countdown timer ──────────────────────────────────────────────────────────

function NextInjectionTimer({ isConnected }: { isConnected: boolean }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (!isConnected) {
      setSeconds(60);
      return;
    }
    setSeconds(60);
    const iv = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 60 : s - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [isConnected]);

  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
      <Clock className="h-3.5 w-3.5 text-emerald-600" />
      <span className="text-xs font-bold text-emerald-700">
        Next invoice in <span className="tabular-nums">{seconds}s</span>
      </span>
    </div>
  );
}

// ─── Main detail page ─────────────────────────────────────────────────────────

export default function RunningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<InvoiceLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<InjectionLogFilter>("all");
  const [logPage, setLogPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logTotalPages, setLogTotalPages] = useState(0);
  useRunningState();

  useEffect(() => {
    const stop = startOverviewPolling(3000);
    return stop;
  }, []);

  useEffect(() => {
    setLogPage(1);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const loadLogs = async () => {
      const data = await fetchJobLogsPage(id, logPage, logFilter, JOB_LOG_PAGE_SIZE);
      if (cancelled || !data) return;
      const tp = data.totalPages;
      const clamped = tp === 0 ? 1 : Math.min(logPage, tp);
      if (clamped !== logPage) {
        setLogPage(clamped);
        return;
      }
      setLogs(data.logs);
      setLogsTotal(data.total);
      setLogTotalPages(tp);
    };
    void loadLogs();
    const iv = setInterval(() => void loadLogs(), 3000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [id, logFilter, logPage]);

  useEffect(() => {
    listSupermarkets()
      .then((data: Supermarket[]) => {
        const found = data.find((sm) => (sm.id || sm._id) === id);
        setSupermarket(found || null);
      })
      .catch(() => toast.error("Failed to load supermarket"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  if (!supermarket) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <p className="text-zinc-500 font-semibold">Supermarket not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/running")}>
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const conn = getConnection(supermarket);
  const isConnected = conn.status === "connected";
  const isStopped = conn.status === "stopped";
  const jobSuccessTotal = conn.invoicesSent;
  const jobFailedTotal = conn.invoicesFailed;
  const listedCount = logsTotal;
  const pendingCount = logs.filter((l) => l.status === "pending").length;

  return (
    <section className="mx-auto max-w-[1000px] space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate("/running")}
        className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Running
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(24,24,27,0.04)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950">
              <Zap className={`h-5 w-5 ${isConnected ? "text-emerald-400" : "text-zinc-500"}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">
                {supermarket.supermarket_name}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Cable className="h-3 w-3" />
                <span className="font-mono">{supermarket.organization_id}</span>
                <span className="text-zinc-300">·</span>
                <span className="relative flex h-2 w-2">
                  {isConnected && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isConnected ? "bg-emerald-500" : isStopped ? "bg-amber-500" : "bg-zinc-300"
                    }`}
                  />
                </span>
                <span className="font-semibold">
                  {isConnected ? "Live" : isStopped ? "Paused" : "Offline"}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <NextInjectionTimer isConnected={isConnected} />
            {!isConnected && !isStopped && (
              <Button
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-none"
                onClick={async () => {
                  try {
                    await connect(supermarket);
                    toast.success("Connected!");
                  } catch {
                    toast.error("Could not connect — check server and login.");
                  }
                }}
              >
                <Power className="h-3.5 w-3.5" />
                Connect
              </Button>
            )}
            {isConnected && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={async () => {
                    try {
                      await stop(supermarket);
                      toast.info("Paused");
                    } catch {
                      toast.error("Could not pause");
                    }
                  }}
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={async () => {
                    try {
                      await disconnect(supermarket);
                      toast.info("Disconnected");
                    } catch {
                      toast.error("Could not disconnect");
                    }
                  }}
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </>
            )}
            {isStopped && (
              <>
                <Button
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-none"
                  onClick={async () => {
                    try {
                      await resume(supermarket);
                      toast.success("Resumed!");
                    } catch {
                      toast.error("Could not resume");
                    }
                  }}
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={async () => {
                    try {
                      await disconnect(supermarket);
                      toast.info("Disconnected");
                    } catch {
                      toast.error("Could not disconnect");
                    }
                  }}
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </>
            )}
            {logsTotal > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-zinc-500"
                onClick={async () => {
                  try {
                    await clearLogs(supermarket);
                    setLogs([]);
                    setLogsTotal(0);
                    setLogTotalPages(0);
                    setLogPage(1);
                    toast.info("Logs cleared (history removed; totals unchanged)");
                  } catch {
                    toast.error("Could not clear logs");
                  }
                }}
              >
                Clear Logs
              </Button>
            )}
          </div>
        </div>

        {/* Stats strip — job totals from DB; list may be filtered */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Logs (filter)</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-zinc-950">{listedCount}</p>
            <p className="mt-0.5 text-[9px] font-medium text-zinc-400">
              filtered total · {JOB_LOG_PAGE_SIZE}/page
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Success</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{jobSuccessTotal}</p>
            <p className="mt-0.5 text-[9px] font-medium text-emerald-600/80">stored in job</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Failed</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-rose-700">{jobFailedTotal}</p>
            <p className="mt-0.5 text-[9px] font-medium text-rose-600/80">stored in job</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-amber-700">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Log stream (Sentry-style) */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.04)] overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CircleDot className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-bold text-zinc-950">Invoice Stream</h2>
            {isConnected && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            <div
              className="flex w-full flex-col gap-2 sm:ml-2 sm:w-auto sm:flex-row sm:items-center"
              role="tablist"
              aria-label="Filter logs by outcome"
            >
              <div className="flex rounded-xl border border-zinc-200/90 bg-zinc-200/40 p-1 shadow-[inset_0_1px_2px_rgba(24,24,27,0.08)] sm:inline-flex">
                {(
                  [
                    { key: "all" as const, label: "All" },
                    { key: "success" as const, label: "Success" },
                    { key: "failed" as const, label: "Failed" },
                  ] as const
                ).map(({ key, label }) => {
                  const active = logFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setLogFilter(key);
                        setLogPage(1);
                      }}
                      className={cn(
                        "relative flex-1 rounded-lg px-4 py-2 text-center text-xs font-bold tracking-tight transition-all min-w-[4.5rem] sm:flex-none",
                        active
                          ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/90"
                          : "text-zinc-500 hover:text-zinc-800"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="text-[11px] font-medium text-zinc-400">
            Page {logPage}
            {logTotalPages > 0 ? ` / ${logTotalPages}` : ""} · {logs.length} on this page · {logsTotal} total
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Zap className="h-8 w-8 text-zinc-200" />
            <p className="mt-3 text-sm font-semibold text-zinc-400">
              {logsTotal === 0
                ? logFilter === "all"
                  ? "No invoices injected yet"
                  : logFilter === "success"
                    ? "No successful injections in this list"
                    : "No failed injections in this list"
                : "No rows on this page"}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {logsTotal === 0
                ? logFilter === "all"
                  ? "Connect to this supermarket to start injecting invoices every minute."
                  : "Try switching to All, or wait for the next scheduled run."
                : "Go to another page or wait for new logs."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map((entry, i) => (
              <LogEntryRow
                key={entry.id}
                entry={entry}
                isLatest={logPage === 1 && i === 0}
              />
            ))}
          </div>
        )}
        {logsTotal > 0 && logTotalPages > 0 && (
          <Pagination
            page={logPage}
            totalPages={logTotalPages}
            totalItems={logsTotal}
            pageSize={JOB_LOG_PAGE_SIZE}
            hidePageSize
            onPageChange={setLogPage}
          />
        )}
      </div>
    </section>
  );
}
