// Looks for the game. A theme is a block of token overrides in src/app/themes/<id>.css, switched by data-theme on <html>.
// A theme with its own typefaces loads them only once it is chosen (src/themes/<id>.ts), so the classic look pays nothing for the others.
// To add one: an entry here, its CSS file (imported in layout.tsx), and a fonts module if it needs faces of its own.
export const THEMES = [
  { id: "classic", name: "Classic", blurb: "Postcards on dark green", bar: "#0a2b20", chip: "linear-gradient(135deg, #0f3d2e 0 50%, #f4ead5 50% 78%, #f3c24f 78%)" },
  { id: "anime", name: "Anime", blurb: "The same trip under a twilight sky", bar: "#0f1440", chip: "linear-gradient(135deg, #1a1d5c 0 38%, #8a3a72 38% 62%, #ff9e6b 62% 80%, #ffd166 80%)" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

const KEY = "stamped:theme";   // the script in layout.tsx reads the same key before first paint
const FONTS: Partial<Record<ThemeId, () => Promise<{ default: string }>>> = { anime: () => import("@/themes/anime") };

export function getTheme(): ThemeId {
  try { const t = localStorage.getItem(KEY); return THEMES.some(x => x.id === t) ? (t as ThemeId) : "classic"; } catch { return "classic"; }
}

/** Puts a look on the page: the tokens switch at once, the browser bar follows, and the theme's own faces swap in when they arrive. */
export function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  if (id === "classic") delete root.dataset.theme; else root.dataset.theme = id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEMES.find(t => t.id === id)!.bar);
  void FONTS[id]?.().then(m => root.classList.add(...m.default.split(" ")), () => { /* offline: the theme falls back to the classic faces */ });
}

export function setTheme(id: ThemeId) {
  try { if (id === "classic") localStorage.removeItem(KEY); else localStorage.setItem(KEY, id); } catch { /* storage blocked: the look lasts this page */ }
  applyTheme(id);
}
