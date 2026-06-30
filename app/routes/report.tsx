import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import CategoryWrapper from "~/components/CategoryWrapper";
import SectionWrapper from "~/components/SectionWrapper";
import CheckboxInput from "~/components/CheckboxInput";

type ReportFormValues = Record<string, boolean>;

export default function Report() {
    const { register, handleSubmit } = useForm<ReportFormValues>();
    const [searchParams] = useSearchParams();

    function onSubmit(data: ReportFormValues) {
        const fields = Object.entries(data)
            .filter(([, checked]) => checked)
            .map(([field]) => field);

        const params = new URLSearchParams(searchParams);
        params.set("fields", fields.join(","));
        window.location.href = `/api/report?${params.toString()}`;
    }

    return (
        <SectionWrapper title="Report" footer={{ label: "Export to CSV", onClick: handleSubmit(onSubmit) }}>
            <CategoryWrapper title="Demographics" color="#378ADD">
                <CheckboxInput
                    label="Entry ID"
                    registration={register("pdbId")}
                />
                <CheckboxInput
                    label="Author name"
                    registration={register("author")}
                />
                <CheckboxInput
                    label="Experimental method"
                    registration={register("experimentalMethod")}
                />
            </CategoryWrapper>

            <CategoryWrapper title="3D Features" color="#1D9E75">
                <CheckboxInput
                    label="Overall confal score"
                    registration={register("confalScore")}
                />
                <div className="hidden">
                    <CheckboxInput
                        label="Helix length"
                        registration={register("helixLength")}
                    />
                </div>
                <CheckboxInput
                    label="Assigned ntc"
                    registration={register("assignedNtc")}
                />
            </CategoryWrapper>

            <CategoryWrapper title="Structure Components" color="#BA7517">
                <CheckboxInput
                    label="Entity name"
                    registration={register("entityName")}
                />
                <CheckboxInput
                    label="Source organism"
                    registration={register("sourceOrganism")}
                />
                <CheckboxInput
                    label="Polymer type"
                    registration={register("polymerType")}    
                />
                <CheckboxInput
                    label="Monomer standard flag"
                    registration={register("monomerFlag")}
                />
            </CategoryWrapper>
        </SectionWrapper>
    )
}