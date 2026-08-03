import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  logoSlot?: React.ReactNode;
  headerExtra?: React.ReactNode;
  headerHidden?: boolean;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  isFixed: boolean;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

/**
  Icona dello stato APERTO: Piastra di Petri (Canva Pagina 2)
  Cerchio vettoriale con colonie di coltura biologica.
 */
export function PetriDishIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Disco esterno */}
      <circle cx="18" cy="18" r="16" fill="currentColor" />

      {/* Cerchi concentrici interni del bordo in vetro */}
      <circle cx="18" cy="18" r="14.5" stroke="var(--sm-bg-color, #ffffff)" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="18" cy="18" r="13" stroke="var(--sm-bg-color, #ffffff)" strokeWidth="0.8" fill="none" opacity="0.8" />

      {/* Colturazione batterica / macchie di Petri */}
      <circle cx="13" cy="12" r="2.4" fill="var(--sm-bg-color, #ffffff)" />
      <circle cx="16" cy="11" r="1.5" fill="var(--sm-bg-color, #ffffff)" />
      <circle cx="11" cy="15" r="1.6" fill="var(--sm-bg-color, #ffffff)" />

      <circle cx="23" cy="22" r="2.6" fill="var(--sm-bg-color, #ffffff)" />
      <circle cx="20" cy="24" r="1.5" fill="var(--sm-bg-color, #ffffff)" />
      <circle cx="25" cy="19" r="1.4" fill="var(--sm-bg-color, #ffffff)" />

      <circle cx="22" cy="11" r="1.2" fill="var(--sm-bg-color, #ffffff)" />
      <circle cx="13" cy="22" r="1.3" fill="var(--sm-bg-color, #ffffff)" />
      <circle cx="17" cy="25" r="1.1" fill="var(--sm-bg-color, #ffffff)" />
      <circle cx="10" cy="11" r="0.9" fill="var(--sm-bg-color, #ffffff)" />
      <circle cx="26" cy="25" r="1" fill="var(--sm-bg-color, #ffffff)" />
    </svg>
  );
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#ff3131', '#00cece'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = '/src/assets/logos/reactbits-gh-white.svg',
  logoSlot,
  headerExtra,
  headerHidden = false,
  menuButtonColor = '#ffffff',
  openMenuButtonColor = '#ffffff',
  changeMenuColorOnOpen = true,
  accentColor = '#ff3131',
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose
}: StaggeredMenuProps) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const panelRef = useRef<HTMLElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  const toggleMenu = useCallback(() => {
    const nextState = !openRef.current;
    openRef.current = nextState;
    setOpen(nextState);

    if (nextState) {
      onMenuOpen?.();
    } else {
      onMenuClose?.();
    }
  }, [onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
    }
  }, [onMenuClose]);

  // Gestione tasto ESC e click outside per chiudere il menu
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        closeOnClickAway &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, closeOnClickAway, closeMenu]);

  const buttonColor = open && changeMenuColorOnOpen
    ? (openMenuButtonColor || menuButtonColor)
    : menuButtonColor;

  return (
    <div
      className={`sm-scope z-40 ${isFixed ? 'fixed left-0 w-screen overflow-hidden pointer-events-none' : 'w-full h-full'}`}
      style={isFixed ? { top: "var(--marquee-offset, 0px)", height: "calc(100dvh - var(--marquee-offset, 0px))" } : undefined}
    >
      <div
        className={
          (className ? className + ' ' : '') + 'staggered-menu-wrapper pointer-events-none relative w-full h-full z-40'
        }
        style={{
          '--sm-accent': accentColor,
          '--sm-bg-color': 'var(--background, #13100F)',
        } as React.CSSProperties}
        data-position={position}
        data-open={open || undefined}
      >
        {/* Layer di sfondo a cascata (Pre-layers) */}
        <div
          className="sm-prelayers absolute top-0 right-0 bottom-0 pointer-events-none z-[5]"
          aria-hidden="true"
        >
          {(() => {
            const raw = colors && colors.length ? colors.slice(0, 4) : ['#ff3131', '#00cece'];
            return raw.map((c, i) => (
              <div
                key={i}
                className="sm-prelayer absolute top-0 right-0 h-full w-full"
                style={{ background: c }}
              />
            ));
          })()}
        </div>

        {/* Header principale (Logo + ThemeToggle + Oreo Menu Button) */}
        <header
          ref={headerRef}
          className={`staggered-menu-header absolute top-0 left-0 w-full flex items-center justify-between p-[2em] bg-transparent pointer-events-none z-20 transition-transform duration-300 ease-in-out ${
            headerHidden && !open ? '-translate-y-full' : 'translate-y-0'
          }`}
          aria-label="Main navigation header"
        >
          <div
            className={`sm-logo flex items-center select-none pointer-events-auto transition-opacity duration-300 ${
              open ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="Logo"
          >
            {logoSlot ?? (
              <img
                src={logoUrl || '/src/assets/logos/reactbits-gh-white.svg'}
                alt="Logo"
                className="sm-logo-img block h-8 w-auto object-contain"
                draggable={false}
                width={110}
                height={24}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            {headerExtra && <div className="flex items-center pointer-events-auto">{headerExtra}</div>}

            <button
              ref={toggleBtnRef}
              className="sm-toggle relative inline-flex items-center justify-center w-9 h-9 bg-transparent border-0 cursor-pointer pointer-events-auto select-none rounded-md transition-colors duration-300"
              style={{ color: buttonColor }}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="staggered-menu-panel"
              onClick={toggleMenu}
              type="button"
            >
              {/* Contenitore Oreo Stack con 4 strati indipendenti + 3D Flip sul disco 1 */}
              <div className="sm-oreo-container relative w-7 h-7 flex items-center justify-center shrink-0">
                {/* STRATO 1 (Disco Superiore): Ruota in 3D (rotateX) e rivela la Piastra di Petri a menu aperto */}
                <div className="sm-layer-1 absolute inset-0 z-10">
                  <div className="sm-flip-inner relative w-full h-full">
                    {/* Faccia Anteriore: Disco superiore Oreo Stack */}
                    <div className="sm-flip-front absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7 text-current">
                        <path d="M 3 8.5 C 3 3, 33 3, 33 8.5 C 24 11, 12 11, 3 8.5 Z" fill="currentColor" />
                      </svg>
                    </div>

                    {/* Faccia Posteriore: Piastra di Petri */}
                    <div className="sm-flip-back absolute inset-0 flex items-center justify-center">
                      <PetriDishIcon className="w-7 h-7 text-current" />
                    </div>
                  </div>
                </div>

                {/* STRATO 2 (Barra Intermedia Superiore): Trasla in basso su Y e sfuma */}
                <div className="sm-layer-2 absolute inset-0 z-2 pointer-events-none">
                  <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7 text-current">
                    <path d="M 3 13 C 12 15.5, 24 15.5, 33 13 C 24 18.5, 12 18.5, 3 13 Z" fill="currentColor" />
                  </svg>
                </div>

                {/* STRATO 3 (Barra Intermedia Inferiore): Trasla in basso su Y e sfuma */}
                <div className="sm-layer-3 absolute inset-0 z-3 pointer-events-none">
                  <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7 text-current">
                    <path d="M 3 20 C 12 22.5, 24 22.5, 33 20 C 24 25.5, 12 25.5, 3 20 Z" fill="currentColor" />
                  </svg>
                </div>

                {/* STRATO 4 (Disco Inferiore): Trasla in basso su Y e sfuma */}
                <div className="sm-layer-4 absolute inset-0 z-4 pointer-events-none">
                  <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7 text-current">
                    <path d="M 3 27 C 12 29.5, 24 29.5, 33 27 C 33 34, 3 34, 3 27 Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Pannello menu laterale */}
        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel absolute top-0 right-0 h-full bg-white dark:bg-black flex flex-col p-[6em_2em_2em_2em] overflow-y-auto z-10 backdrop-blur-[16px] pointer-events-auto"
          aria-hidden={!open}
        >
          <div className="sm-panel-inner flex-1 flex flex-col gap-5">
            <ul
              className="sm-panel-list list-none mt-8 mx-0 p-0 flex flex-col gap-2"
              role="list"
              data-numbering={displayItemNumbering || undefined}
            >
              {items && items.length ? (
                items.map((it, idx) => (
                  <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={it.label + idx}>
                    <a
                      className="sm-panel-item relative text-black dark:text-white font-semibold text-[3.5rem] sm:text-[4rem] cursor-pointer leading-none tracking-[-2px] uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline pr-[2.2em]"
                      href={it.link}
                      aria-label={it.ariaLabel}
                      data-index={idx + 1}
                      onClick={closeMenu}
                    >
                      <span className="sm-panel-itemLabel inline-block">
                        {it.label}
                      </span>
                    </a>
                  </li>
                ))
              ) : (
                <li className="sm-panel-itemWrap relative overflow-hidden leading-none" aria-hidden="true">
                  <span className="sm-panel-item relative text-black dark:text-white font-semibold text-[3.5rem] sm:text-[4rem] cursor-pointer leading-none tracking-[-2px] uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline pr-[2.2em]">
                    <span className="sm-panel-itemLabel inline-block">
                      No items
                    </span>
                  </span>
                </li>
              )}
            </ul>

            {displaySocials && socialItems && socialItems.length > 0 && (
              <div className="sm-socials mt-auto pt-8 flex flex-col gap-3" aria-label="Social links">
                <h3 className="sm-socials-title m-0 text-base font-medium [color:var(--sm-accent,#ff3131)]">Socials</h3>
                <ul
                  className="sm-socials-list list-none m-0 p-0 flex flex-row items-center gap-4 flex-wrap"
                  role="list"
                >
                  {socialItems.map((s, i) => (
                    <li key={s.label + i} className="sm-socials-item">
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link text-[1.2rem] font-medium text-black dark:text-white no-underline relative inline-block py-[2px] transition-[color,opacity] duration-300 ease-linear"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Stili CSS per la coreografia dell'icona (3D Flip + Traslazione Y) e animazioni menu */}
      <style>{`
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 2em; background: transparent; pointer-events: none; z-index: 20; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .sm-logo { display: flex; align-items: center; user-select: none; }
.sm-scope .sm-logo-img { display: block; height: 32px; width: auto; object-fit: contain; }

.sm-scope .sm-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  line-height: 1;
  overflow: visible;
}
.sm-scope .sm-toggle:focus-visible { outline: 2px solid #ffffffaa; outline-offset: 4px; border-radius: 4px; }

/* --- COREOGRAFIA TOGGLE ICON --- */
/* Strato 1: Rotazione 3D Flip (rotateX) */
.sm-scope .sm-flip-inner {
  perspective: 600px;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.sm-scope .sm-flip-front,
.sm-scope .sm-flip-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: opacity 0.35s ease;
}
.sm-scope .sm-flip-front {
  transform: rotateX(0deg);
  opacity: 1;
}
.sm-scope .sm-flip-back {
  transform: rotateX(180deg);
  opacity: 0;
}
.sm-scope .staggered-menu-wrapper[data-open] .sm-flip-inner {
  transform: rotateX(180deg);
}
.sm-scope .staggered-menu-wrapper[data-open] .sm-flip-front {
  opacity: 0;
}
.sm-scope .staggered-menu-wrapper[data-open] .sm-flip-back {
  opacity: 1;
}

/* Strati 2, 3 e 4: Traslazione verso il basso sull'asse Y e dissolve alla riapertura */
.sm-scope .sm-layer-2,
.sm-scope .sm-layer-3,
.sm-scope .sm-layer-4 {
  transform: translateY(0%);
  opacity: 1;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}
.sm-scope .staggered-menu-wrapper[data-open] .sm-layer-2 {
  transform: translateY(14px);
  opacity: 0;
  transition-delay: 0s;
}
.sm-scope .staggered-menu-wrapper[data-open] .sm-layer-3 {
  transform: translateY(24px);
  opacity: 0;
  transition-delay: 0.04s;
}
.sm-scope .staggered-menu-wrapper[data-open] .sm-layer-4 {
  transform: translateY(34px);
  opacity: 0;
  transition-delay: 0.08s;
}

/* Prelayers (sfondi a cascata colorati) */
.sm-scope .sm-prelayers {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: clamp(260px, 38vw, 420px);
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
}
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  transform: translateX(100%);
  transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}
.sm-scope [data-position='left'] .sm-prelayer { transform: translateX(-100%); }
.sm-scope .staggered-menu-wrapper[data-open] .sm-prelayer { transform: translateX(0%); }
.sm-scope .staggered-menu-wrapper[data-open] .sm-prelayer:nth-child(1) { transition-delay: 0s; }
.sm-scope .staggered-menu-wrapper[data-open] .sm-prelayer:nth-child(2) { transition-delay: 0.05s; }
.sm-scope .staggered-menu-wrapper[data-open] .sm-prelayer:nth-child(3) { transition-delay: 0.10s; }

/* Panel principale */
.sm-scope .staggered-menu-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: clamp(260px, 38vw, 420px);
  height: 100%;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  padding: 6em 2em 2em 2em;
  overflow-y: auto;
  z-index: 10;
  transform: translateX(100%);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; transform: translateX(-100%); }
.sm-scope .staggered-menu-wrapper[data-open] .staggered-menu-panel {
  transform: translateX(0%);
  transition-delay: 0.08s;
}

/* Animazione a cascata degli elementi di testo */
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.sm-scope .sm-panel-list { list-style: none; margin: 2rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.sm-scope .sm-panel-item {
  position: relative;
  font-weight: 600;
  font-size: clamp(2.2rem, 8vw, 4rem);
  cursor: pointer;
  line-height: 1;
  letter-spacing: -2px;
  text-transform: uppercase;
  transition: background 0.25s, color 0.25s;
  display: inline-block;
  text-decoration: none;
  padding-right: 2.2em;
}

.sm-scope .sm-panel-itemLabel {
  display: inline-block;
  will-change: transform, opacity;
  transform: translateY(120%) rotate(6deg);
  opacity: 0;
  transform-origin: 0% 100%;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease;
}
.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-itemLabel {
  transform: translateY(0%) rotate(0deg);
  opacity: 1;
}

.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-itemWrap:nth-child(1) .sm-panel-itemLabel { transition-delay: 0.20s; }
.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-itemWrap:nth-child(2) .sm-panel-itemLabel { transition-delay: 0.26s; }
.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-itemWrap:nth-child(3) .sm-panel-itemLabel { transition-delay: 0.32s; }
.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-itemWrap:nth-child(4) .sm-panel-itemLabel { transition-delay: 0.38s; }
.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-itemWrap:nth-child(5) .sm-panel-itemLabel { transition-delay: 0.44s; }
.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-itemWrap:nth-child(6) .sm-panel-itemLabel { transition-delay: 0.50s; }

.sm-scope .sm-panel-item:hover { color: var(--sm-accent, #ff3131); }
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after {
  counter-increment: smItem;
  content: counter(smItem, decimal-leading-zero);
  position: absolute;
  top: 0.15em;
  right: 0.3em;
  font-size: 18px;
  font-weight: 400;
  color: var(--sm-accent, #ff3131);
  letter-spacing: 0;
  pointer-events: none;
  user-select: none;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-list[data-numbering] .sm-panel-item::after {
  opacity: 1;
  transition-delay: 0.35s;
}

/* Social links */
.sm-scope .sm-socials { margin-top: auto; padding-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
.sm-scope .sm-socials-title { margin: 0; font-size: 1rem; font-weight: 500; color: var(--sm-accent, #ff3131); }
.sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sm-scope .sm-socials-list .sm-socials-link { opacity: 1; transition: opacity 0.3s ease, color 0.3s ease; }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: 0.35; }
.sm-scope .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) { opacity: 0.35; }
.sm-scope .sm-socials-list .sm-socials-link:hover,
.sm-scope .sm-socials-list .sm-socials-link:focus-visible { opacity: 1; }
.sm-scope .sm-socials-link:focus-visible { outline: 2px solid var(--sm-accent, #ff3131); outline-offset: 3px; }
.sm-scope .sm-socials-link { font-size: 1.2rem; font-weight: 500; text-decoration: none; position: relative; padding: 2px 0; display: inline-block; }
.sm-scope .sm-socials-link:hover { color: var(--sm-accent, #ff3131); }

@media (max-width: 1024px) {
  .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; }
  .sm-scope .staggered-menu-wrapper[data-open] .sm-logo-img { filter: invert(100%); }
}
      `}</style>
    </div>
  );
};

export default StaggeredMenu;
