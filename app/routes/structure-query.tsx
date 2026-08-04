import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import CategoryWrapper from "~/components/CategoryWrapper";
import FormInput from "~/components/FormInput";
import OptionInput from "~/components/OptionInput";
import RangeInput from "~/components/RangeInput";
import SectionWrapper from "~/components/SectionWrapper";
import { FILTER_KEYS } from "~/lib/constants";

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
    polymerType: string[];
    monomerFlag: string[];
}

export default function StructureQuery() {
    const { register, handleSubmit, control } = useForm<SearchFormValues>();
    const [, setSearchParams] = useSearchParams();
    
    function onSubmit(data: SearchFormValues) {
        setSearchParams(() => {
            const p = new URLSearchParams();
            for (const key of FILTER_KEYS) {
                const value = data[key];
                const str = Array.isArray(value) ? value.join(",") : value;
                if (str) p.set(key, str);
            }
            return p;
        })
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