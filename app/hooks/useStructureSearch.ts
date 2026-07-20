import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { SearchResult } from "~/lib/search.server";
import { PAGE_SIZE, FILTER_KEYS } from "~/lib/constants";

export function useStructureSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const filters = Object.fromEntries(
    FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ""])
  ) as Record<(typeof FILTER_KEYS)[number], string>;

  const page = parseInt(searchParams.get("page") ?? "1") || 1;

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    
    FILTER_KEYS.forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
    });

    params.set("page", String(page));

    fetch(`/api/search?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(({ results, total }) => {
        setResults(results);
        setTotal(total);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [...Object.values(filters), page]);

  function setPage(newPage: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  }

  return {
    ...filters, results, total, page, pageSize: PAGE_SIZE, loading, error, setSearchParams, setPage,
  };
}
