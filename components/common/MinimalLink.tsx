import React from "react";
import Link from "next/link";
import { MoveRight } from "lucide-react";

interface MinimalLinkProps {
    children?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    label?: string;
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
    const defaultIcon = <MoveRight size={14} className="icon-altalenante inline-block" />;

    // Wrap custom icons in a span that carries the animation class
    const animClass = iconPosition === 'left' ? 'icon-altalenante-reverse translate-x-0' : 'icon-altalenante translate-x-0';
    const displayIcon = icon
        ? <span className={animClass + ' inline-block'}>{icon}</span>
        : defaultIcon;

    return (
        <Link
            href={href}
            className={`group inline-flex flex-row items-center gap-1.5 font-haas text-xs font-bold uppercase tracking-wider transition-colors ${className}`}
        >
            {iconPosition === 'left' && displayIcon}
            {children || label}
            {iconPosition === 'right' && displayIcon}
        </Link>
    );
};

export default MinimalLink;
