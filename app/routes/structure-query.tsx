import { useState } from "react";
import CategoryWrapper from "~/components/CategoryWrapper";
import FormInput from "~/components/FormInput";
import OptionInput from "~/components/OptionInput";
import RangeInput from "~/components/RangeInput";
import SectionWrapper from "~/components/SectionWrapper";
import { useStructureSearch } from "~/hooks/useStructureSearch";

export default function StructureQuery() {
    const { setSearchParams } = useStructureSearch();
    const [pdbIdInput, setPdbIdInput] = useState("");
    const [authorInput, setAuthorInput] = useState("");
    const [assignedNtc, setAssignedNtc] = useState("");
    const [entityName, setEntityName] = useState("");
    const [sourceOrganism, setSourceOrganism] = useState("");
    const [nonStandardResidue, setNonStandardResidue] = useState("");

    function handleSearch() {
        setSearchParams((p: URLSearchParams) => {
            p.set("pdbId", pdbIdInput);
            p.set("author", authorInput);
            return p;
        });
    }

    return (
        <SectionWrapper title="Structure query">
            <CategoryWrapper title="Demographics" color="#378ADD">
                <FormInput
                    label="Entry ID"
                    value={pdbIdInput}
                    setValue={setPdbIdInput}
                />
                <FormInput
                    label="Author name"
                    value={authorInput}
                    setValue={setAuthorInput}
                />

                <OptionInput
                    label="Experimental method"
                    options={[
                        {value: "any", label: "Any"},
                        {value: "X-RAY DIFFRACTION", label: "X-ray"},
                        { value: "ELECTRON MICROSCOPY", label: "EM" },
                        { value: "SOLID-STATE NMR", label: "Solid NMR" },
                        { value: "SOLUTION NMR", label: "NMR" },
                        { value: "NEUTRON DIFFRACTION", label: "Neutron" },
                        { value: "ELECTRON CRYSTALLOGRAPHY", label: "Electron cryst." },
                        { value: "POWDER DIFFRACTION", label: "Powder" },
                        { value: "FIBER DIFFRACTION", label: "Fiber" },
                        { value: "SOLUTION SCATTERING", label: "Scattering" },
                        { value: "EPR", label: "EPR" },
                        { value: "FLUORESCENCE TRANSFER", label: "FRET" },
                        { value: "INFRARED SPECTROSCOPY", label: "IR" },
                        { value: "THEORETICAL MODEL", label: "Model" },
                    ]}
                />
            </CategoryWrapper>

            <CategoryWrapper title="3D Features" color="#1D9E75">
                <RangeInput
                    label="Confal score"
                />
                <RangeInput
                    label="Helix length"
                />
                <FormInput
                    label="Assigned ntc"
                    value={assignedNtc}
                    setValue={setAssignedNtc}
                />
            </CategoryWrapper>

            <CategoryWrapper title="Structure Components" color="#BA7517">
                <FormInput
                    label="Entity name"
                    value={entityName}
                    setValue={setEntityName}
                />
                <FormInput
                    label="Source organism"
                    value={sourceOrganism}
                    setValue={setSourceOrganism}
                />
                <FormInput
                    label="Non-standard residue"
                    value={nonStandardResidue}
                    setValue={setNonStandardResidue}
                />
                <OptionInput
                    label="Polymer type"
                    options={[
                        { value: "any", label: "Any"},
                        { value: "Nucleic acid", label: "Nucleic acid"},
                        { value: "Oligosaccharide", label: "Oligosaccharide" },
                        { value: "Protein", label: "Protein" },
                        { value: "Protein/NA", label: "Protein/NA" },
                        { value: "Protein/Oligosaccharide", label: "Protein/Oligosaccharide" },
                        { value: "Other", label: "Other" },
                    ]}
                />
                <OptionInput
                    label="Monomer standard flag"
                    options={[
                        { value: "any", label: "Any"},
                        { value: "Standard", label: "Standard"},
                        { value: "Non-Standard", label: "Non-Standard" },
                    ]}
                />
            </CategoryWrapper>
            <div className="m-4">
                <button
                    className="w-full py-2 border border-[#4A4A46] rounded-[5px] text-xs text-[#C4C4BE] uppercase"
                    onClick={handleSearch}
                >
                    Search
                </button>
            </div>
        </SectionWrapper>
    )
}