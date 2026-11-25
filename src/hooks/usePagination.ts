"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination over an already-loaded list, the same pattern
 * the pricing table uses: filters reset to page 1, and the page clamps
 * to the last valid page when the list shrinks, so a view never lands
 * on a blank page. `resetDeps` should carry the page's filter/search
 * state values.
 */
export function usePagination<T>(
  items: T[],
  pageSize = 10,
  resetDeps: unknown[] = [],
) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = useMemo(
    () => items.slice(startIndex, startIndex + pageSize),
    [items, startIndex, pageSize],
  );

  return {
    pageItems,
    safePage,
    totalPages,
    startIndex,
    totalItems,
    pageSize,
    setCurrentPage,
  };
}

export type PaginationState = ReturnType<typeof usePagination>;
