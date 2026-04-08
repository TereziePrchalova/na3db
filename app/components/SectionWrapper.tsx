import type { ReactNode } from "react";

type SectionWrapperProps = {
  title: string;
  children?: ReactNode;
};

export default function SectionWrapper({ title, children }: SectionWrapperProps) {
  return (
    <div className="h-full w-full bg-bg-secondary sm:w-112.5">
      <div className="h-15 border-b border-b-[#3D3D39]">
        <h1 className="ml-4 flex h-full items-center text-base font-semibold">
          {title}
        </h1>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}