import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "themeResponsive";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  fullWidth?: boolean;
  roundness?: "none" | "sm" | "md" | "lg" | "full" | "xl";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  glow = false,
  fullWidth = false,
  roundness,
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-haas text-xs font-bold uppercase border transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-[10px]",
    md: "px-4 py-2 text-xs",
    lg: "px-6 py-3 text-sm",
  };

  const variantStyles = {
    primary: `bg-red hover:bg-red/80 text-black border-red ${
      glow ? "glow-red" : ""
    }`,
    secondary: `bg-blue hover:bg-blue/80 text-black border-blue ${
      glow ? "glow-cyan" : ""
    }`,

    themeResponsive: `text-black bg-blue hover:bg-blue/80 border-blue dark:bg-red dark:hover:bg-red/80 dark:border-red ${
      glow ? "glow-cyan dark:glow-red" : ""
    }`,
    outline: "bg-transparent text-foreground border-foreground hover:text-white hover:border-white hover:bg-zinc-800/40",
    ghost: "bg-transparent text-zinc-500 hover:text-foreground border-transparent hover:bg-zinc-800/20",
  };

  const roundnessStyles = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  const currentRoundness = roundness ? roundnessStyles[roundness] : "rounded";

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${currentRoundness} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
