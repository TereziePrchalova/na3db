import { useParams } from "react-router";

export default function Entry() {
    const { pdbId } = useParams();
    return (
        <iframe
            src={`/moorhen-embed/index.html?pdbId=${encodeURIComponent(pdbId!)}`}
            title="Moorhen 3D structure viewer"
            className="w-full h-full border-0"
        />
    )
}