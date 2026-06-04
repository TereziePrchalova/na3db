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
                {results.map((entry) => (
                    <div key={entry.pdbId} className="border-b border-b-[#2E2E2B] h-15 flex items-center px-6 last:border-b-0">
                        <div className="text-sm w-15 mr-4 shrink-0">{entry.pdbId}</div>
                        <div className="flex justify-between w-full">
                            <div className="text-sm font-normal my-auto">{entry.citationTitle ?? entry.title ?? "No title"}</div>
                            {entry.method && (
                                <div className="text-[#85B7EB] bg-[#1E3A4A] rounded-full py-1 px-2 text-sm font-medium shrink-0 ml-2 h-fit">
                                    {METHOD_LABELS[entry.method] ?? entry.method}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {totalPages > 1 && (
                <div className="h-12 border-t border-t-[#2E2E2B] flex items-center justify-between px-6 shrink-0">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="text-sm text-[#C4C4BE] cursor-pointer disabled:opacity-30"
                    >
                        ←
                    </button>
                    <span className="text-xs text-[#85858A]">{page} / {totalPages}</span>
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="text-sm text-[#C4C4BE] cursor-pointer disabled:opacity-30"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    )
}