import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  ping?: boolean;
  pingColorClassName?: string;
  bgClassName?: string;
  textClassName?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  icon,
  ping = false,
  pingColorClassName = "bg-red dark:bg-blue",
  bgClassName = "bg-blue dark:bg-red",
  textClassName = "text-black dark:text-white",
  className = "",
}) => {
  return (
    <div
      className={`inline-flex items-center space-x-2 border border-bluegray-200 dark:border-redgray-800 px-2.5 py-1 rounded text-[10px] font-haas uppercase tracking-wider select-none w-fit transition-colors duration-300 ${bgClassName} ${textClassName} ${className}`}
    >
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
