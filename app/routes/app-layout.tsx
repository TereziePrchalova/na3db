import { Outlet } from "react-router"
import Sidebar from "~/components/Sidebar"
import Results from "~/components/Results";
import { useStructureSearch } from "~/hooks/useStructureSearch";

export default function AppLayout() {
    const { results } = useStructureSearch();

    return (
        <div className="flex h-screen w-screen">
            <Sidebar />
            <Outlet />
            <div className="hidden w-full h-full lg:block">
                <Results results={results} />
            </div>
        </div>
    )
}