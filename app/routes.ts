import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/app-layout.tsx", [
        index("routes/structure-query.tsx"),
        route("questions", "routes/questions.tsx"),
        route("report", "routes/report.tsx"),
    ]),
    route("api/entries", "routes/api/api.entries.ts"),
    route("api/search", "routes/api/api.search.ts")
] satisfies RouteConfig;
