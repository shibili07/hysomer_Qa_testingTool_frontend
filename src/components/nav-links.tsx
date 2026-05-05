import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/products", label: "Products" },
  { to: "/invoice", label: "Billing / Invoice" }
];

export function NavLinks() {
  const location = useLocation();

  return (
    <>
      {links.map((link) => {
        const isActive =
          location.pathname === link.to || (link.to === "/products" && location.pathname === "/");

        return (
          <Link
            key={link.to}
            className={cn(
              "rounded-xl border px-3 py-2 transition-all",
              isActive
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
            to={link.to}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
