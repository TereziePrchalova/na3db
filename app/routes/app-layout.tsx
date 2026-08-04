import { Outlet } from "react-router";
import Sidebar from "~/components/Sidebar";
import Results from "~/components/Results";
import { useStructureSearch } from "~/hooks/useStructureSearch";

export default function AppLayout() {
    const { results, total, page, pageSize, setPage } = useStructureSearch();

    return (
        <div className="flex h-screen w-screen">
            <div className="app-chrome shrink-0">
                <Sidebar />
            </div>
            <div className="flex-1 h-full">
                <Outlet />
            </div>
            <div className="hidden flex-1 h-full lg:block app-chrome">
                <Results results={results} total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
            </div>
        </div>
    )
}