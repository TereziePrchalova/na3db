import { Outlet } from "react-router"
import { useState } from "react";
import Sidebar from "~/components/Sidebar"

export default function AppLayout() {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    return (
        <div className="flex h-screen w-screen">
            <Sidebar />
            <Outlet/>
        </div>
    )
}