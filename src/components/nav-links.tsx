"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/products", label: "Products" },
  { href: "/invoice", label: "Billing / Invoice" }
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href === "/products" && pathname === "/");

        return (
          <Link
            key={link.href}
            className={cn(
              "rounded-xl border px-3 py-2 transition-all",
              isActive
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
            href={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
