import React from "react";

interface DynamicLogoProps {
  height?: number;
  width?: number;
  className?: string;
  squareColorClasses?: string;
  squareGlow?: boolean;
  squareIsButton?: boolean;
  squareButtonAction?: () => void;
  collapsed?: boolean;
}

export const DynamicLogo: React.FC<DynamicLogoProps> = ({
  height: propHeight,
  width: propWidth,
  className = "",
  // Aggiunto il colore del testo (text-blue, text-red) per far funzionare il currentColor del neon
  squareColorClasses = "bg-blue text-blue dark:bg-red dark:text-red",
  squareGlow = false,
  squareIsButton = false,
  squareButtonAction,
  collapsed = false,
}) => {
  // 1. Logica di calcolo proporzionale (Rapporto 1:2)
  const normalHeight = propHeight !== undefined ? propHeight : 90;
  const normalWidth = propWidth !== undefined ? propWidth : (propHeight !== undefined ? propHeight * 2 : 180);

  const collapsedHeight = 56;
  const collapsedWidth = 56;

  const currentHeight = collapsed ? collapsedHeight : normalHeight;
  const currentWidth = collapsed ? collapsedWidth : normalWidth;

  // 2. Valori in scala basati sull'altezza
  const normalFontSize = normalHeight * 0.35;
  const normalSquareSize = normalHeight * 0.2;
  const collapsedSquareSize = 28; // Optimized for visible click area

  // 3. Aura Neon dinamica basata su currentColor
  const glowClasses = squareGlow
    ? "shadow-[0_0_15px_currentColor] blur-[1px] brightness-110" 
    : "";

  return (
    <div
      className={`relative flex items-center justify-center bg-transparent select-none transition-all duration-500 ease-in-out ${className}`}
      style={{
        height: `${currentHeight}px`,
        width: `${currentWidth}px`,
      }}
    >
      {/* Brand Name using local font-star */}
      <span
        className="font-star text-black dark:text-white tracking-wide leading-none"
        style={{
          fontSize: `${normalFontSize}px`,
          opacity: collapsed ? 0 : 1,
          transform: collapsed ? "scale(0.8) translateX(-15px)" : "scale(1) translateX(0)",
          pointerEvents: collapsed ? "none" : "auto",
          transition: collapsed 
            ? "opacity 0s, transform 0s" 
            : "opacity 0.4s ease-in-out 0.15s, transform 0.4s ease-in-out 0.15s",
        }}
      >
        Typamine
      </span>

      {/* Proportional Chemistry Square Indicator with Neon Aura */}
      {squareIsButton ? (
        <button
          type="button"
          onClick={squareButtonAction}
          className={`absolute transition-all duration-500 ease-in-out cursor-pointer hover:scale-110 active:scale-95 ${squareColorClasses} ${glowClasses} ${
            collapsed ? "rotate-[360deg] rounded-sm" : "rotate-0 rounded-xs"
          }`}
          style={{
            width: `${collapsed ? collapsedSquareSize : normalSquareSize}px`,
            height: `${collapsed ? collapsedSquareSize : normalSquareSize}px`,
            left: `${collapsed ? (collapsedWidth - collapsedSquareSize) / 2 : (normalWidth - normalSquareSize)}px`,
            top: `${collapsed ? (collapsedHeight - collapsedSquareSize) / 2 : (normalHeight - normalSquareSize)}px`,
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        />
      ) : (
        <div
          className={`absolute transition-all duration-500 ease-in-out ${squareColorClasses} ${glowClasses}`}
          style={{
            width: `${normalSquareSize}px`,
            height: `${normalSquareSize}px`,
            left: `${normalWidth - normalSquareSize}px`,
            top: `${normalHeight - normalSquareSize}px`,
          }}
        />
      )}
    </div>
  );
};

export default DynamicLogo;