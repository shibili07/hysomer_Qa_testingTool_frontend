import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronRight, Moon, PanelLeft, Plus, SunMedium } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAuthPage = location.pathname.startsWith("/login");
  const pageName = useMemo(() => {
    if (location.pathname.startsWith("/invoice")) return "Billing";
    if (location.pathname.startsWith("/customers")) return "Customers";
    return "Products";
  }, [location.pathname]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-zinc-950">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={cn("min-h-screen transition-all duration-300", isCollapsed ? "md:pl-[82px]" : "md:pl-[280px]")}>
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 md:hidden"
              type="button"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 text-sm font-semibold md:flex">
              <Link to="/products" className="text-zinc-500 transition hover:text-zinc-950">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-950">{pageName}</span>
            </div>
            <div className="min-w-0 md:hidden">
              <p className="truncate text-sm font-semibold text-zinc-950">{pageName}</p>
              <p className="text-xs font-medium text-zinc-500">Hysomer QA Console</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              className="hidden h-10 w-10 place-items-center rounded-full bg-zinc-950 text-white shadow-sm transition hover:bg-zinc-800 sm:grid"
              type="button"
              aria-label="Light mode"
            >
              <SunMedium className="h-4 w-4" />
            </button>
            <button
              className="hidden h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 sm:grid"
              type="button"
              aria-label="Dark mode"
            >
              <Moon className="h-4 w-4" />
            </button>
            <button
              className="relative grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              type="button"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-black leading-5 text-white">
                3
              </span>
            </button>
            <Link
              to="/invoice"
              className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(24,24,27,0.18)] transition hover:bg-zinc-800 sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
