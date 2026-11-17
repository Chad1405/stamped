Draft: chosen 17 Nov 2026 (variation B, "The Draw", of the Departure Deck direction). Not yet signed off.
Prototype: `prototype/deck/index.html` (open it in a browser; rebuild its rules with `node prototype/deck/build-rules.mjs`).

# Born There design

## Direction
- **Job:** play today's five stops, then share the score and come back tomorrow · **audience:** people who like geography and daily puzzles, mostly on a phone.
- **Look:** an indie card game on a felt table. Each stop is a card drawn from a deck. Chunky display type, cards with thick ink borders, a faint CRT scanline glow over everything.
- **Dials:** variance 4 · motion 7 (juicy) · density 5.
- **Colour:** one dark felt green as the ground, cream cards on it, and three chip colours (red, blue, gold) that each mean something. Dark, because a daily game is often played in bed.
- **Type:** Bungee for anything you'd read across a table (questions, places, scores, buttons, card labels), Barlow Semi Condensed for facts and help.
- **Surface:** soft radius (6, 10, 16px), 3px ink borders, hard drop shadows that look like card thickness, no blur shadows on buttons.

## Signature: the draw
Every stop is one big card. The rest of the day is a deck peeking at the bottom of the screen with a count ("3 left").
1. **Draw:** the top card slides up off the deck and flips face-up to the clue. The 3 s look-first countdown runs on the card's photo.
2. **Clock:** a fuse along the card's top edge burns down and turns red in the last 8 seconds.
3. **Risk or bank:** drag the card right to risk it, left to bank it. It tilts, a red or blue glow grows on that side, and edge tabs ("Bank 30", "Risk 85 · drop to 15") grow as you pull. There are always two real buttons too, plus the D and B keys: never gesture-only.
4. **Land:** the card flips to its back, which is the place card. The stamp slams on, harder for deeper tiers. Born There turns gold with a burst. A miss shakes the card and greys the photo.
5. **Hand:** the results deal the five played cards into a fanned hand, then the score counts up.

Protect it: one card on screen at a time during play, the deck always visible, and the flip always between the clue and the answer.

## Tokens
| Group | Tokens |
|---|---|
| Felt | `--felt #0f3d2e` · `--felt-dark #0a2b20` |
| Cards | `--card #f4ead5` · `--card-2 #e2d4b5` · `--ink #1a1310` · `--muted-ink #5c4d3f` (6.8:1 on card) |
| Chips | `--red #e2412e` / `--red-dark #a42a1c` (risk, the live step, misses) · `--blue #2d6cdf` / `--blue-dark #1d4a9e` (bank, the card back) · `--gold #f3c24f` (score, Born There, primary button) |
| Text on felt | `--cream #fbf3e2` · `--muted-cream` cream at 80% |
| Scanlines | `--scan` black at 16%, 1px every 3px, plus a soft vignette |
| Type | `--display` Bungee · `--body` Barlow Semi Condensed 500/700 · sizes 12, 14, 16, 18, 20 (question), 24, 32, 44, 72px |
| Space | 4, 8, 12, 16, 24, 32px |
| Radius | `--r-sm 6px` · `--r-md 10px` · `--r-lg 16px` |
| Borders | `--bw 3px` ink on cards and buttons, 2px inside cards |
| Shadows | `--sh-card` 10px hard offset + soft drop · `--sh-btn` 5px hard ink offset (pressing moves the button down 4px) |
| Sizes | `--tap 44px` · `--table 440px` (540px on desktop) · `--pic-h clamp(150px, 30svh, 290px)` |
| Motion | `--t-fast 120ms` · `--t-mid 340ms` · `--t-draw 560ms` · `--t-flip 640ms` · `--t-slam 460ms` · `--t-deal 520ms` · `--ease-bounce cubic-bezier(.2,1.45,.4,1)` · `--ease-out cubic-bezier(.2,.8,.2,1)` · `--ease-in cubic-bezier(.5,0,.9,.4)` |

## Brand
Chosen 17 Nov 2026 (variation C, "Corner index"). The mark is a playing card from this deck: the B for Born There over the deck's own suit, a red pointer that says "here", because every clue was born in the place you have to name. Files are in `brand/`.

| File | Use |
|---|---|
| `logo.svg` | Gold name with its red-dark shadow, beside the card. On the felt and other dark grounds |
| `logo-light.svg` | Ink name with a red shadow. On cream, white and other light grounds |
| `mark.svg` | The card alone: avatars, app icon art, anywhere square |
| `mark-mono.svg` | One flat colour (ink by default; recolour the fills) for printing, stamps, watermarks |
| `wordmark.svg` | The name alone, where the card already shows nearby |
| `favicon.svg` | Reduced card for 16 to 32px (bigger B and pointer, thicker edge). Copied to `src/app/icon0.svg` |
| `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | PNG icons on the felt. The first two are copied to `src/app/icon1.png` and `src/app/apple-icon.png` |
| `og-image.png` (from `og.html`) | Link preview, copied to `src/app/opengraph-image.png` |

- **Construction:** a 100 by 100 grid; card 70 by 90 at radius 11 with a 6-unit ink edge; the B is Bungee, outlined (no font needed); the name is Bungee, outlined, with the shadow 9 units down at 100-unit cap size.
- **Colours:** `--ink`, `--card`, `--red` in the card; `--gold` name with `--red-dark` shadow on dark; `--ink` name with `--red` shadow on light.
- **Clear space:** half the card's width on every side of the logo or mark.
- **Minimum size:** the mark at 16px only as `favicon.svg`; the full mark from 32px; the logo from 140px wide.
- **Never:** redraw the pointer as a map pin or arrow, recolour the pointer away from red, put the card on a tile of any colour other than the felt, set the name in live text in place of the outlines, add gradients, glows or outlines, or stretch it.

## Voice
Unchanged from today: plain, short, British spelling, travel words ("Board flight 001", "Stamp it", "Bank it", "Risk it", "Window Seat"). Card words may join them (draw, hand, deck) but the game never talks like a casino: no "bet", "wager", "jackpot", "all in" or "cash out".

## Rules
- Real photos are never dithered, tinted or cropped below the clue: the place must stay guessable. 2026-11-17
- Every gesture has a button and a key. The drag is a bonus, not the only way. 2026-11-17
- Chip colours keep their meaning: red is risk or the live step, blue is banking, gold is points and Born There. 2026-11-17
- The next button ("Board stop 5") sits straight under the place name on the reveal, never below the facts. 2026-11-17
- Motion is transform and opacity only, and all of it stops under reduced motion with every final state still shown. 2026-11-17
- Sound stays as it is in `src/lib/client/fx.ts`. 2026-11-17

## In the app
The rules didn't change: the prototype and the app run the same `src/lib/game` engine. The look lives in `src/app/globals.css` (tokens at the top), the faces load in `src/app/layout.tsx` through `next/font`, and the markup is in `src/components/` (`Game.tsx` the table and HUD, `StopScreen.tsx` the card, `screens.tsx` the start, results, passport and leagues, `bits.tsx` the mini cards, the fan and the deck).
- The flight band between stops (`Flight.tsx`) is gone from play: the draw replaced it. The file is unused.
- Words that changed with the look: the last reveal's button is "See your hand" (was "Open your passport"), a finished archive day is "See the hand" (was "See passport"), loading reads "Shuffling today's deck…".
