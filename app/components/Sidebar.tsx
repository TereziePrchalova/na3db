import SidebarItem from "./SidebarItem"
import { Link } from "react-router"

export default function Sidebar() {
    return (
        <div className="w-15 h-screen bg-bg-secondary flex flex-col justify-between border-r border-r-[#3D3D39]">
            <div>
                <Link
                    to="/"
                    className="h-15 flex items-center justify-center transition-all hover:bg-[#3D3D39] border-b border-b-[#3D3D39]"
                >
                    <img src="/logo_ibt.svg" alt="IBT logo" className="w-8 h-auto"/>
                </Link>
                <SidebarItem src="/search.svg" alt="Search" to="/"/>
                <SidebarItem src="/Q.png" alt="Questions" width="w-5" to="/questions"/>
                <SidebarItem src="/report.svg" alt="Report" to="/report"/>
            </div>

            <div className="vertical-text font-extrabold tracking-widest text-3xl my-auto mb-4">
                NA3DB
            </div>
        </div>
    )
}