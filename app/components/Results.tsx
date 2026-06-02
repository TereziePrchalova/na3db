import type { SearchResult } from "~/lib/search.server";

type ResultsProps = {
  results: SearchResult[];
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

export default function Results({ results }: ResultsProps) {
    return (
        <div className="h-full w-full shrink-0 flex flex-col">
            <div className="h-15 border-b border-b-[#2E2E2B]">
                <h1 className="ml-6 flex h-full items-center text-base font-semibold">
                    Entries
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto">
                {results.map((entry) => (
                    <div key={entry.pdbId} className="border-b border-b-[#2E2E2B] h-15 flex items-center px-6">
                        <div className="font-medium text-sm w-15 mr-4 shrink-0">{entry.pdbId}</div>
                        <div className="flex justify-between w-full">
                            <div className="font-medium text-sm my-auto">{entry.title ?? "No title"}</div>
                            {entry.method && (
                                <div className="text-[#85B7EB] bg-[#1E3A4A] rounded-full py-1 px-2 text-sm font-medium shrink-0 ml-2 h-fit">
                                    {METHOD_LABELS[entry.method.replace(/^'|'$/g, "")] ?? entry.method.replace(/^'|'$/g, "")}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}