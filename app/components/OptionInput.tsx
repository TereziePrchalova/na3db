
type Option = {
    label: string;
    value: string;
};

type OptionInputProps = {
    label?: string;
    options: Option[];
}

export default function OptionInput({ label, options }: OptionInputProps) {
    return (
        <div className="mb-4">
            <div className="font-medium text-xs mb-1 pl-1">
                {label}
            </div>

            <div className="flex flex-wrap">
                {options.map((opt) => (
                    <button className="rounded-full border border-[#4A4A46] px-3 py-1 text-xs bg-transparent mr-1 mb-1 transition-colors">
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    )
}