import { useState, type ReactNode } from "react";

type CategoryWrapperProps = {
  title: string;
  children?: ReactNode;
  color: string;
};

export default function CategoryWrapper({ title, children, color }: CategoryWrapperProps) {
    const [isCategoryOpen, setIsCategoryOpen] = useState(true);

    return (
        <div className="border-b border-b-[#3D3D39]">
            <div
                className="flex justify-between h-14.75 px-6 items-center cursor-pointer select-none"
                onClick={() => setIsCategoryOpen((state) => !state)}
            >
                <div className="flex">
                    <div
                        className="rounded-full w-2 h-2 m-auto mr-2"
                        style={{ backgroundColor: color }}
                    />
                    <h2 className="font-medium text-sm">
                        {title}
                    </h2>
                </div>
                <div>
                    <img
                        className={`w-6 h-auto transition-transform -rotate-90 ${isCategoryOpen ? "rotate-0" : ""}`}
                        src="/arrow.svg"
                        alt="arrow"
                    />
                </div>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isCategoryOpen ? "max-h-auto" : "max-h-0"}`}>
                <div className="p-6 pt-4 text-[#C4C4BE]">
                    {children}
                </div>
            </div>
        </div>
    )
}