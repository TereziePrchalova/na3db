import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import moorhen from "moorhen";
const { MoorhenReduxStore, MoorhenContainer, MoorhenMolecule, addMolecule } = moorhen;

declare global {
    interface Window {
        cootModule?: unknown;
        CCP4Module?: unknown;
        createCoot64Module?: (opts: Record<string, unknown>) => Promise<unknown>;
        createCootModule?: (opts: Record<string, unknown>) => Promise<unknown>;
    }
}

function loadScript(src: string) {
    return new Promise<string>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(src);
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

export default function MoorhenViewer({ pdbId }: { pdbId: string }) {
    const [moduleReady, setModuleReady] = useState(false);
    const [cootReady, setCootReady] = useState(false);
    const glRef = useRef<any>(null);
    const commandCentre = useRef<any>(null);
    const moleculesRef = useRef<any>(null);
    const mapsRef = useRef<any>(null);
    const activeMapRef = useRef<any>(null);
    const timeCapsuleRef = useRef<any>(null);
    const videoRecorderRef = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const currentMoleculeRef = useRef<any>(null);
    const monomerLibraryPath = "https://raw.githubusercontent.com/MonomerLibrary/monomers/master";

    useEffect(() => {
        if (window.cootModule) {
            setModuleReady(true);
            return;
        }

        // @ts-expect-error -- shim required before any WASM module loads
        if (!crossOriginIsolated) window.SharedArrayBuffer = ArrayBuffer;

        const onReady = () => setModuleReady(true);
        document.addEventListener("cootModuleAttached", onReady);

        const memory64 = WebAssembly.validate(
            new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 5, 3, 1, 4, 1])
        );

        const attach = (mod: unknown) => {
            window.cootModule = mod;
            window.CCP4Module = mod;
            document.dispatchEvent(new CustomEvent("cootModuleAttached"));
        };

        const load32 = () =>
            loadScript("/moorhen.js").then(() =>
                window.createCootModule!({
                    print: (t: string) => console.log(t),
                    printErr: (t: string) => console.error(t),
                }).then(attach)
            );

        if (memory64) {
            loadScript("/moorhen64.js")
                .then(() =>
                    window.createCoot64Module!({
                        print: (t: string) => console.log(t),
                        printErr: (t: string) => console.error(t),
                    }).then(attach)
                )
                .catch((err) => {
                    console.error("64-bit Coot module failed, falling back to 32-bit", err);
                    return load32();
                });
        } else {
            load32();
        }

        return () => document.removeEventListener("cootModuleAttached", onReady);
    }, []);

    // Runs once: waits for the Coot worker to boot up.
    useEffect(() => {
        if (!moduleReady) return;

        const waitForCommandCentre = setInterval(() => {
            if (!commandCentre.current) return;
            clearInterval(waitForCommandCentre);

            const previousOnCootInitialized = commandCentre.current.onCootInitialized;
            commandCentre.current.onCootInitialized = async () => {
                await previousOnCootInitialized?.();
                setCootReady(true);
            };
        }, 200);

        return () => clearInterval(waitForCommandCentre);
    }, [moduleReady]);

    // Runs whenever pdbId changes (once Coot is booted): swaps in the new structure.
    useEffect(() => {
        if (!cootReady) return;

        let cancelled = false;

        (async () => {
            if (currentMoleculeRef.current) {
                await currentMoleculeRef.current.delete();
                currentMoleculeRef.current = null;
            }

            const molecule = new MoorhenMolecule(commandCentre, glRef, MoorhenReduxStore, monomerLibraryPath);
            await molecule.loadToCootFromURL(
                `https://files.rcsb.org/download/${pdbId}.cif`,
                pdbId
            );
            if (cancelled) return;

            await molecule.fetchIfDirtyAndDraw("CBs");
            await molecule.centreOn("/*/*/*/*", true);
            MoorhenReduxStore.dispatch(addMolecule(molecule));
            currentMoleculeRef.current = molecule;
        })();

        return () => {
            cancelled = true;
        };
    }, [cootReady, pdbId]);

    if (!moduleReady) return <div>Loading Moorhen...</div>

    return (
        <Provider store={MoorhenReduxStore}>
            <div
                ref={wrapperRef}
                className="moorhen-scope"
                style={{ width: "100%", height: "100%", transform: "translateZ(0)" }}
            >
                <MoorhenContainer
                    glRef={glRef}
                    commandCentre={commandCentre}
                    moleculesRef={moleculesRef}
                    mapsRef={mapsRef}
                    activeMapRef={activeMapRef}
                    timeCapsuleRef={timeCapsuleRef}
                    videoRecorderRef={videoRecorderRef}
                    monomerLibraryPath={monomerLibraryPath}
                    setMoorhenDimensions={() => [
                        wrapperRef.current?.clientWidth ?? window.innerWidth,
                        wrapperRef.current?.clientHeight ?? window.innerHeight,
                    ]}
                />
            </div>
        </Provider>
    );
}