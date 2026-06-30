import { useForm } from "react-hook-form";
import CategoryWrapper from "~/components/CategoryWrapper";
import FormInput from "~/components/FormInput";
import OptionInput from "~/components/OptionInput";
import RangeInput from "~/components/RangeInput";
import SectionWrapper from "~/components/SectionWrapper";
import { useStructureSearch } from "~/hooks/useStructureSearch";

type SearchFormValues = {
    pdbId: string;
    author: string;
    assignedNtc: string;
    entityName: string;
    sourceOrganism: string;
    nonStandardResidue: string;
    experimentalMethod: string[];
    confalScoreMin: string;
    confalScoreMax: string;
    helixLengthMin: string;
    helixLengthMax: string;
    polymerType: string[];
    monomerFlag: string[];
}

export default function StructureQuery() {
    const { register, handleSubmit, control } = useForm<SearchFormValues>();
    const { setSearchParams } = useStructureSearch();
    
    function onSubmit(data: SearchFormValues) {
        setSearchParams(() => {
            const p = new URLSearchParams();
            if (data.pdbId)              p.set("pdbId",              data.pdbId);
            if (data.author)             p.set("author",             data.author);
            if (data.experimentalMethod?.length) p.set("experimentalMethod", data.experimentalMethod.join(","));
            if (data.entityName)         p.set("entityName",         data.entityName);
            if (data.sourceOrganism)     p.set("sourceOrganism",     data.sourceOrganism);
            if (data.nonStandardResidue) p.set("nonStandardResidue", data.nonStandardResidue);
            if (data.assignedNtc)        p.set("assignedNtc",        data.assignedNtc);
            if (data.confalScoreMin)     p.set("confalScoreMin",     data.confalScoreMin);
            if (data.confalScoreMax)     p.set("confalScoreMax",     data.confalScoreMax);
            if (data.helixLengthMin)     p.set("helixLengthMin",     data.helixLengthMin);
            if (data.helixLengthMax)     p.set("helixLengthMax",     data.helixLengthMax);
            if (data.polymerType?.length)        p.set("polymerType",        data.polymerType.join(","));
            if (data.monomerFlag?.length)        p.set("monomerFlag",        data.monomerFlag.join(","));
            return p;
        });
    }

    return (
        <SectionWrapper title="Structure query" footer={{ label: "Search", onClick: handleSubmit(onSubmit) }}>
            <CategoryWrapper title="Demographics" color="#378ADD">
                <FormInput
                    label="Entry ID"
                    registration={register("pdbId")}
                />
                <FormInput
                    label="Author name"
                    registration={register("author")}
                />

                <OptionInput
                    label="Experimental method"
                    name="experimentalMethod"
                    control={control}
                    options={[
                        { value: "any", label: "Any" },
                        { value: "X-RAY DIFFRACTION", label: "X-ray" },
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
                    registrationMin={register("confalScoreMin")}
                    registrationMax={register("confalScoreMax")}
                />
                <div className="hidden">
                    <RangeInput
                        label="Helix length"
                        registrationMin={register("helixLengthMin")}
                        registrationMax={register("helixLengthMax")}
                    />
                </div>
                <FormInput
                    label="Assigned ntc"
                    registration={register("assignedNtc")}
                />
            </CategoryWrapper>

            <CategoryWrapper title="Structure Components" color="#BA7517">
                <FormInput
                    label="Entity name"
                    registration={register("entityName")}
                />
                <FormInput
                    label="Source organism"
                    registration={register("sourceOrganism")}
                />
                <FormInput
                    label="Non-standard residue"
                    registration={register("nonStandardResidue")}
                />
                <OptionInput
                    label="Polymer type"
                    name="polymerType"
                    control={control}
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
                    name="monomerFlag"
                    control={control}
                    options={[
                        { value: "Standard", label: "Standard"},
                        { value: "Non-Standard", label: "Non-Standard" },
                    ]}
                />
            </CategoryWrapper>
        </SectionWrapper>
    )
}