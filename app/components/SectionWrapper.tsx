import type { ReactNode } from "react";

type SectionWrapperProps = {
  title: string;
  children?: ReactNode;
  footer?: {
    label: string;
    onClick: () => void;
  }
};

export default function SectionWrapper({ title, children, footer}: SectionWrapperProps) {
  return (
    <div className="h-full w-full shrink-0 flex flex-col bg-bg-secondary sm:w-112.5">
      <div className="h-15 border-b border-b-[#3D3D39]">
        <h1 className="ml-6 flex h-full items-center text-base font-semibold">
          {title}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      {footer && (
        <div className="p-4 border-t border-t-[#3D3D39]">
          <button
            className="w-full py-2 border border-[#4A4A46] rounded-[5px] text-xs text-[#C4C4BE] uppercase cursor-pointer"
            onClick={footer.onClick}
            type="button"
          >
            {footer.label}
          </button>
        </div>
      )}
    </div>
  );
}