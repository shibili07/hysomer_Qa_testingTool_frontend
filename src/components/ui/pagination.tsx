import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="ml-4">
          Showing <span className="font-bold text-zinc-950">{(page - 1) * pageSize + 1}</span> to{" "}
          <span className="font-bold text-zinc-950">{Math.min(page * pageSize, totalItems)}</span> of{" "}
          <span className="font-bold text-zinc-950">{totalItems}</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          className="h-8 w-8 p-0 rounded-lg"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "secondary"}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg text-xs",
                  page === pageNum ? "bg-zinc-950 text-white" : "bg-transparent hover:bg-zinc-100"
                )}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="secondary"
          className="h-8 w-8 p-0 rounded-lg"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
