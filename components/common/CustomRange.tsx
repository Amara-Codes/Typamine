import React, { useRef, useCallback } from "react";

interface CustomRangeProps {
    label?: string;
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
    // Personalizzazione visuale
    trackColor?: string; // Es: "bg-zinc-200 dark:bg-zinc-800"
    thumbColor?: string; // Es: "bg-blue dark:bg-red"
    textColor?: string;  // Es: "text-zinc-900 dark:text-white"
    glow?: boolean;
    showCurrentValue?: boolean;
    showMinMax?: boolean;
}

export const CustomRange: React.FC<CustomRangeProps> = ({
    label,
    min,
    max,
    step = 1,
    value,
    onChange,
    trackColor = "bg-zinc-200 dark:bg-zinc-800",
    thumbColor = "bg-blue dark:bg-red",
    textColor = "text-black dark:text-white",
    glow = false,
    showCurrentValue = true,
    showMinMax = false,
}) => {
    const trackRef = useRef<HTMLDivElement>(null);

    const calculateValue = useCallback((clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const rawValue = min + percent * (max - min);
        return Math.round(rawValue / step) * step;
    }, [min, max, step]);

    const handleInteraction = (clientX: number) => {
        const newValue = calculateValue(clientX);
        if (newValue !== undefined) onChange(newValue);
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-1.5 w-full ">
            {/* Header Label & Value */}
            {(label || showCurrentValue) && (
                <div className="flex justify-between items-center select-none mb-0">
                    {label && <label className="text-[10px] text-bluegray-800 dark:text-redgray-200 uppercase tracking-wider block mb-2 font-bold select-none">{label}</label>}
                    {showCurrentValue && <span className={`text-[10px] font-bold ${textColor}`}>{value}</span>}
                </div>
            )}

            {/* Range Track */}
            <div
                className="h-[40px] flex items-center"
            >
                <div
                    ref={trackRef}
                    className={`relative w-full h-2 ${trackColor} rounded-lg cursor-pointer group`}
                    onMouseDown={(e) => handleInteraction(e.clientX)}
                    onMouseMove={(e) => e.buttons === 1 && handleInteraction(e.clientX)}
                >
                    {/* Thumb */}
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-150 ${thumbColor} ${glow ? "shadow-[0_0_10px_rgba(var(--accent),0.5)]" : ""
                            }`}
                        style={{ left: `${percentage}%` }}
                    />
                </div>
            </div>

            {/* Min/Max Labels */}
            {showMinMax && (
                <div className="flex justify-between mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase">
                    <span>{min}</span>
                    <span>{max}</span>
                </div>
            )}
        </div>
    );
};