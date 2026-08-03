import { dynamicTextStyle, dynamicBgStyle } from "@/lib/dynamicStyle";

interface MarqueeBarProps {
  text: string;
  textColorClassName?: string;
  bgColorClassName?: string;
}

// Striscia sottile fissa sopra l'header, per i placement "every_page" e
// "homepage_top" (vedi /admin/settings, tab "Promo Website Communication").
// L'offset dell'header (Header.tsx + StaggeredMenu.tsx, entrambi `position:
// fixed`) è coordinato via la CSS var --marquee-offset impostata su <body>
// in (public)/layout.tsx, con la stessa altezza fissa di questa striscia
// (h-9 = 2.25rem) — niente misurazione a runtime, niente flash.
export default function MarqueeBar({ text, textColorClassName, bgColorClassName }: MarqueeBarProps) {
  if (!text) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-9 overflow-hidden flex items-center dyn-bg"
      style={dynamicBgStyle(bgColorClassName)}
    >
      <div className="flex w-max animate-marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <span
                key={idx}
                className="px-6 text-xs font-bold uppercase tracking-wider whitespace-nowrap dyn-text"
                style={dynamicTextStyle(textColorClassName)}
              >
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
