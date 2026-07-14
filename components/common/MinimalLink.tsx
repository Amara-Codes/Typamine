import React from "react";
import Link from "next/link";
import { MoveRight } from "lucide-react";
interface MinimalLinkProps {
    children?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    label: string;
    href: string;
}

export const MinimalLink: React.FC<MinimalLinkProps> = ({
    children,
    className = "",
    icon,
    iconPosition = 'right',
    label,
    href,
}) => {
    const displayIcon = icon || <MoveRight size={12} className="icon-altalenante" />;

    return (
        <Link href={href} className={`group flex flex-row items-center gap-2 font-haas text-[10px] transition-colors ${className}`}>
            {iconPosition === 'left' && displayIcon}
            {children || label}
            {iconPosition === 'right' && displayIcon}
        </Link>
    );
};

export default MinimalLink;
