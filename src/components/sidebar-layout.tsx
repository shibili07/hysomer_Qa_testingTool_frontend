import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAuthPage = location.pathname.startsWith("/login");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isCollapsed ? "md:pl-[72px]" : "md:pl-64"
        )}
      >
        {children}
      </div>
    </div>
  );
}
