import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MoorhenViewer from "~/components/MoorhenViewer";

const pdbId = new URLSearchParams(window.location.search).get("pdbId");

if (!pdbId) {
    throw new Error("Missing required 'pdbId' query parameter");
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <MoorhenViewer pdbId={pdbId} />
    </StrictMode>
);
