import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, PanelLeft } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { listSupermarkets, type Supermarket } from "@/lib/supermarkets";

type Crumb = { label: string; to?: string };

function breadcrumbsForPath(pathname: string): Crumb[] {
  const trail: Crumb[] = [{ label: "Home", to: "/products" }];

  if (pathname === "/" || pathname === "/products") {
    trail.push({ label: "Products" });
    return trail;
  }

  if (pathname.startsWith("/invoice")) {
    trail.push({ label: "Billing" });
    return trail;
  }

  if (pathname.startsWith("/customers")) {
    trail.push({ label: "Customers" });
    return trail;
  }

  if (pathname.startsWith("/supermarkets")) {
    trail.push({ label: "Supermarkets" });
    return trail;
  }

  if (pathname === "/running") {
    trail.push({ label: "Running" });
    return trail;
  }

  if (pathname === "/running/history") {
    trail.push({ label: "Running", to: "/running" });
    trail.push({ label: "Injection history" });
    return trail;
  }

  const runningDetail = /^\/running\/([^/]+)$/.exec(pathname);
  if (runningDetail) {
    trail.push({ label: "Running", to: "/running" });
    trail.push({ label: "Job detail" });
    return trail;
  }

  trail.push({ label: "Page" });
  return trail;
}

function runningJobDetailId(pathname: string): string | null {
  if (pathname === "/running/history") return null;
  const m = /^\/running\/([^/]+)$/.exec(pathname);
  return m ? m[1] : null;
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAuthPage = location.pathname.startsWith("/login");
  const jobDetailId = useMemo(() => runningJobDetailId(location.pathname), [location.pathname]);

  const [jobDetailTitle, setJobDetailTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!jobDetailId) {
      setJobDetailTitle(null);
      return;
    }

    const st = location.state as { supermarketName?: string } | null;
    const fromState = st?.supermarketName?.trim();
    if (fromState) {
      setJobDetailTitle(fromState);
      return;
    }

    setJobDetailTitle(null);
    let cancelled = false;
    void listSupermarkets().then((list) => {
      if (cancelled) return;
      const sm = list.find((s: Supermarket) => String(s.id || s._id) === jobDetailId);
      setJobDetailTitle(sm?.supermarket_name?.trim() || null);
    });
    return () => {
      cancelled = true;
    };
  }, [jobDetailId, location.key, location.pathname]);

  const crumbs = useMemo(() => {
    const trail = breadcrumbsForPath(location.pathname);
    if (jobDetailId) {
      const last = trail[trail.length - 1];
      if (last?.label === "Job detail" && jobDetailTitle) {
        return [...trail.slice(0, -1), { label: jobDetailTitle }];
      }
    }
    return trail;
  }, [location.pathname, jobDetailId, jobDetailTitle]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-zinc-950">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={cn("min-h-screen transition-all duration-300", isCollapsed ? "md:pl-[82px]" : "md:pl-[280px]")}>
        <header className="sticky top-0 z-30 flex min-h-[70px] items-center border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 md:hidden"
              type="button"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                {crumbs.map((c, i) => {
                  const isLast = i === crumbs.length - 1;
                  return (
                    <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                      {i > 0 && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                      )}
                      {c.to && !isLast ? (
                        <Link
                          to={c.to}
                          className="truncate text-zinc-500 transition hover:text-zinc-950"
                        >
                          {c.label}
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            "truncate",
                            isLast ? "text-zinc-950" : "text-zinc-500"
                          )}
                          aria-current={isLast ? "page" : undefined}
                        >
                          {c.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
