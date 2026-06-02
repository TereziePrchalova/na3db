import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { SearchResult } from "~/lib/search.server";

export function useStructureSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
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

    fetch(`/api/search?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setResults)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [
    pdbId, author, experimentalMethod, entityName, sourceOrganism,
    nonStandardResidue, assignedNtc, confalScoreMin, confalScoreMax,
    helixLengthMin, helixLengthMax, polymerType, monomerFlag,
  ]);

  return {
    pdbId, author, experimentalMethod, entityName, sourceOrganism,
    nonStandardResidue, assignedNtc, confalScoreMin, confalScoreMax,
    helixLengthMin, helixLengthMax, polymerType, monomerFlag,
    results, loading, error, setSearchParams,
  };
}
