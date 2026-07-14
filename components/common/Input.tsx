import React from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  codePrefix?: string;
  error?: string;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  labelClassName?: string;
  onChange?: (val: string) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  codePrefix,
  error,
  className = "",
  type = "text",
  leftIcon,
  rightIcon,
  labelClassName = "",
  onChange,
  ...props
}) => {
  return (
    <div className="space-y-1.5 font-haas text-xs w-full">
      {label && (
        <div className={`flex justify-between items-center select-none ${labelClassName}`}>
          <label className="text-[10px] text-zinc-900 dark:text-white uppercase tracking-wider">
            {codePrefix && <span className="text-[#ff3131] mr-1">{codePrefix}</span>}
            {label}
          </label>
        </div>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={`w-full bg-zinc-900/40 dark:bg-zinc-900/60 border border-zinc-300 dark:border-zinc-800 focus:border-blue dark:focus:border-red rounded-lg px-3 py-2 text-foreground outline-none transition-colors ${
            error ? "border-red-500 focus:border-red-500 dark:focus:border-red-500" : ""
          } ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${className}`}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && <span className="text-[10px] text-red-500 block">{error}</span>}
    </div>
  );
};
