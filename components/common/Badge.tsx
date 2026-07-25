import React from "react";


type BadgeVariant =
  | "standard"
  | "monochrome"
  | "warm"
  | "success"
  | "danger"
  | "outline";


interface BadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  ping?: boolean;
  pingColorClassName?: string;
  textClassName?: string;
  className?: string;
  variant?: BadgeVariant;
  roundness?: "none" | "sm" | "md" | "lg" | "full";
  hoverZoom?: Boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  icon,
  ping = false,
  pingColorClassName = "bg-red dark:bg-blue",
  textClassName = "",
  className = "",
  variant = "standard",
  roundness = "sm",
  hoverZoom = false,
}) => {
  const base = "w-fit px-2.5 py-1 inline-flex items-center space-x-2 " +
    "text-[10px] font-haas uppercase tracking-wider select-none transition-colors duration-300"

  const roundnessStyles = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const variants: Record<BadgeVariant, string> = {
    standard: "bg-blue dark:bg-red text-black dark:text-white",
    monochrome: "bg-black dark:bg-white border-white dark:border-black text-white dark:text-black",
    success: "bg-green-500/10 text-green-500",
    danger: "bg-red-500/10 text-red-500",
    warm: "bg-ocragray-200 text-black dark:bg-ocragray-800 dark:text-white",
    outline: "bg-transparent backdrop-blur-md border-black dark:border-white text-black dark:text-white",
  };

  const hoverZoomClasses = hoverZoom ? "hover:scale-105 transition-transform" : "";

  const mergedClassnames = `${base} ${variants[variant]} ${roundnessStyles[roundness]} ${textClassName} ${className} ${hoverZoomClasses}`;

  return (
    <div className={mergedClassnames}>
      {ping && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColorClassName}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pingColorClassName}`}></span>
        </span>
      )}

      {icon && <span className="flex items-center justify-center">{icon}</span>}

      <span>{children}</span>
    </div>
  );
};

export default Badge;
