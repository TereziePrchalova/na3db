import type { UseFormRegister } from "react-hook-form";

type CheckboxInputProps = {
    label?: string;
    registration?: ReturnType<UseFormRegister<any>>;
};

export default function CheckboxInput({ label, registration }: CheckboxInputProps) {
    return (
        <label className="flex items-center gap-3 mb-3 cursor-pointer select-none">
            <input type="checkbox" className="peer hidden" {...registration} />
            <span className="w-6 h-6 shrink-0 rounded-[5px] border border-[#4A4A46] flex items-center justify-center transition-colors peer-checked:bg-[#085041] peer-checked:border-[#085041] peer-checked:[&>svg]:opacity-100">
                <svg
                    className="opacity-0 transition-opacity"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9FE1CB"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M5 13l4 4L19 7" />
                </svg>
            </span>
            <span className="text-xs font-medium text-[#85858A] peer-checked:text-[#C4C4BE] transition-colors">
                {label}
            </span>
        </label>
    );
}
