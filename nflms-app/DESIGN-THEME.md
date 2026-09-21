# NFLMS Design Theme — Reference

Visual system used by the National Fisheries & Livestock Management System (NFLMS) back office and the public NFLMS Bazar portal. Copy this file into another project to reproduce the same look. Stack assumed: Tailwind CSS 3.x, lucide-react icons, Hind Siliguri for Bangla.

The style is **navy + blue, card-based, quiet**: a dark navy shell (sidebar / top bars / login left panel), a cool off-white canvas, white cards with 1 px borders and soft shadows, one saturated blue for actions, and semantic colours only for status.

---

## 1. Colour tokens

### Brand blue (primary actions, links, active states)

| Token | Hex | Use |
|---|---|---|
| `brand-50` | `#eaf1fd` | Selected tile / row background, soft badges |
| `brand-100` | `#d6e3fb` | Focus ring, selected ring |
| `brand-200` | `#adc7f7` | Focus ring (inputs), hover borders |
| `brand-300` | `#7ea6f0` | Accent text on navy (`NFLMS` in the logo), icon tint on dark |
| `brand-400` | `#4f83e6` | Gradient start, active-nav indicator bar |
| `brand-500` | `#2f62d9` | **Primary button**, active nav fill, chart primary |
| `brand-600` | `#2450c4` | Primary hover, link text, kicker text |
| `brand-700` | `#1d40a0` | Primary active, strong link text, gradient end |
| `brand-800` | `#18337e` | QR foreground, deep accents |

### Navy (shell / dark surfaces)

| Token | Hex | Use |
|---|---|---|
| `navy-950` | `#050b1a` | Login gradient end |
| `navy-900` | `#0a1730` | Modal backdrop base |
| `#0a1530` | — | **Sidebar, public header, assistant header** (literal) |
| `#0d1b3d` | — | Public sub-header (category strip) |
| `#08122b` | — | Login left panel base |
| `navy-800` | `#0f2247` | Reserved |
| `navy-700` | `#16305f` | Reserved |
| `navy-600` | `#1d3f7a` | Reserved |

Dark surfaces use `text-slate-200/300` for body, `text-slate-400/500` for secondary, and `white/10` borders (`border-white/10`), `white/5` hover fills, `white/15` active fills.

### Canvas & neutrals

| Token | Hex | Use |
|---|---|---|
| `cream` | `#f3f5f8` | **App canvas** (body background) |
| `#eef2f7` | — | Login right panel |
| `#f4f6f9` | — | Public portal canvas |
| `white` | `#ffffff` | Cards, inputs (on focus), header bar |
| `slate-50` | `#f8fafc` | Input resting background, table header, KPI sub-tiles |
| `slate-100` | `#f1f5f9` | Dividers (light), progress track, neutral badge |
| `slate-200` | `#e2e8f0` | **Card and input borders** |
| `slate-400/500` | | Secondary text, placeholders, table header labels |
| `slate-700/800` | | Body text |
| `slate-900` | `#0f172a` | Headings |

### Semantic (status only — never decorative)

| Meaning | Text / icon | Soft background | Solid |
|---|---|---|---|
| Success / Active / Present / Approved / Delivered | `emerald-600/700` | `emerald-50` | `emerald-500` |
| Warning / Pending / Late / Low stock / Expiring | `amber-600/700` | `amber-50` | `amber-500` |
| Danger / Absent / Rejected / Expired / Disease / High | `red-600/700` | `red-50` | `red-500` / `red-600` button |
| Info / Transfer / Open / Ongoing | `brand-600/700` | `brand-50` | `brand-500` |
| Special (leave, distribute, GMV) | `violet-600/700` | `violet-50` | `violet-500` |
| Tour / secondary info | `sky-600/700` | `sky-50` | `sky-500` |
| Neutral / Planned / Draft / Closed / Inactive | `slate-600/700` | `slate-100` / `slate-200` | — |

### Chart palette (in this order)

`#2f62d9` brand · `#f59e0b` amber · `#10b981` green · `#8b5cf6` violet · `#0ea5e9` sky · `#ef4444` red · `#94a3b8` slate.
Grid lines `#eef2f7`, cursor fill `#f1f5f9`, area fill = brand at 35 % → 0 % vertical gradient. Red is reserved for disease/deaths series.

### Category tint pairs (marketplace tiles, product badges)

`sky`, `teal`, `amber`, `stone`, `orange`, `slate`, `yellow`, `rose`, `emerald`, `lime`, `violet` — each as `bg-{c}-100` + `text-{c}-700`.

---

## 2. Typography

| Role | Font | Notes |
|---|---|---|
| Latin / UI | `"Segoe UI", system-ui, sans-serif` | default `font-sans` |
| Bangla | `"Hind Siliguri"` (400–700), fallback `"Anek Bangla"` | apply class `.bn` to any element that may contain Bangla |

Google Fonts link:
`https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Anek+Bangla:wght@400..700&display=swap`

Scale (Tailwind): page title `text-2xl font-bold text-slate-900`; card title `font-semibold text-slate-900`; body `text-sm text-slate-700/800`; secondary `text-xs text-slate-500`; micro labels `text-[11px] uppercase tracking-wide font-semibold text-slate-400/500`; KPI value `text-2xl font-bold tabular-nums`; login headline `text-[34px] leading-[1.15] font-bold tracking-tight`.

**Kicker** (module label above a title): `text-[11px] font-bold uppercase tracking-[.14em] text-brand-600`, e.g. `MODULE 02 · SUPPLY CHAIN`.

Numbers: always `tabular-nums`; right-align numeric table columns. Bangla numerals via a `toBn()` digit map when the UI language is Bangla. Currency `৳` with `en-IN` grouping (`৳1,39,000`).

---

## 3. Shape, elevation, motion

| Token | Value |
|---|---|
| Radius | inputs/buttons `rounded-lg` (8 px) · cards `rounded-xl` (12 px) · modals/hero `rounded-2xl` (16 px) · chips/badges `rounded-full` |
| Shadow `card` | `0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)` |
| Shadow `pop` | `0 12px 40px rgba(10,23,48,.18)` (hover cards, modals, floating widgets) |
| Border | `1px solid slate-200` on every card and input; `border-white/10` on dark |
| Transitions | `transition` default 150 ms; hover lift = `hover:shadow-pop hover:border-brand-300`; image zoom `scale-105 duration-500` |
| Animations | `fadeUp` (.5 s, translateY 12→0), `float` (5 s chip bob), `pulseRing` (2.4 s GPS ring), Tailwind `animate-ping` for presence dots |
| Backdrop | modals `bg-navy-950/50 backdrop-blur-[2px]`; lightbox `bg-black/90` |

---

## 4. Layout

**Officer shell**
- Sidebar 264 px, `#0a1530`, logo block 64 px tall with `border-b border-white/10`; nav groups with kicker-style group labels (`text-[10.5px] uppercase tracking-[.14em] text-slate-500`); items `px-2.5 py-2 text-[13.5px] rounded-lg`; active = `bg-brand-500/20 text-white` + 2 px left bar `shadow-[inset_2px_0_0_0_#4f83e6]`.
- Top bar 64 px, white, `border-b slate-200`: search pill, workspace badge, language toggle (segmented `bg-brand-500` active), bell with red dot, avatar (gradient `from-brand-400 to-brand-700`) + name.
- Content: `max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 pb-24` on the cream canvas.

**Public portal**
- Sticky header `#0a1530`: logo, search field (`bg-white/10 border-white/15`, turns white on focus), Sell / Cart / language; sub-strip `#0d1b3d` with category links (active `bg-white/15`).
- Hero: `rounded-2xl`, navy gradient `radial-gradient(700px 300px at 10% 0%, rgba(38,84,196,.55), transparent 60%), linear-gradient(120deg, #0b1633, #14306b)`.
- Content `max-w-7xl px-4 py-6`; white footer with tiny grey text.

**Login (split screen)**
- Left: navy with two radial blue glows + faint 48 px grid (`opacity-[.07]`), headline, floating module chips (`bg-white/[.06] border-white/10 backdrop-blur`) with SVG lines converging into a database icon, dots animated along the lines.
- Right: `#eef2f7`, two stacked white cards — *Workspace* selector (tiles with check mark, selected `border-brand-500 bg-brand-50 ring-2 ring-brand-100`) and *Sign in* (email with domain suffix addon, password, full-width primary button with arrow).

**Grid rhythm**: stat tiles `grid-cols-2 md:grid-cols-4 gap-3`; cards `gap-4`; page sections `mb-5/6`.

---

## 5. Component classes (drop into `@layer components`)

```css
.card        { @apply bg-white rounded-xl border border-slate-200 shadow-card; }
.input       { @apply w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400
               focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 focus:bg-white transition; }
.label       { @apply block text-[13px] font-semibold text-slate-700 mb-1.5; }
.btn         { @apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition select-none
               disabled:opacity-50 disabled:cursor-not-allowed; }
.btn-primary { @apply btn bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm; }
.btn-secondary { @apply btn bg-white text-slate-700 border border-slate-200 hover:bg-slate-50; }
.btn-ghost   { @apply btn text-slate-600 hover:bg-slate-100; }
.btn-danger  { @apply btn bg-red-600 text-white hover:bg-red-700; }
.badge       { @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap; }
.th          { @apply text-left text-[11px] uppercase tracking-wide font-semibold text-slate-500 px-4 py-2.5 bg-slate-50 border-b border-slate-200 whitespace-nowrap; }
.td          { @apply px-4 py-3 text-sm text-slate-700 border-b border-slate-100 align-middle; }
.kicker      { @apply text-[11px] font-bold uppercase tracking-[.14em] text-brand-600; }
.bn          { font-family: "Hind Siliguri", "Anek Bangla", "Segoe UI", sans-serif; }
```

Patterns built from these:

- **PageHeader**: kicker → `h1` → one-line subtitle in `text-sm text-slate-500`; actions right-aligned (`no-print`).
- **Stat tile**: card `p-4`, label `text-xs font-semibold text-slate-500`, icon in a 32 px rounded square tinted by tone (`bg-brand-50 text-brand-600` etc.), value `text-2xl font-bold tabular-nums`; clickable tiles lift on hover.
- **Table**: wrap in a card with `padded={false}`; filter bar `p-4 border-b border-slate-100`; rows `hover:bg-brand-50/40`, `cursor-pointer` when navigable; empty state = inbox icon + muted text.
- **Badge tones**: map status strings to the semantic table above (Active→emerald, Pending→amber, Rejected→red, Planned→slate, Transfer→brand, Distribute→violet, Tour→sky).
- **Modal**: `max-w-xl` (or `4xl` wide), header `px-5 py-4 border-b`, body `p-5` scrollable, footer buttons right-aligned, `animate-fadeUp`, Esc + backdrop close.
- **Tabs**: underline style, active `border-brand-500 text-brand-700`, counts in `bg-slate-100 rounded-full` pills.
- **Toast**: bottom-right cards with left icon (emerald check / amber triangle / brand info), 4.2 s auto-dismiss.
- **Progress bar**: `h-1.5 rounded-full bg-slate-100` track; fill emerald ≥ target, amber below, red critical.
- **Chip selector** (farm type, category): `rounded-md border` tiles, selected `border-brand-500 bg-brand-50 text-brand-700`.
- **Floating assistant**: 48 px circle `from-brand-500 to-brand-700`, expands on hover; panel 400 × 600, navy header, `bg-slate-50` message list, user bubbles `bg-brand-500` / assistant bubbles white with border.
- **Wizard stepper**: vertical list, current `bg-brand-500 text-white`, done = emerald check, step number `01`…`10`.
- **Certificate**: double `border-brand-700` frame (10 px), inner hairline `border-brand-200`, gradient medal, QR in `brand-800`.

---

## 6. Iconography & imagery

- UI icons: **lucide-react**, 15–18 px inline, 16–22 px in tiles; stroke only, never filled.
- Category / product icons: **Twemoji SVG** via jsdelivr (`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/{codepoint}.svg`) inside a tinted circle; fall back to the native emoji.
- Photos: `object-cover` in `h-40` card tops and 64 px thumbnails; product page uses hover-magnify + full-screen lightbox. Attribution chip `bg-black/40 text-white/80 text-[10px]` when required.
- Avatars: initials on `bg-gradient-to-br from-brand-400 to-brand-700`.

---

## 7. Language & content conventions

- Bilingual UI (Bangla default, English toggle). Keep IDs, product names, and technical tokens (FEFO, GPS, QR) in Latin script inside Bangla sentences.
- ID formats shown in `font-mono text-xs text-brand-700`: `FMR-YYYY-########`, `FAR-DD-######`, `LST-######`, `ORD-######`, `CERT-YYYY-######`.
- Dates: `21 Sep 2026` / `২১ সেপ্টেম্বর ২০২৬`; times `HH:MM`.
- Print: hide `.no-print` elements, white background.

---

## 8. Tailwind config (copy)

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#050b1a', 900: '#0a1730', 800: '#0f2247', 700: '#16305f', 600: '#1d3f7a' },
        brand: { 50: '#eaf1fd', 100: '#d6e3fb', 200: '#adc7f7', 300: '#7ea6f0', 400: '#4f83e6', 500: '#2f62d9', 600: '#2450c4', 700: '#1d40a0', 800: '#18337e' },
        cream: '#f3f5f8',
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        bn: ['"Hind Siliguri"', '"Anek Bangla"', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)',
        pop: '0 12px 40px rgba(10,23,48,.18)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseRing: { '0%': { transform: 'scale(.9)', opacity: '.6' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        pulseRing: 'pulseRing 2.4s ease-out infinite',
        fadeUp: 'fadeUp .5s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
}
```

Base CSS:

```css
@tailwind base; @tailwind components; @tailwind utilities;
html, body, #root { height: 100%; }
body { @apply bg-cream text-slate-800 font-sans antialiased; }
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
@media print { .no-print { display: none !important; } body { background: white; } }
```

---

## 9. Do / Don't

**Do**
- Keep one accent (brand blue) for every interactive element; let semantic colours mean status only.
- Put dark navy only on shells (sidebar, headers, login) — never on content cards.
- Use soft-tinted badges (`-50` bg + `-700` text) rather than solid colour blocks in tables.
- Give every card a 1 px `slate-200` border **and** the `card` shadow; hover lifts to `pop`.
- Keep numbers tabular and right-aligned; show units in a lighter, smaller span after the value.

**Don't**
- Don't introduce green as a brand colour (the source deck's `#1f7a5c` palette was deliberately replaced by blue).
- Don't use pure black text or borders; the darkest neutral is `slate-900`.
- Don't stack more than two shadows or use coloured shadows.
- Don't use filled icons or emoji for UI controls; Twemoji is for category/product illustration only.
