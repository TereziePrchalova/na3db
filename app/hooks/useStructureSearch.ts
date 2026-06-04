import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { SearchResult } from "~/lib/search.server";
import { PAGE_SIZE } from "~/lib/constants";

export function useStructureSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pdbId              = searchParams.get("pdbId")              ?? "";
  const author             = searchParams.get("author")             ?? "";
  const experimentalMethod = searchParams.get("experimentalMethod") ?? "";
  const entityName         = searchParams.get("entityName")         ?? "";
  const sourceOrganism     = searchParams.get("sourceOrganism")     ?? "";
  const nonStandardResidue = searchParams.get("nonStandardResidue") ?? "";
  const assignedNtc        = searchParams.get("assignedNtc")        ?? "";
  const confalScoreMin     = searchParams.get("confalScoreMin")     ?? "";
  const confalScoreMax     = searchParams.get("confalScoreMax")     ?? "";
  const helixLengthMin     = searchParams.get("helixLengthMin")     ?? "";
  const helixLengthMax     = searchParams.get("helixLengthMax")     ?? "";
  const polymerType        = searchParams.get("polymerType")        ?? "";
  const monomerFlag        = searchParams.get("monomerFlag")        ?? "";
  const page               = parseInt(searchParams.get("page")      ?? "1") || 1;

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (pdbId)              params.set("pdbId",              pdbId);
    if (author)             params.set("author",             author);
    if (experimentalMethod) params.set("experimentalMethod", experimentalMethod);
    if (entityName)         params.set("entityName",         entityName);
    if (sourceOrganism)     params.set("sourceOrganism",     sourceOrganism);
    if (nonStandardResidue) params.set("nonStandardResidue", nonStandardResidue);
    if (assignedNtc)        params.set("assignedNtc",        assignedNtc);
    if (confalScoreMin)     params.set("confalScoreMin",     confalScoreMin);
    if (confalScoreMax)     params.set("confalScoreMax",     confalScoreMax);
    if (helixLengthMin)     params.set("helixLengthMin",     helixLengthMin);
    if (helixLengthMax)     params.set("helixLengthMax",     helixLengthMax);
    if (polymerType)        params.set("polymerType",        polymerType);
    if (monomerFlag)        params.set("monomerFlag",        monomerFlag);
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
  }, [
    pdbId, author, experimentalMethod, entityName, sourceOrganism,
    nonStandardResidue, assignedNtc, confalScoreMin, confalScoreMax,
    helixLengthMin, helixLengthMax, polymerType, monomerFlag, page,
  ]);

  function setPage(newPage: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  }

  return {
    pdbId, author, experimentalMethod, entityName, sourceOrganism,
    nonStandardResidue, assignedNtc, confalScoreMin, confalScoreMax,
    helixLengthMin, helixLengthMax, polymerType, monomerFlag,
    results, total, page, pageSize: PAGE_SIZE, loading, error,
    setSearchParams, setPage,
  };
}
