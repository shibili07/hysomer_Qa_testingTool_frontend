import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, FileText, ChevronLeft, Menu, LogOut, ChevronUp, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

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
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const navItems = [
    { name: "Products", to: "/products", icon: Package },
    { name: "Billing & Invoices", to: "/invoice", icon: FileText }
  ];

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] md:hidden transition-all duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
          isCollapsed ? "w-[80px]" : "w-[280px]",
          "md:translate-x-0",
          isCollapsed ? "translate-x-[-100%] md:translate-x-0" : "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-20 px-6">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Hysomer</span>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to || (item.to === "/products" && location.pathname === "/");
            const isProducts = item.name === "Products";
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group overflow-hidden",
                  isActive
                    ? isProducts
                      ? "bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-[length:200%_auto] animate-shimmer text-white shadow-lg shadow-slate-200 font-medium"
                      : "bg-slate-900 text-white shadow-lg shadow-slate-200 font-medium"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && isProducts && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full animate-sweep pointer-events-none" />
                )}

                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 relative z-10",
                    isCollapsed ? "mr-0" : "mr-4",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500"
                  )}
                />

                {!isCollapsed && (
                  <>
                    <span className="whitespace-nowrap transition-all duration-300 relative z-10">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="ml-auto w-4 h-4 text-white/70 relative z-10" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50 relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              "w-full flex items-center p-3 rounded-2xl transition-all duration-300 hover:bg-slate-50 group border border-transparent",
              isUserMenuOpen ? "bg-slate-50 border-slate-100 shadow-sm" : "",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "space-x-3")}>
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <User className="w-4 h-4" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden text-left animate-in fade-in duration-500">
                  <span className="text-sm font-bold text-slate-800 truncate leading-tight">
                    {user?.name || "Admin User"}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate font-medium">
                    {user?.email || "admin@hysomer.com"}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronUp
                className={cn(
                  "w-4 h-4 text-slate-300 transition-all duration-500 ease-out",
                  isUserMenuOpen ? "rotate-180 text-indigo-500" : "group-hover:text-slate-500"
                )}
              />
            )}
          </button>

          {isUserMenuOpen && (
            <div
              className={cn(
                "absolute bottom-[calc(100%+8px)] left-4 right-4 p-2 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-4 duration-300 z-[60] backdrop-blur-xl bg-white/90",
                isCollapsed && "w-[200px] left-[calc(100%+12px)] right-auto bottom-4"
              )}
            >
              <div className="px-3 py-2 mb-1 border-b border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Account Settings
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 transition-colors group-hover:bg-red-100">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <span className="font-semibold">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-6 left-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.3)] md:hidden hover:bg-slate-800 transition-all duration-300 active:scale-95"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
