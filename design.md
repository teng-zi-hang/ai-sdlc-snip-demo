# Snip — Design System

Visual language borrowed from Lovable.dev: dark, minimal, warm coral/pink accent glow, generous whitespace.

---

## Color Tokens

| Token               | Value                                                                                                                   | Usage                              |
|---------------------|-------------------------------------------------------------------------------------------------------------------------|------------------------------------|
| `--bg`              | `#0e0e10`                                                                                                               | Page background                    |
| `--surface`         | `#18181b`                                                                                                               | Cards, pill-form background        |
| `--surface-2`       | `#1f1f23`                                                                                                               | Elevated surfaces, row hover       |
| `--border`          | `rgba(255, 255, 255, 0.08)`                                                                                             | All borders and dividers           |
| `--text`            | `#f4f4f5`                                                                                                               | Primary body text                  |
| `--muted`           | `#71717a`                                                                                                               | Secondary text, placeholders       |
| `--accent-1`        | `#f97316`                                                                                                               | Coral-orange — primary accent      |
| `--accent-2`        | `#ec4899`                                                                                                               | Pink — gradient terminus           |
| `--accent-gradient` | `linear-gradient(135deg, #f97316, #ec4899)`                                                                             | CTAs, hero title text fill         |
| `--glow-hero`       | `radial-gradient(ellipse 80% 40% at 50% -10%, rgba(249,115,22,.22) 0%, rgba(236,72,153,.14) 45%, transparent 70%)`     | Fixed background glow behind hero  |

---

## Typography

| Role             | Size                          | Weight | Color / Notes                              |
|------------------|-------------------------------|--------|--------------------------------------------|
| Hero title       | `clamp(2.5rem, 6vw, 4rem)`    | 700    | Accent gradient text-fill, `−0.03em` tracking |
| Hero subtitle    | `1.0625rem`                   | 400    | `--muted`                                  |
| Card heading     | `0.8125rem` + uppercase       | 600    | `--muted`, `0.08em` letter-spacing         |
| Body             | `1rem`                        | 400    | `--text`                                   |
| Small / meta     | `0.875rem`                    | 400    | `--muted`                                  |
| Code / monospace | `0.875rem`                    | 400    | `--accent-1` on tinted pill badge          |

**Font stack:** `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
**Source:** `@import` from Google Fonts (`Inter 400/500/600/700`) at the top of `styles.css`.

---

## Spacing

- Hero top padding: `6rem`; bottom: `3rem`
- Gap, headline → form: `2.5rem`
- Card / table horizontal padding: `1.5rem`
- Pill-form inner padding: `1.5rem` left; `0.375rem` all-sides inset for button

---

## Shape & Radius

| Token           | Value    | Used on                           |
|-----------------|----------|-----------------------------------|
| `--radius-pill` | `9999px` | Shorten form container and button |
| `--radius-card` | `1.25rem`| Cards, notice banners             |

---

## Borders, Shadows & Glow

- **All borders:** `1px solid var(--border)` (`rgba(255,255,255,0.08)`)
- **Card shadow:** `0 1px 3px rgba(0,0,0,.5), 0 0 0 1px var(--border)`
- **Pill form (rest):** `0 0 0 1px var(--border), 0 8px 32px rgba(0,0,0,.45)`
- **Pill form (focus):** `0 0 0 1px rgba(249,115,22,.5), 0 0 24px rgba(249,115,22,.15), 0 8px 32px rgba(0,0,0,.45)`
- **Hero glow:** `position:fixed` `::before` pseudo-element on `.hero` using `--glow-hero`; covers full viewport, `pointer-events:none`

---

## Element → System Mapping

| Snip element     | Design role                                                                                    |
|------------------|------------------------------------------------------------------------------------------------|
| `<h1>Snip</h1>`  | Hero headline — large bold text with accent gradient fill                                      |
| `.hero-sub`      | One-line muted subline: "Paste a URL. Get a short link. Instantly."                            |
| URL form         | `.shorten-form` pill container (`--surface` bg + `--radius-pill`) with inline gradient button  |
| Result notice    | `.notice--success` — `rgba(249,115,22,.08)` bg, warm border, `--accent-1` link                 |
| Error notice     | `.notice--error` — `rgba(239,68,68,.08)` bg, red border, soft `#fca5a5` text                   |
| Links section    | `.card` — `--surface` bg, `--radius-card`, `1px` border, card shadow                          |
| Table rows       | `--border` row dividers; code column: monospace pill badge; URL column: muted + truncated      |
