// Anime mode's display face, loaded only when the theme is chosen (see src/lib/client/theme.ts).
// Dela Gothic One: the heavy gothic of anime title cards and game logos, with the Latin, accented and Vietnamese letters place names need.
import { Dela_Gothic_One } from "next/font/google";

const display = Dela_Gothic_One({ weight: "400", subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-anime-display", display: "swap", preload: false });

const classes = display.variable;
export default classes;
