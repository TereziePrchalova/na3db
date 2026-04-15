import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { SearchResult } from "~/lib/search.server";

export function useStructureSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const author = searchParams.get("author") ?? "";
  const pdbId = searchParams.get("pdbId") ?? "";

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (author) params.set("author", author);
    if (pdbId)  params.set("pdbId", pdbId);

    fetch(`/api/search?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setResults)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [author, pdbId]);

  return { author, pdbId, results, loading, error, setSearchParams };
}
