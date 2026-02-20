# APIClaw Design System

> "If Jason Calacanis would see this, it should look like a $10M funded startup."

## Brand Identity

**APIClaw** — The API layer for AI agents. A lobster claw 🦞 represents precision, grip, and the ability to grab exactly what you need from the API ecosystem.

---

## Logo

### Files
- `public/logo.svg` — Full gradient logo with details
- `public/logo-simple.svg` — Simplified gradient mark
- `public/logo-mono.svg` — Monochrome (uses `currentColor`)
- `public/icon.svg` — App icon with background
- `public/favicon.svg` — Favicon with rounded background

### Usage
- **Primary:** `logo-simple.svg` for most applications
- **Mono:** Use `logo-mono.svg` on colored backgrounds or when single-color is needed
- **Icon:** Use `icon.svg` for app stores, social profiles

### Clear Space
Maintain minimum clear space of 25% of logo width on all sides.

---

## Color Palette

### Primary — Lobster Red
The signature color. Energetic, memorable, action-oriented.

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Red 50** | `#fef2f2` | 254, 242, 242 | Subtle backgrounds |
| **Red 100** | `#fee2e2` | 254, 226, 226 | Hover states |
| **Red 200** | `#fecaca` | 254, 202, 202 | Borders, dividers |
| **Red 300** | `#fca5a5` | 252, 165, 165 | Light accents |
| **Red 400** | `#f87171` | 248, 113, 113 | **Primary light** |
| **Red 500** | `#ef4444` | 239, 68, 68 | **Primary** ⭐ |
| **Red 600** | `#dc2626` | 220, 38, 38 | **Primary dark** |
| **Red 700** | `#b91c1c` | 185, 28, 28 | Pressed states |
| **Red 800** | `#991b1b` | 153, 27, 27 | Deep accents |
| **Red 900** | `#7f1d1d` | 127, 29, 29 | Darkest red |

### Neutrals — Refined Dark
Premium dark palette inspired by Vercel and Linear.

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Neutral 950** | `#0a0a0a` | 10, 10, 10 | **Background** (dark mode) |
| **Neutral 900** | `#171717` | 23, 23, 23 | **Surface** |
| **Neutral 800** | `#1f1f1f` | 31, 31, 31 | **Surface elevated** |
| **Neutral 700** | `#262626` | 38, 38, 38 | Cards, modals |
| **Neutral 600** | `#404040` | 64, 64, 64 | **Borders** |
| **Neutral 500** | `#525252` | 82, 82, 82 | Icons inactive |
| **Neutral 400** | `#737373` | 115, 115, 115 | **Text muted** |
| **Neutral 300** | `#a3a3a3` | 163, 163, 163 | **Text secondary** |
| **Neutral 200** | `#d4d4d4` | 212, 212, 212 | Text normal |
| **Neutral 100** | `#e5e5e5` | 229, 229, 229 | Borders (light mode) |
| **Neutral 50** | `#f5f5f5` | 245, 245, 245 | Background (light mode) |
| **White** | `#fafafa` | 250, 250, 250 | **Text primary** (dark) |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#22c55e` | Confirmations, positive states |
| **Warning** | `#f59e0b` | Caution, pending states |
| **Error** | `#ef4444` | Errors (same as primary) |
| **Info** | `#3b82f6` | Informational, links |

### Gradients

```css
/* Primary gradient - for CTAs and hero elements */
background: linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%);

/* Subtle glow effect */
box-shadow: 0 0 80px rgba(239, 68, 68, 0.2);

/* Text gradient animation */
background: linear-gradient(135deg, #ef4444 0%, #f87171 50%, #fca5a5 100%);
background-size: 200% 200%;
animation: gradient 5s ease infinite;
```

---

## Typography

### Font Stack

```css
/* Headlines & Body */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Code & Terminal */
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

### Type Scale

| Element | Size | Weight | Letter Spacing | Line Height |
|---------|------|--------|----------------|-------------|
| **H1** | 4.5rem (72px) | 800 | -0.03em | 1.1 |
| **H2** | 2.25rem (36px) | 700 | -0.02em | 1.2 |
| **H3** | 1.5rem (24px) | 600 | -0.01em | 1.3 |
| **Body** | 1rem (16px) | 400 | 0 | 1.6 |
| **Body Large** | 1.25rem (20px) | 400 | 0 | 1.5 |
| **Small** | 0.875rem (14px) | 400 | 0 | 1.5 |
| **Label** | 0.75rem (12px) | 600 | 0.15em | 1.4 |
| **Code** | 0.875rem (14px) | 400 | 0 | 1.6 |

### OpenType Features
```css
font-feature-settings: "cv11", "ss01";
```

---

## Components

### Buttons

```css
/* Primary CTA */
.btn-primary {
  padding: 12px 24px;
  font-weight: 600;
  border-radius: 12px;
  background: #ef4444;
  color: #0a0a0a;
  transition: all 0.2s ease;
}
.btn-primary:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Secondary */
.btn-secondary {
  padding: 12px 24px;
  font-weight: 500;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.btn-secondary:hover {
  border-color: #ef4444;
}
```

### Cards

```css
.card {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  transform: translateY(-4px);
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow: 0 12px 40px rgba(239, 68, 68, 0.1);
}
```

### Terminal

```css
.terminal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.terminal-header {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-elevated);
}
.terminal-dot { width: 12px; height: 12px; border-radius: 50%; }
.terminal-dot-red { background: #ff5f57; }
.terminal-dot-yellow { background: #febc2e; }
.terminal-dot-green { background: #28c840; }
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
```

---

## Spacing

Base unit: **4px**

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Icon spacing |
| md | 16px | Component padding |
| lg | 24px | Section gaps |
| xl | 32px | Card padding |
| 2xl | 48px | Section margins |
| 3xl | 64px | Large sections |
| 4xl | 96px | Hero spacing |

---

## Border Radius

| Name | Value | Usage |
|------|-------|-------|
| sm | 6px | Inputs, small elements |
| md | 8px | Badges, chips |
| lg | 12px | Buttons, cards |
| xl | 16px | Modals, large cards |
| 2xl | 24px | Hero elements |
| full | 9999px | Pills, avatars |

---

## Shadows

```css
/* Subtle */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

/* Default */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Medium */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Large */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Glow (accent) */
box-shadow: 0 0 80px rgba(239, 68, 68, 0.2);

/* Glow subtle */
box-shadow: 0 0 40px rgba(239, 68, 68, 0.1);
```

---

## Animation

### Timing Functions
```css
/* Default ease */
transition: all 0.2s ease;

/* Smooth bounce */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Spring */
transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Keyframes
```css
@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Assets Checklist

- [x] `public/logo.svg` — Full gradient logo
- [x] `public/logo-simple.svg` — Simplified mark
- [x] `public/logo-mono.svg` — Monochrome version
- [x] `public/icon.svg` — App icon with background
- [x] `public/favicon.svg` — SVG favicon
- [ ] `public/favicon.ico` — ICO format (generated)
- [ ] `public/favicon-16x16.png` — 16px PNG
- [ ] `public/favicon-32x32.png` — 32px PNG
- [ ] `public/apple-touch-icon.png` — 180px for iOS
- [ ] `public/og-image.png` — 1200x630 social sharing

---

## Implementation Notes

### Next.js Head
```tsx
<Head>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta property="og:image" content="https://apiclaw.com/og-image.png" />
</Head>
```

### Tailwind Config
Colors are defined in `tailwind.config.ts` and CSS variables in `globals.css`.

---

## Inspiration Sources

- **Stripe** — Clean typography, professional feel
- **Vercel** — Dark mode excellence, premium polish
- **Linear** — Refined interactions, attention to detail
- **Raycast** — Developer-focused, crisp design

---

*Design System v1.0 — APIClaw by NordSym*
