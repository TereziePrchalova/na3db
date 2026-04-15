type FormInputProps = {
    label?: string;
    type?: string;
    placeholder?: string;
    value: string;
    setValue: (value: string) => void;
};

export default function FormInput({ label, placeholder, value ,setValue, type }: FormInputProps) {
    return (
        <div className="mb-4 w-full">
            <div className="font-medium text-xs mb-1 pl-1">
                {label}
            </div>
            <input
                className="bg-transparent border border-[#4A4A46] p-2 rounded-[5px] w-full text-xs"
                type={type || "text"}
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
}