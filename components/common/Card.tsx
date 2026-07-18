import React, { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  roundness?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  visualHover?: boolean;
  className?: string;
}

export function Card({
  children,
  roundness = "4xl",
  visualHover = false,
  className,
  ...props
}: CardProps) {
  const roundnessClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    "4xl": "rounded-4xl",
  };

  return (
    <div
      className={cn(
        "bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-900/5 dark:border-zinc-100/5",
        "backdrop-blur-xl shadow-xl transition-all duration-500 group relative flex flex-col",
        roundnessClasses[roundness],
        visualHover && "hover:shadow-2xl hover:scale-105 hover:shadow-zinc-900/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  hasBorder?: boolean;
  className?: string;
}

export function CardHeader({
  children,
  title,
  subtitle,
  hasBorder = false,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "p-6 flex items-start justify-between relative gap-4",
        hasBorder && "border-b border-bluegray-800 dark:border-redgray-200",
        className
      )}
      {...props}
    >
      {children ? (
        children
      ) : (
        <div className="text-left space-y-1 min-w-0">
          {title && (
            <h3 className="text-4xl font-star text-black dark:text-white truncate leading-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[10px] uppercase tracking-widest font-bold text-bluegray-900 dark:text-redgray-100 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div className={cn("p-6 flex-1 text-left", className)} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hasBorder?: boolean;
  className?: string;
}

export function CardFooter({
  children,
  hasBorder = false,
  className,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn(
        "p-6 sm:p-8 mt-auto flex items-center justify-between text-left",
        hasBorder && "border-t border-bluegray-800 dark:border-redgray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
