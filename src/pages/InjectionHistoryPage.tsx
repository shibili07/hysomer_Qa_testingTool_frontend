import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarRange,
  Loader2,
  RefreshCw,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import {
  DailyInjectionOutcomeFilter,
  DailyInjectionReportRow,
  fetchDailyInjectionReport,
} from "@/lib/running-store";
import { listSupermarkets, Supermarket } from "@/lib/supermarkets";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function InjectionHistoryPage() {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [rows, setRows] = useState<DailyInjectionReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const [supermarketId, setSupermarketId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [outcome, setOutcome] = useState<DailyInjectionOutcomeFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchDailyInjectionReport({
      page,
      limit: pageSize,
      supermarketId: supermarketId || undefined,
      from: from || undefined,
      to: to || undefined,
      outcome,
    });
    setLoading(false);
    if (!data) {
      toast.error("Could not load injection report");
      setRows([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }
    setRows(data.rows);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [page, pageSize, supermarketId, from, to, outcome]);

  useEffect(() => {
    void listSupermarkets().then(setSupermarkets);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetFilters = () => {
    setSupermarketId("");
    setFrom("");
    setTo("");
    setOutcome("all");
    setPage(1);
  };

  const applyQuickThisMonth = () => {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    setFrom(start.toISOString().slice(0, 10));
    setTo(todayISO());
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/running"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Running
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            <CalendarRange className="h-3.5 w-3.5" />
            Reports
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
            Daily injection history
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-500">
            Counts are grouped by <strong className="font-semibold text-zinc-700">UTC calendar day</strong> and{" "}
            <strong className="font-semibold text-zinc-700">supermarket</strong>, computed from stored injection
            logs. No extra database collection is required.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 gap-2"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(24,24,27,0.04)]">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Filters</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500">Supermarket</span>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <select
                value={supermarketId}
                onChange={(e) => {
                  setSupermarketId(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              >
                <option value="">All supermarkets</option>
                {supermarkets.map((sm) => {
                  const id = sm.id || sm._id || "";
                  return (
                    <option key={id} value={id}>
                      {sm.supermarket_name}
                    </option>
                  );
                })}
              </select>
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500">From (UTC)</span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500">To (UTC)</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500">Outcome</span>
            <select
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value as DailyInjectionOutcomeFilter);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            >
              <option value="all">All attempts</option>
              <option value="success">Successful only</option>
              <option value="failed">Failed only</option>
            </select>
          </label>
          <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="h-10 rounded-xl text-xs" onClick={applyQuickThisMonth}>
                This month (UTC)
              </Button>
              <Button type="button" variant="ghost" className="h-10 rounded-xl text-xs" onClick={resetFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.04)]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          <p className="text-sm font-bold text-zinc-950">
            {total} day–store row{total === 1 ? "" : "s"}
          </p>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date (UTC)</TableHead>
                <TableHead>Supermarket</TableHead>
                <TableHead className="font-mono text-xs">ID</TableHead>
                <TableHead className="text-right">Injections</TableHead>
                <TableHead className="text-right text-emerald-600">OK</TableHead>
                <TableHead className="text-right text-rose-600">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-zinc-400">
                    No data for these filters. Try widening the date range or clearing filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={`${r.date}-${r.supermarketId}`}>
                    <TableCell className="font-mono text-sm font-semibold text-zinc-900">{r.date}</TableCell>
                    <TableCell className="font-semibold text-zinc-900">{r.supermarketName}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">{r.supermarketId}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-zinc-950">{r.injectCount}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-emerald-700">
                      {r.successCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-rose-700">{r.failedCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {total > 0 && totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>
    </section>
  );
}
