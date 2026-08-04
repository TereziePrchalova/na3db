import { useParams } from "react-router";
import MoorhenViewer from "~/components/MoorhenViewer";

export default function Entry() {
    const { pdbId } = useParams();
    return (
        <div className="w-full h-full">
            <MoorhenViewer pdbId={pdbId!} />
        </div>
    )
}