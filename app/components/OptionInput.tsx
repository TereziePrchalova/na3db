import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

type Option = {
    label: string;
    value: string;
};

type OptionInputProps<T extends FieldValues> = {
    label?: string;
    options: Option[];
    name: Path<T>;
    control: Control<T>;
}

export default function OptionInput<T extends FieldValues>({ label, options, name, control }: OptionInputProps<T>) {
    return (
        <Controller
            name={name}
            control={control}
            render={({field}) => (
                <div className="mb-4">
                    <div className="font-medium text-xs mb-1 pl-1">
                        {label}
                    </div>
                    <div className="flex flex-wrap">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`${((field.value ?? []) as string[]).includes(opt.value) ? "bg-[#085041] text-[#9FE1CB] border-[#085041]" : "bg-transparent border-[#4A4A46]"} rounded-full border px-3 py-1 text-xs mr-1 mb-1 transition-colors`}
                                onClick={() => {
                                    const current: string[] = field.value ?? [];
                                    const next = current.includes(opt.value)
                                        ? current.filter(v => v !== opt.value)
                                        : [...current, opt.value]
                                    field.onChange(next)
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        />
    )
}