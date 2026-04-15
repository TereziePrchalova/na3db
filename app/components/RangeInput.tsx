import { useState } from "react";
import FormInput from "./FormInput";

type RangeInputProps = {
    label: string
}

export default function RangeInput({ label }: RangeInputProps) {
    const [min, setMin] = useState("");
    const [max, setMax] = useState("");

    return (
        <div className="w-full">
            <div className="font-medium text-xs mb-1 pl-1">
                {label}
            </div>
            <div className="flex justify-between">
                <FormInput
                    placeholder="min"
                    value={min}
                    setValue={setMin}
                />
                <div className="h-0.5 bg-[#C4C4BE] w-2 shrink-0 rounded-full my-auto mx-4 mb-8" />   
                <FormInput
                    placeholder="max"
                    value={max}
                    setValue={setMax}
                />
            </div>
        </div>
    )
} 