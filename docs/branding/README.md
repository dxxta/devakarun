# dev.akarun branding

Brand guide for the dev.akarun portfolio and blog. Source of truth lives in code; the paths below point to it.

## Icon

A lime rounded square with a dark "a" glyph and a small brown dot in the top-right corner.

| Part | Value |
| --- | --- |
| Canvas | 64×64, corner radius 18 |
| Background | `#d4f03c` (primary lime) |
| Glyph | `#151513` (ink), a single-storey geometric "a" |
| Dot | `#a87d55` (secondary brown), r 4.5 at (53, 11) |

Files:
- `docs/branding/` – copies of the icon files plus `wordmark.svg` and `wordmark-dark.svg` (older fixed-size SVG wordmarks; the site uses the live text component below)
- `public/favicon.svg`, `public/icon.svg` – vector source
- `public/favicon.ico`, `public/icon-192.png`, `public/icon-512.png` – raster exports
- `src/components/admin/admin-icon.tsx` – the same mark in the Payload admin

Rules: keep the 64×64 proportions, never recolor the background, leave at least 1/8 of the width as clear space, and use at 16px or larger.

## Wordmark

Text only, set as `dev.akarun` in the display font, with the dot in primary lime.

- Component: `src/components/brand/wordmark.tsx`
- Style: Bricolage Grotesque, extra-bold (800), `tracking-tighter`, `text-2xl` by default, lowercase always
- The dot uses `text-primary`; "dev" and "akarun" inherit the foreground color
- It sizes to its content, so scale it with a text-size class (for example `text-3xl`) and never with a fixed width
- Use it inside a link with `aria-label="dev.akarun home"`; the wordmark itself is `aria-hidden`

On lime backgrounds the dot disappears, so use the ink color for the dot there.

## Design system

Hard-shadow, tactile "block" UI. Every surface looks like a physical block sitting on a flat page. Tokens live in `src/app/(frontend)/globals.css`; do not invent values.

### Color

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `#F7EFE7` | `#121210` |
| `--card` / `--popover` | `#FFFBF6` | `#1D1D1A` |
| `--foreground` | `#151513` | `#F7EFE7` |
| `--muted` | `#EFE7DC` | `#292824` |
| `--muted-foreground` | `#5E5A53` | `#A8A196` |
| `--border` / `--input` | `#E2D8CC` | `#2E2D29` |
| `--primary` (Lime) | `#D4F03C` | `#D4F03C` |
| `--secondary` (Akar Clay) | `#A87D55` | `#D9B38F` |
| `--ink-fixed`, `--shadow-color` | `#000000` | `#000000` |

Text on lime or clay is always ink. Never use lime as text on light surfaces. Backgrounds are solid: no gradients or patterns. The accent is the same in both themes.

### Typography

Bricolage Grotesque (600-800) for headings, buttons, tabs, table headers and the wordmark. Plus Jakarta Sans (400-700) for body, forms and tables. Code uses the `ui-monospace` stack. Fonts load in `src/lib/fonts.ts`.

### Shape tokens

| Token | Value |
| --- | --- |
| `--radius-pill` | `999px` (buttons, chips, tabs, header) |
| `--radius-card` | `1rem` |
| `--radius-control` | `0.85rem` (inputs, icon buttons) |
| `--border-width-strong` / `--border-width-card` | `3px` / `2px` |
| `--shadow-hard` | `4px 4px 0 var(--shadow-color)` |
| `--shadow-hover` | `4px 6px 0 var(--shadow-color)` |
| `--shadow-pressed` | `1px 1px 0 var(--shadow-color)` |
| `--press-x`, `--press-y` | `3px` |

If you change `--shadow-hard`, change the press offsets to match.

### Components

- **Primary button** (`default`, also `secondary`, `destructive`, and `quiet` for secondary actions such as "About me"): filled, ink text, 3px ink border, hard shadow, pill.
- **Flat button** (`outline`, `ghost`, `link`): outlined, no shadow, only changes colour. Used for chips and grouped controls.
- **Icon button**: square 2.75rem, 2px ink border, `--radius-control`, hard shadow; lifts and presses like a button.
- **Cards, drawers, modals**: `--card` fill, 2px `--ink-fixed` border (not the soft `--border`), 1rem radius, `--shadow-hard`. Drawer for long content; centred modal for short confirmations and forms up to three fields.
- **Inputs**: 2px `--border`, `--radius-control`, `--card` background.
- **Grouped controls**: the group owns the border and shadow; items have neither.
- **Content links**: foreground colour with a persistent underline.
- **Icons**: Tabler.

### Pressed behavior

Elements sit on their shadow, lift on hover and sink into it when pressed. Transition: `transform 140ms ease-out, box-shadow 140ms ease-out`, disabled under `prefers-reduced-motion`.

| State | Buttons and icon buttons | Cards (only when the whole card is a link or action) |
| --- | --- | --- |
| Rest | `--shadow-hard` | 3px border, 1.5rem radius, `5px 5px 0` shadow |
| Hover | `translateY(-2px)`, `--shadow-hover` | `translateY(-3px)` plus a 0.5° tilt (alternating on even items), same shadow |
| Pressed | `translate(3px, 3px)`, `--shadow-pressed` | `translate(5px, 5px)`, shadow `0 0 0` |
| Disabled | 55% opacity, no hover, no press | no press |

How it is wired:
1. `Button` sets `data-pressable="button"` (filled variants) or `"icon"` (icon sizes) itself. Outline, ghost and link buttons are not pressable; `quiet` is. Link cards set `data-pressable="card"` by hand.
2. `PressedProvider` (`src/components/pressed-provider.tsx`) sets `data-pressed` on pointer down, and on Enter or Space when the element has focus. It clears it on pointer up, cancel, leave and blur, and ignores presses that start on a nested button, link or input.
3. CSS in `globals.css` applies the transform and shadow from `--press-x` and `--press-y`.

### Landing and call-to-action buttons

Hero and section actions (GitHub, "About me", "Live site", "View all") are buttons, not cards, and every one of them must press.

- Primary action: `Button` (lime, 3px black border, pill).
- Secondary action beside it, such as "About me": `Button variant="quiet"`. It has the same hard shadow, hover lift and press as the primary. Never render it as a flat outlined button or a plain link.
- `Button` sets `data-pressable="button"` itself; do not add it by hand. For links use `<Button asChild><Link ...>`.
- Do not wrap a button in a pressable card, or nest two pressable elements.
- Icon-only actions use `size="icon"` (square 2.75rem, `--radius-control`) with the same press.
- `outline`, `ghost` and `link` stay flat; do not use them for landing actions.
- Buttons move 3px and their shadow shrinks to `1px 1px 0`; cards move 5px and their shadow goes flat. Keep the two distinct.

Do:
- Make a card pressable only when the whole card is clickable.
- Use the tokens instead of hand-written shadow values.
- Keep a visible focus ring and keyboard press support.

Don't:
- Make static cards (info panels, forms, drawers, modals) lift or press.
- Put hard shadows on flat (outline, ghost, link) buttons, chips, tabs, menu items or grouped controls.
- Animate other properties, use bouncy easing, stack a second shadow, or use blurred shadows.
- Rely on movement alone for state; selected, disabled and loading also need a colour, text or icon change.

Tabs, switches, menu items, sort headers and input add-ons only change colour.

### Styled and unstyled

`<html data-style="unstyled">` keeps colours and fonts but uses 1px borders, small radii, no hard shadows and `--press-x/y: 0`. Styled is the default. There is no UI toggle yet.
