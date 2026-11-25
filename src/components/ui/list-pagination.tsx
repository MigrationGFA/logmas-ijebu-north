"use client";

import { Button } from "@/components/ui/button";
import type { PaginationState } from "@/hooks/usePagination";

/**
 * The shared pagination bar for dashboard lists: a "Showing X to Y of Z"
 * line on the left and Previous / numbered pages / Next on the right.
 * Renders nothing for an empty list.
 */
export function ListPagination({
  pagination,
  unit = "items",
}: {
  pagination: PaginationState;
  unit?: string;
}) {
  const {
    safePage,
    totalPages,
    startIndex,
    pageSize,
    totalItems,
    setCurrentPage,
  } = pagination;

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-xs text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalItems)}{" "}
        of {totalItems} {unit}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => setCurrentPage(safePage - 1)}
        >
          Previous
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={page === safePage ? "default" : "outline"}
            size="sm"
            className="min-w-9"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => setCurrentPage(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
