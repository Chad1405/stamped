Draft: chosen 17 Nov 2026 (variation B, "The Draw", of the Departure Deck direction); casino cues swapped for travel objects 20 Nov 2026. Not yet signed off.
Prototype: `prototype/deck/index.html` (open it in a browser; rebuild its rules with `node prototype/deck/build-rules.mjs`).

# Born There design

## Direction
- **Job:** play today's five stops, then share the score and come back tomorrow · **audience:** people who like geography and daily puzzles, mostly on a phone.
- **Look:** a traveller's kit on dark green: postcards, airmail, luggage tags and tickets. Each stop is a postcard pulled from the pile of airmail still to come. Chunky display type, thick ink borders, a soft vignette at the edges. No scanlines: they strained the eyes (removed 22 Nov 2026). Nothing from a casino: no playing cards, chips, fanned hands or gold halos (a tester read the old card-table look as gambling, 20 Nov 2026).
- **Dials:** variance 4 · motion 7 (juicy) · density 5.
- **Colour:** one dark green as the ground, cream paper on it, and three colours (red, blue, gold) that each mean something. Red and blue together are also the airmail stripe. Dark, because a daily game is often played in bed.
- **Type:** Bungee for anything you'd read across a table (questions, places, scores, buttons, card labels), Barlow Semi Condensed for facts and help.
- **Surface:** soft radius (6, 10, 16px), 3px ink borders, hard drop shadows that look like card thickness, no blur shadows on buttons.

## Signature: the postcard
Every stop is one big postcard. The rest of the day is a pile of airmail envelopes peeking at the bottom of the screen with a count ("3 to go").
1. **Draw:** the top envelope (airmail stripe, stamp, postmark with the stop number) slides up off the pile and flips to the clue. The 3 s look-first countdown runs on the card's photo.
2. **Clock:** a fuse along the card's top edge burns down and turns red in the last 8 seconds.
3. **Risk it or stay:** drag the card right to risk it, left to stay. It tilts, a red or blue glow grows on that side, and edge tabs ("Stay 30", "Risk 85 · drop to 15") grow as you pull. There are always two real buttons too, shaped as tickets with a notch in each side, plus the D and B keys: never gesture-only.
4. **Land:** the card flips to its back, which is the place card. The stamp slams on, harder for deeper tiers. Born There turns gold with a burst. A miss shakes the card and greys the photo.
5. **Route:** the results hang the five played stops as luggage tags (punched hole, airport code, points) along a dashed flight path, then the score counts up. The start screen shows the same row, with the stops still to come as envelopes.

Protect it: one postcard on screen at a time during play, the pile always visible, and the flip always between the clue and the answer.

## Tokens
| Group | Tokens |
|---|---|
| Ground | `--felt #0f3d2e` · `--felt-dark #0a2b20` (the names are historical: it is a plain dark green, not a card table) |
| Cards | `--card #f4ead5` · `--card-2 #e2d4b5` · `--ink #1a1310` · `--muted-ink #5c4d3f` (6.8:1 on card) |
| Colours | `--red #e2412e` / `--red-dark #a42a1c` (risk, the live step, misses) · `--blue #2d6cdf` / `--blue-dark #1d4a9e` (stay, stamps) · red and blue with cream make the airmail stripe · `--gold #f3c24f` (score, Born There, primary button; a fill or outline, never a glow) |
| Text on the green | `--cream #fbf3e2` · `--muted-cream` cream at 80% |
| Vignette | soft radial darkening at the edges, black up to 35%; no scanlines |
| Type | `--display` Bungee · `--body` Barlow Semi Condensed 500/700 · sizes 12, 14, 16, 18, 20 (question), 24, 32, 44, 72px |
| Space | 4, 8, 12, 16, 24, 32px |
| Radius | `--r-sm 6px` · `--r-md 10px` · `--r-lg 16px` |
| Borders | `--bw 3px` ink on cards and buttons, 2px inside cards |
| Shadows | `--sh-card` 10px hard offset + soft drop · `--sh-btn` 5px hard ink offset (pressing moves the button down 4px) |
| Sizes | `--tap 44px` · `--table 440px` (540px on desktop) · `--pic-h clamp(150px, 30svh, 290px)` |
| Motion | `--t-fast 120ms` · `--t-mid 340ms` · `--t-draw 560ms` · `--t-flip 640ms` · `--t-slam 460ms` · `--t-deal 520ms` · `--ease-bounce cubic-bezier(.2,1.45,.4,1)` · `--ease-out cubic-bezier(.2,.8,.2,1)` · `--ease-in cubic-bezier(.5,0,.9,.4)` |

## Brand
Redrawn 20 Nov 2026 as a luggage tag (it was a playing card, which read as casino). The mark is a cream tag with chamfered top corners and a punched hole: the B for Born There over a red pointer that says "here", because every clue was born in the place you have to name. Files are in `brand/`; `node brand/build.mjs` rebuilds the marks, logos and PNG icons from one drawing, and the link preview is `og.html` captured at 1200 by 630.

| File | Use |
|---|---|
| `logo.svg` | Gold name with its red-dark shadow, beside the tag. On the dark green and other dark grounds |
| `logo-light.svg` | Ink name with a red shadow. On cream, white and other light grounds |
| `mark.svg` | The tag alone: avatars, app icon art, anywhere square |
| `mark-mono.svg` | One flat colour (ink by default; recolour the fills) for printing, stamps, watermarks |
| `wordmark.svg` | The name alone, where the tag already shows nearby |
| `favicon.svg` | Reduced tag for 16 to 32px (bigger B, hole and pointer, thicker edge). Copied to `src/app/icon0.svg` |
| `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | PNG icons on the dark green. The first two are copied to `src/app/icon1.png` and `src/app/apple-icon.png` |
| `og-image.png` (from `og.html`) | Link preview, copied to `src/app/opengraph-image.png` |

- **Construction:** a 100 by 100 grid; tag 68 by 90 with 14-unit chamfers at the top and radius 9 at the bottom, a 6-unit ink edge, and a hole at (50, 22) with an ink ring; the B is Bungee, outlined (no font needed); the name is Bungee, outlined, with the shadow 9 units down at 100-unit cap size.
- **Colours:** `--ink`, `--card`, `--red` in the tag; `--gold` name with `--red-dark` shadow on dark; `--ink` name with `--red` shadow on light.
- **Clear space:** half the tag's width on every side of the logo or mark.
- **Minimum size:** the mark at 16px only as `favicon.svg`; the full mark from 32px; the logo from 140px wide.
- **Never:** redraw the pointer as a map pin or arrow, recolour the pointer away from red, fill the hole, put the tag on a tile of any colour other than the dark green, set the name in live text in place of the outlines, add gradients, glows or outlines, or stretch it.

## Voice
Plain, short, British spelling, travel words ("Board flight 001", "Stamp it", "Stay here", "Risk it", "Window Seat", "4 to go", "Your route today"). No card words (deck, hand, deal, shuffle, bank) and nothing from a casino: no "bet", "wager", "jackpot", "all in" or "cash out".

## Rules
- Real photos are never dithered, tinted or cropped below the clue: the place must stay guessable. 2026-11-17
- Every gesture has a button and a key. The drag is a bonus, not the only way. 2026-11-17
- Colours keep their meaning: red is risk or the live step, blue is staying, gold is points and Born There. 2026-11-17
- No casino cues: no playing cards, card backs, fanned hands, chips or gold halos. Things are postcards, airmail, tags, tickets and stamps. 2026-11-20
- The next button ("Board stop 5") sits straight under the place name on the reveal, never below the facts. 2026-11-17
- Motion is transform and opacity only, and all of it stops under reduced motion with every final state still shown. 2026-11-17
- Sound stays as it is in `src/lib/client/fx.ts`. 2026-11-17

## In the app
The rules didn't change: the prototype and the app run the same `src/lib/game` engine. The look lives in `src/app/globals.css` (tokens at the top), the faces load in `src/app/layout.tsx` through `next/font`, and the markup is in `src/components/` (`Game.tsx` the shell and HUD, `StopScreen.tsx` the postcard, `screens.tsx` the start, results, passport and leagues, `bits.tsx` the luggage tags, the start row and the envelope pile).
- The flight band between stops (`Flight.tsx`) is gone from play: the draw replaced it. The file is unused.
- Words that changed with the look: the last reveal's button is "See your route", a finished archive day is "See the route", loading reads "Checking in for today's flight…", the safe choice is "Stay here".
