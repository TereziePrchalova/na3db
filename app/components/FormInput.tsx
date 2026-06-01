import type { UseFormRegister } from "react-hook-form";

type FormInputProps = {
    label?: string;
    type?: string;
    placeholder?: string;
    registration?: ReturnType<UseFormRegister<any>>;
};

export default function FormInput({ label, placeholder, type, registration }: FormInputProps) {
    return (
        <div className="mb-4 w-full">
            <div className="font-medium text-xs mb-1 pl-1">
                {label}
            </div>
            <input
                className="bg-transparent border border-[#4A4A46] p-2 rounded-[5px] w-full text-xs"
                type={type || "text"}
                placeholder={placeholder}
                {...registration}
            />
        </div>
    );
}