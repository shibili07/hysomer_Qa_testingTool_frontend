import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Boxes,
  ChevronLeft,
  FileText,
  LogOut,
  Menu,
  MoreVertical,
  Package,
  Plus,
  Store,
  User,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

export function Sidebar({
  isCollapsed,
  setIsCollapsed
}: {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed");
    }
  };

  const navItems = [
    { name: "Products", to: "/products", icon: Package },
    { name: "Billing", to: "/invoice", icon: FileText },
    { name: "Customers", to: "/customers", icon: Users },
    { name: "Supermarkets", to: "/supermarkets", icon: Store }
  ];

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 flex flex-col border-r border-zinc-200 bg-white transition-all duration-300",
          isCollapsed ? "w-[82px]" : "w-[280px]",
          "md:translate-x-0",
          isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        )}
      >
        <div className="flex h-[82px] items-center justify-between px-5">
          {!isCollapsed && (
            <Link to="/products" className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zinc-950 text-white shadow-[0_14px_28px_rgba(24,24,27,0.18)]">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0 leading-none">
                <span className="block truncate text-lg font-bold tracking-tight text-zinc-950">Hysomer</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  QA Console
                </span>
              </div>
            </Link>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950",
              isCollapsed && "mx-auto"
            )}
            type="button"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

       

        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to || (item.to === "/products" && location.pathname === "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                  isActive ? "bg-zinc-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-zinc-950" : "text-zinc-500")} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              "flex w-full items-center rounded-2xl p-2.5 text-left transition hover:bg-zinc-50",
              isCollapsed ? "justify-center" : "justify-between"
            )}
            type="button"
          >
            <div className={cn("flex min-w-0 items-center", isCollapsed ? "justify-center" : "gap-3")}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-500">
                {user?.name?.slice(0, 2).toUpperCase() || <User className="h-4 w-4" />}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">{user?.name || "Hysomer Admin"}</p>
                  <p className="truncate text-xs font-medium text-zinc-500">{user?.email || "admin@hysomer.com"}</p>
                </div>
              )}
            </div>
            {!isCollapsed && <MoreVertical className="h-4 w-4 text-zinc-400" />}
          </button>

          {isUserMenuOpen && (
            <div
              className={cn(
                "absolute bottom-[76px] left-4 right-4 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_20px_45px_rgba(24,24,27,0.12)]",
                isCollapsed && "bottom-4 left-[calc(100%+10px)] right-auto w-52"
              )}
            >
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-rose-50 hover:text-rose-600"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-5 left-5 z-50 grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-white shadow-xl md:hidden"
          type="button"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
