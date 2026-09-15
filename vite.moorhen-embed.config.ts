import { defineConfig } from "vite";

// Builds the Moorhen 3D viewer as a fully standalone page - its own HTML
// document, its own JS bundle, no import of the main app's app.css or
// root.tsx layout. It's embedded via an <iframe>, not rendered inside the
// main app's React tree, so Moorhen's own injected stylesheets and
// document.body-portaled UI (MUI dropdowns/panels) stay inside its own
// document and can never leak into or inherit from the main app - the exact
// class of bug the old .moorhen-scope CSS scoping was built to chase.
export default defineConfig({
  root: "app/moorhen-embed",
  base: "/moorhen-embed/",
  resolve: { tsconfigPaths: true },
  build: {
    target: "esnext",
    outDir: "../../public/moorhen-embed",
    emptyOutDir: true,
  },
});
