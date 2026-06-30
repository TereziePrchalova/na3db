import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/app-layout.tsx", [
        index("routes/structure-query.tsx"),
        route("questions", "routes/questions.tsx"),
        route("report", "routes/report.tsx"),
    ]),
    route("api/search", "routes/api/api.search.ts"),
    route("api/report", "routes/api/api.report.ts")
] satisfies RouteConfig;
