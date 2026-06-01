import type { UseFormRegister } from "react-hook-form";
import FormInput from "./FormInput";

type RangeInputProps = {
    label: string;
    registrationMin?: ReturnType<UseFormRegister<any>>;
    registrationMax?: ReturnType<UseFormRegister<any>>;
}

export default function RangeInput({ label, registrationMin, registrationMax }: RangeInputProps) {

    return (
        <div className="w-full">
            <div className="font-medium text-xs mb-1 pl-1">
                {label}
            </div>
            <div className="flex justify-between">
                <FormInput
                    placeholder="min"
                    registration={registrationMin}
                />
                <div className="h-0.5 bg-[#C4C4BE] w-2 shrink-0 rounded-full my-auto mx-4 mb-8" />   
                <FormInput
                    placeholder="max"
                    registration={registrationMax}
                />
            </div>
        </div>
    )
} 