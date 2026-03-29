"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function Pagination({ total, page, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>
          Showing {start}-{end} of {total}
        </span>
        <span className="text-slate-300">|</span>
        <select
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
          className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 focus:border-brand focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1, pageSize)}
          disabled={page <= 1}
          className={clsx(
            "rounded-lg border border-slate-200 p-1.5 transition-colors",
            page <= 1
              ? "cursor-not-allowed text-slate-300"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-3 text-sm font-medium text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1, pageSize)}
          disabled={page >= totalPages}
          className={clsx(
            "rounded-lg border border-slate-200 p-1.5 transition-colors",
            page >= totalPages
              ? "cursor-not-allowed text-slate-300"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
