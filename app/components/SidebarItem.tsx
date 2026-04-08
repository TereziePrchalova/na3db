import { NavLink } from "react-router";

type SidebarItemProps = {
    src: string;
    alt: string;
    to: string;
    width?: string;
}

export default function SidebarItem({ src, alt, to, width = "w-6" }: SidebarItemProps) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `${isActive ? "bg-[#3D3D39]" : "hover:bg-[#3D3D39]"} h-15 flex items-center justify-center transition-all border-b border-b-[#3D3D39]`}
        >
            <img src={src} alt={alt} className={`${width} h-auto`} />
        </NavLink>
    )
}