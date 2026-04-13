import { Outlet, useLoaderData } from "react-router"
import { useState } from "react";
import Sidebar from "~/components/Sidebar"
import Results from "~/components/Results";
import { getEntries } from "~/lib/entries.server";

export async function loader() {
  const entries = await getEntries();
  return { entries };
}


export default function AppLayout() {
    const { entries } = useLoaderData<typeof loader>();
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    return (
        <div className="flex h-screen w-screen">
            <Sidebar />
            <Outlet/>
            <div className="hidden w-full h-full lg:block">
                <Results entries={entries} />
            </div>
        </div>
    )
}