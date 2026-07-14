// /LedBar/index.tsx
import React, { useMemo } from 'react';
import './LedBar.css';

export type HoverMode = 
  | 'none' 
  | 'frenzy'     // Velocizza 4x e aumenta il contrasto
  | 'pause'      // Ferma lo scanner dove si trova
  | 'overdrive'  // Cambia colore (es. azzurro) e spara la luminosità
  | 'stealth'    // Accorcia la coda e abbassa la luce
  | 'pulse';     // Smette di scansionare e fa lampeggiare tutto

interface LedBarProps {
  ledCount?: number;
  width?: string;
  height?: string;
  orientation?: 'horizontal' | 'vertical';
  direction?: 'normal' | 'reverse'; // 'reverse' fa partire l'animazione dal lato opposto
  color?: string;
  speed?: number; // In millisecondi (es. 1000 per 1 secondo)
  yoyo?: boolean; // Se true fa avanti e indietro, se false riparte dall'inizio
  trailSize?: string; // Percentuale della larghezza totale (es. '30%')
  
  // Prop per gestire l'hover dal componente genitore
  isHovered?: boolean; 
  hoverMode?: HoverMode;
  pausedByDefault?: boolean;
  className?: string;
}

export default function LedBar({
  ledCount = 10,
  width = '300px',
  height = '30px',
  orientation = 'horizontal',
  direction = 'normal',
  color = '#ff0000',
  speed = 1200,
  yoyo = true,
  trailSize = '30%',
  isHovered = false,
  hoverMode = 'none',
  pausedByDefault = false,
  className = '',
}: LedBarProps) {
  
  // Genera l'array di celle vuote per renderizzare la griglia fisica
  const cells = useMemo(() => Array.from({ length: ledCount }), [ledCount]);

  // Configurazione dinamica dell'animazione
  const isHorizontal = orientation === 'horizontal';
  const animationName = yoyo 
    ? (isHorizontal ? 'scan-yoyo-horizontal' : 'scan-yoyo-vertical')
    : 'scan-horizontal'; // Logica loop lineare semplificata (da espandere per il verticale)

  const animationDirection = yoyo 
    ? (direction === 'reverse' ? 'alternate-reverse' : 'alternate') 
    : (direction === 'reverse' ? 'reverse' : 'normal');

const scannerStyle: React.CSSProperties = {
    animationName,
    animationDuration: `${speed}ms`,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection,
    // Aggiungi questa logica: se è pausedByDefault e NON siamo in hover, metti in pausa l'animazione base
    animationPlayState: pausedByDefault && !isHovered ? 'paused' : 'running', 
  };

  // Variabili CSS passate al wrapper per controllare il CSS in modo dinamico
  const cssVars = {
    '--led-color': color,
    '--base-speed': `${speed}ms`,
    '--trail-size': isHorizontal ? trailSize : '100%',
    width,
    height,
    flexDirection: isHorizontal ? 'row' : 'column',
  } as React.CSSProperties;

  return (
    <div 
      className={`led-bar-wrapper ${className}`} 
      style={cssVars}
      data-is-hovered={isHovered}
      data-hover-mode={hoverMode}
    >
      {/* La griglia dei LED fisici (vetro sovrapposto alla luce) */}
      <div 
        className="led-cells-container"
        style={{ flexDirection: isHorizontal ? 'row' : 'column' }}
      >
        {cells.map((_, index) => (
          <div key={index} className="led-cell" />
        ))}
      </div>

      {/* Il fascio di luce sottostante */}
      <div 
        className="led-scanner-light" 
        style={{
          ...scannerStyle,
          width: isHorizontal ? trailSize : '100%',
          height: isHorizontal ? '100%' : trailSize,
        }}
      />
    </div>
  );
}