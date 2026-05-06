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
  InvoiceLogEntry,
} from "@/lib/running-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
          {entry.status === "pending" ? "Sending..." : entry.status}
        </Badge>

        {/* Expand toggle */}
        <div className="shrink-0 text-zinc-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/40 px-6 py-4 space-y-4 animate-in slide-in-from-top-1 fade-in-0 duration-200">
          {entry.error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
              <p className="text-xs font-bold text-rose-700">Error Response</p>
              <p className="mt-1 text-xs font-mono text-rose-600 break-all">{entry.error}</p>
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
  useRunningState();

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
  const successCount = conn.logs.filter((l) => l.status === "success").length;
  const failedCount = conn.logs.filter((l) => l.status === "failed").length;
  const pendingCount = conn.logs.filter((l) => l.status === "pending").length;

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
                onClick={() => {
                  connect(supermarket);
                  toast.success("Connected!");
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
                  onClick={() => {
                    stop(supermarket);
                    toast.info("Paused");
                  }}
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => {
                    disconnect(supermarket);
                    toast.info("Disconnected");
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
                  onClick={() => {
                    resume(supermarket);
                    toast.success("Resumed!");
                  }}
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => {
                    disconnect(supermarket);
                    toast.info("Disconnected");
                  }}
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </>
            )}
            {conn.logs.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-zinc-500"
                onClick={() => {
                  clearLogs(supermarket);
                  toast.info("Logs cleared");
                }}
              >
                Clear Logs
              </Button>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Logs</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-zinc-950">{conn.logs.length}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Success</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{successCount}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Failed</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-rose-700">{failedCount}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-amber-700">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Log stream (Sentry-style) */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.04)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-bold text-zinc-950">Invoice Stream</h2>
            {isConnected && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium text-zinc-400">
            {conn.logs.length} events
          </p>
        </div>

        {conn.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Zap className="h-8 w-8 text-zinc-200" />
            <p className="mt-3 text-sm font-semibold text-zinc-400">
              No invoices injected yet
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Connect to this supermarket to start injecting invoices every minute.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {conn.logs.map((entry, i) => (
              <LogEntryRow key={entry.id} entry={entry} isLatest={i === 0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
