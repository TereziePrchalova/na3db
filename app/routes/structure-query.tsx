import CategoryWrapper from "~/components/CategoryWrapper";
import FormInput from "~/components/FormInput";
import SectionWrapper from "~/components/SectionWrapper";

export default function StructureQuery() {
    return (
        <SectionWrapper title="Structure query">
            <CategoryWrapper title="Demographics" color="#378ADD">
                <FormInput label="Entry ID" />
                <FormInput label="Author name" />
            </CategoryWrapper>
        </SectionWrapper>
    )
}