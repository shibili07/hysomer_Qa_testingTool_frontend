"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
};

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className
}: PaginationProps) {
  if (!totalItems) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(5, Math.min(totalPages, page + 2))
  );

  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}</span> to{" "}
        <span className="font-medium text-slate-700">{end}</span> of{" "}
        <span className="font-medium text-slate-700">{totalItems}</span> items
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>

        {pageNumbers.map((pageNumber) => (
          <Button
            key={pageNumber}
            type="button"
            size="sm"
            variant={pageNumber === page ? "default" : "secondary"}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
