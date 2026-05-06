import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Activity,
  CalendarRange,
  Cable,
  ChevronRight,
  CircleDot,
  MoreVertical,
  Pause,
  Play,
  Power,
  PowerOff,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { listSupermarkets, Supermarket } from "@/lib/supermarkets";
import {
  connect,
  disconnect,
  stop,
  resume,
  deleteConnection,
  getConnection,
  subscribe,
  getAllConnections,
  startOverviewPolling,
  ConnectionStatus,
} from "@/lib/running-store";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Hook to sync with running-store ──────────────────────────────────────

function useRunningState() {
  // Force re-render on any store change
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusColor(s: ConnectionStatus) {
  switch (s) {
    case "connected":
      return "bg-emerald-500";
    case "stopped":
      return "bg-amber-500";
    default:
      return "bg-zinc-300";
  }
}

function statusLabel(s: ConnectionStatus) {
  switch (s) {
    case "connected":
      return "Connected";
    case "stopped":
      return "Paused";
    default:
      return "Disconnected";
  }
}

function statusBadgeVariant(s: ConnectionStatus): "success" | "danger" | "secondary" {
  switch (s) {
    case "connected":
      return "success";
    case "stopped":
      return "danger";
    default:
      return "secondary";
  }
}

// ─── Dropdown menu ────────────────────────────────────────────────────────────

function ActionMenu({
  sm,
  status,
}: {
  sm: Supermarket;
  status: ConnectionStatus;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions = [
    {
      label: "Connect",
      icon: Power,
      show: status === "disconnected",
      color: "text-emerald-600 hover:bg-emerald-50",
      onClick: async () => {
        try {
          await connect(sm);
          toast.success(`Connected to ${sm.supermarket_name}`);
        } catch {
          toast.error("Could not start injection (check API / login)");
        }
      },
    },
    {
      label: "Disconnect",
      icon: PowerOff,
      show: status === "connected" || status === "stopped",
      color: "text-rose-600 hover:bg-rose-50",
      onClick: async () => {
        try {
          await disconnect(sm);
          toast.info(`Disconnected from ${sm.supermarket_name}`);
        } catch {
          toast.error("Could not disconnect");
        }
      },
    },
    {
      label: "Pause",
      icon: Pause,
      show: status === "connected",
      color: "text-amber-600 hover:bg-amber-50",
      onClick: async () => {
        try {
          await stop(sm);
          toast.info(`Paused injection for ${sm.supermarket_name}`);
        } catch {
          toast.error("Could not pause");
        }
      },
    },
    {
      label: "Resume",
      icon: Play,
      show: status === "stopped",
      color: "text-emerald-600 hover:bg-emerald-50",
      onClick: async () => {
        try {
          await resume(sm);
          toast.success(`Resumed injection for ${sm.supermarket_name}`);
        } catch {
          toast.error("Could not resume");
        }
      },
    },
    {
      label: "Delete Data",
      icon: Trash2,
      show: true,
      color: "text-rose-600 hover:bg-rose-50",
      onClick: async () => {
        try {
          await deleteConnection(sm);
          toast.info(`Cleared data for ${sm.supermarket_name}`);
        } catch {
          toast.error("Could not clear data");
        }
      },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        type="button"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-[0_20px_45px_rgba(24,24,27,0.14)] animate-in fade-in-0 zoom-in-95">
          {actions
            .filter((a) => a.show)
            .map((a) => (
              <button
                key={a.label}
                onClick={(e) => {
                  e.stopPropagation();
                  a.onClick();
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${a.color}`}
                type="button"
              >
                <a.icon className="h-4 w-4" />
                {a.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Supermarket Card ─────────────────────────────────────────────────────────

function SupermarketCard({ sm }: { sm: Supermarket }) {
  const navigate = useNavigate();
  const conn = getConnection(sm);

  const handleCardClick = () => {
    navigate(`/running/${sm.id || sm._id}`, {
      state: { supermarketName: sm.supermarket_name },
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(24,24,27,0.04)] transition-all duration-300 hover:border-zinc-300 hover:shadow-[0_16px_40px_rgba(24,24,27,0.1)] hover:-translate-y-0.5"
    >
      {/* Connection status indicator */}
      <div className="absolute left-5 top-5">
        <span className="relative flex h-2.5 w-2.5">
          {conn.status === "connected" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusColor(conn.status)}`} />
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between pl-6">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold tracking-tight text-zinc-950 group-hover:text-zinc-700 transition">
            {sm.supermarket_name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <Cable className="h-3 w-3" />
            <span className="font-mono">{sm.organization_id}</span>
          </p>
        </div>
        <ActionMenu sm={sm} status={conn.status} />
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-50 p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sent</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-zinc-950">{conn.invoicesSent}</p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Failed</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-rose-600">{conn.invoicesFailed}</p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Status</p>
          <div className="mt-1">
            <Badge variant={statusBadgeVariant(conn.status)} className="text-[10px] px-2 py-0.5">
              {statusLabel(conn.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
        <p className="text-[11px] font-medium text-zinc-400">
          {conn.lastInvoiceAt
            ? `Last: ${new Date(conn.lastInvoiceAt).toLocaleTimeString()}`
            : "No invoices yet"}
        </p>
        <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover:text-zinc-600 transition">
          View Logs
          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RunningPage() {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [loading, setLoading] = useState(true);
  useRunningState();

  useEffect(() => {
    listSupermarkets()
      .then((data) => setSupermarkets(data))
      .catch(() => toast.error("Failed to load supermarkets"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const stop = startOverviewPolling(3000);
    return stop;
  }, []);

  // Calculate aggregated stats
  const allConns = getAllConnections();
  const totalConnected = Array.from(allConns.values()).filter((c) => c.status === "connected").length;
  const totalSent = Array.from(allConns.values()).reduce((s, c) => s + c.invoicesSent, 0);
  const totalFailed = Array.from(allConns.values()).reduce((s, c) => s + c.invoicesFailed, 0);

  return (
    <section className="mx-auto max-w-[1200px] space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Stress Testing Console
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
            Running
          </h1>
          <p className="mt-2 text-base font-medium text-zinc-500">
            Durability testing: the backend injects about one invoice per minute per <strong className="font-semibold text-zinc-700">connected</strong> supermarket. Close the browser anytime — injection continues while the API server stays running. Use Connect / Pause / Disconnect to control jobs from here.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
          <Badge
            variant="secondary"
            className="inline-flex w-fit max-w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            Ingestion Stress Test
          </Badge>
          <Link
            to="/running/history"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex h-auto min-h-11 w-fit max-w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold shadow-lg shadow-zinc-900/15"
            )}
          >
            <CalendarRange className="h-4 w-4 shrink-0" />
            Injection history
          </Link>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100">
              <Activity className="h-4 w-4 text-zinc-600" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Markets</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-zinc-950">{supermarkets.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50">
              <CircleDot className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Connected</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-emerald-600">{totalConnected}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50">
              <Zap className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Invoices Sent</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-zinc-950">{totalSent}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50">
              <Activity className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Failed</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-rose-600">{totalFailed}</p>
        </div>
      </div>

      {/* Supermarket cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
        </div>
      ) : supermarkets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center">
          <Cable className="h-10 w-10 text-zinc-300" />
          <p className="mt-4 text-base font-semibold text-zinc-500">No Supermarkets Registered</p>
          <p className="mt-1 text-sm text-zinc-400">
            Register supermarkets in the Supermarkets page first, then come back to start stress testing.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supermarkets.map((sm) => (
            <SupermarketCard key={sm.id || sm._id} sm={sm} />
          ))}
        </div>
      )}
    </section>
  );
}
