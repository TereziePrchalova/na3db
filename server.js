import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";

const app = express();

// Must cover every response, not just the SSR document: dedicated Workers
// (the Coot/Moorhen WASM pool) only get their own crossOriginIsolated status
// if the *worker script's own response* also carries these headers, not just
// the page that spawned them.
app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(compression());
app.disable("x-powered-by");

// Hashed filenames (e.g. build/client/assets/*) never change content, so they
// can be cached forever. Everything else under build/client is a raw copy of
// public/ (moorhen64.js, baby-gru/*, ...) and must stay revalidatable so a
// redeploy doesn't leave users stuck with a stale WASM build.
app.use(
  "/assets",
  express.static("build/client/assets", { immutable: true, maxAge: "1y" })
);
app.use(express.static("build/client", { maxAge: "1h" }));

app.all(
  "*",
  createRequestHandler({
    build: () => import("./build/server/index.js"),
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
