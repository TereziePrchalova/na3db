type FormInputProps = {
    label: string;
    placeholder?: string;
};

export default function FormInput({ label, placeholder }: FormInputProps) {
    return (
        <div className="mb-4">
            <div className="font-medium text-xs mb-1 pl-1">
                {label}
            </div>
            <input
                placeholder={placeholder}
                className="bg-transparent border border-[#4A4A46] p-2 rounded-[5px] w-full text-xs"
            />
        </div>
    );
}