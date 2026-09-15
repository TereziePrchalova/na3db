import { Outlet, useMatches } from "react-router";
import Sidebar from "~/components/Sidebar";
import Results from "~/components/Results";
import { useStructureSearch } from "~/hooks/useStructureSearch";

type RouteHandle = { fullWidth?: boolean };

export default function AppLayout() {
    const { results, total, page, pageSize, setPage } = useStructureSearch();
    const matches = useMatches();
    const fullWidth = matches.some((match) => (match.handle as RouteHandle | undefined)?.fullWidth);

    return (
        <div className="flex h-screen w-screen">
            <div className="app-chrome shrink-0">
                <Sidebar />
            </div>
            <div className={`${fullWidth ? "flex-1" : ""} h-full relative top-0 left-0 transition-all`}>
                <Outlet />
            </div>
            <div className="hidden flex-1 h-full lg:block app-chrome">
                <Results results={results} total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
            </div>
        </div>
    )
}