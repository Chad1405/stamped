"use client";
// The look switch in the header: one button, a short menu of themes. The choice is kept in this browser (src/lib/client/theme.ts).
import { useEffect, useRef, useState } from "react";
import { applyTheme, getTheme, setTheme, THEMES, type ThemeId } from "@/lib/client/theme";

export function ThemeMenu() {
  const [open, setOpen] = useState(false), [theme, setChosen] = useState<ThemeId>("classic");
  const box = useRef<HTMLDivElement>(null), button = useRef<HTMLButtonElement>(null);
  // the page's first paint already has the stored colours (layout.tsx); this catches up the menu, the browser bar and the theme's faces
  useEffect(() => { const t = getTheme(); setChosen(t); applyTheme(t); }, []);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); button.current?.focus(); } };
    addEventListener("pointerdown", away); addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", away); removeEventListener("keydown", esc); };
  }, [open]);
  const pick = (id: ThemeId) => { setTheme(id); setChosen(id); setOpen(false); button.current?.focus(); };
  return (
    <div className="theme" ref={box}>
      <button ref={button} className="btn btn--icon" type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Choose a look" title="Choose a look" onClick={() => setOpen(o => !o)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path fill="currentColor" d="M12 4a8 8 0 0 1 0 16z" /></svg>
      </button>
      {open && (
        <div className="theme-menu" role="menu" aria-label="Look">
          {THEMES.map(t => (
            <button key={t.id} className="theme-opt" type="button" role="menuitemradio" aria-checked={t.id === theme} onClick={() => pick(t.id)}>
              <span className="theme-chip" style={{ background: t.chip }} aria-hidden="true" />
              <b>{t.name}</b>
              <span className="theme-blurb">{t.blurb}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
