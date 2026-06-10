import { Link } from "react-router";
import type { SearchResult } from "~/lib/search.server";

type ResultsProps = {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

const METHOD_LABELS: Record<string, string> = {
    "X-RAY DIFFRACTION": "X-ray",
    "ELECTRON MICROSCOPY": "EM",
    "SOLID-STATE NMR": "Solid NMR",
    "SOLUTION NMR": "NMR",
    "NEUTRON DIFFRACTION": "Neutron",
    "ELECTRON CRYSTALLOGRAPHY": "Electron cryst.",
    "POWDER DIFFRACTION": "Powder",
    "FIBER DIFFRACTION": "Fiber",
    "SOLUTION SCATTERING": "Scattering",
    "EPR": "EPR",
    "FLUORESCENCE TRANSFER": "FRET",
    "INFRARED SPECTROSCOPY": "IR",
    "THEORETICAL MODEL": "Model",
};

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
}

export default function Results({ results, total, page, pageSize, onPageChange }: ResultsProps) {
    const totalPages = Math.ceil(total / pageSize);
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="h-full w-full shrink-0 flex flex-col">
            <div className="h-15 border-b border-b-[#2E2E2B] flex items-center justify-between px-6">
                <h1 className="text-base font-semibold">Entries ({total})</h1>
                {total > 0 && (
                    <span className="text-xs text-[#85858A]">{from} – {to} of {total}</span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
                {results.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-[#85858A]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                            <path d="M11 8v6M8 11h6" />
                        </svg>
                        <span className="text-sm">No entries found</span>
                    </div>
                )}
                {results.map((entry) => (
                    <Link
                        key={entry.pdbId}
                        to={`/entry/${entry.pdbId}`}
                        className="border-b border-b-[#2E2E2B] flex px-6 py-4 last:border-b-0 hover:bg-[#1E1E1C] transition-colors"
                    >
                        <div className="mr-4 w-20 shrink-0">
                            <div className="text-sm font-bold mb-1">{entry.pdbId}</div>
                            {entry.depositionDate && (
                                <div className="text-xs text-[#85858A] mb-1">{new Date(entry.depositionDate).toISOString().slice(0, 10)}</div>
                            )}
                            {entry.resolution && (
                                <div className="text-xs text-[#85858A]">{entry.resolution.toFixed(2)} Å</div>
                            )}
                        </div>
                        <div className="flex justify-between w-full min-w-0 items-start">
                            <div className="text-sm font-normal line-clamp-2 mr-2">{entry.citationTitle ?? entry.title ?? "No title"}</div>
                            {entry.method && (
                                <div className="text-[#85B7EB] bg-[#1E3A4A] rounded-full py-1 px-2 text-sm font-medium shrink-0">
                                    {METHOD_LABELS[entry.method] ?? entry.method}
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
            {totalPages > 1 && (
                <div className="h-12 border-t border-t-[#2E2E2B] flex items-center justify-center gap-1 px-6 shrink-0">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="text-sm text-[#C4C4BE] cursor-pointer disabled:opacity-30 px-2"
                    >
                        ←
                    </button>
                    {getPageNumbers(page, totalPages).map((p, i) =>
                        p === "..." ? (
                            <span key={`ellipsis-${i}`} className="text-xs text-[#85858A] px-1">…</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${p === page ? "text-[#C4C4BE] bg-[#2E2E2B]" : "text-[#85858A] hover:text-[#C4C4BE]"}`}
                            >
                                {p}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="text-sm text-[#C4C4BE] cursor-pointer disabled:opacity-30 px-2"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    )
}
