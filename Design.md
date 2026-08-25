# Design — Nanobox

## Design System Overview

All visual tokens are CSS custom properties defined in `src/themes/base.css` (defaults)
and overridden per-theme in `src/themes/[theme-name].css` using the selector
`:root[data-theme="theme-name"]`. Switching themes is a single attribute set:
`document.documentElement.dataset.theme = themeId`.

### Token Reference

| Token | Purpose |
|---|---|
| `--nb-surface` | Widget / panel background |
| `--nb-surface-alt` | Secondary surface (inset areas, hover states) |
| `--nb-text` | Primary body text |
| `--nb-text-muted` | De-emphasised text (labels, metadata) |
| `--nb-accent` | Primary interactive colour (buttons, links, highlights) |
| `--nb-accent-text` | Text on top of `--nb-accent` background |
| `--nb-radius` | Border radius applied to widgets and controls |
| `--nb-border-style` | Border appearance preset (`none` / `1px solid` / etc.) |
| `--nb-font-family` | Primary typeface stack |
| `--nb-font-scale` | Multiplier for base font size (1 = normal) |

### Colourblind Palette Override

Enabled by toggling "Colourblind palette" in Settings. Applies Okabe-Ito colours
on top of the active theme:

| Override | Value |
|---|---|
| `--nb-accent` | `#0072B2` (Okabe-Ito blue) |
| `--nb-accent-text` | `#ffffff` |
| `--nb-surface-alt` | `#003F6B` |

Stored in `localStorage` as `nb-colorblind`. Independent of the active theme.

---

## Themes

### Liquid Glass

A frosted-glass macOS-inspired aesthetic. Translucent surfaces, strong blur, rounded corners.

| Token | Value |
|---|---|
| `--nb-surface` | `rgba(232, 241, 251, 0.62)` |
| `--nb-surface-alt` | `rgba(200, 220, 245, 0.45)` |
| `--nb-text` | `#1a2332` |
| `--nb-text-muted` | `#4a6080` |
| `--nb-accent` | `#0059b3` |
| `--nb-accent-text` | `#ffffff` |
| `--nb-radius` | `22px` |
| `--nb-border-style` | `1px solid rgba(255,255,255,0.6)` |
| `--nb-font-family` | `-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif` |
| `--nb-font-scale` | `1` |

---

### Matte (default)

Warm, paper-like surfaces. The default theme — calm and readable.

| Token | Value |
|---|---|
| `--nb-surface` | `#efece4` |
| `--nb-surface-alt` | `#e0dbd0` |
| `--nb-text` | `#2b2b2b` |
| `--nb-text-muted` | `#6b6560` |
| `--nb-accent` | `#2b3a67` |
| `--nb-accent-text` | `#ffffff` |
| `--nb-radius` | `4px` |
| `--nb-border-style` | `1px solid #c8c2b8` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Glossy

Clean blue-white surfaces with a polished, modern feel.

| Token | Value |
|---|---|
| `--nb-surface` | `#eef4ff` |
| `--nb-surface-alt` | `#dce8fa` |
| `--nb-text` | `#0d1b2a` |
| `--nb-text-muted` | `#4a6080` |
| `--nb-accent` | `#0b5fc9` |
| `--nb-accent-text` | `#ffffff` |
| `--nb-radius` | `10px` |
| `--nb-border-style` | `1px solid #b8d0f0` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Retro

Dark terminal aesthetic. Phosphor green on near-black. Monospace only.

| Token | Value |
|---|---|
| `--nb-surface` | `#050805` |
| `--nb-surface-alt` | `#0d130d` |
| `--nb-text` | `#33ff66` |
| `--nb-text-muted` | `#1a7a33` |
| `--nb-accent` | `#ffb000` |
| `--nb-accent-text` | `#000000` |
| `--nb-radius` | `2px` |
| `--nb-border-style` | `1px solid #1a4d1a` |
| `--nb-font-family` | `"Courier New", "Lucida Console", monospace` |
| `--nb-font-scale` | `1` |

---

### Cyberpunk

Neon cyan on deep purple-black. Sharp corners. Hacker aesthetic.

| Token | Value |
|---|---|
| `--nb-surface` | `#0d0221` |
| `--nb-surface-alt` | `#160a35` |
| `--nb-text` | `#e0e0ff` |
| `--nb-text-muted` | `#8080c0` |
| `--nb-accent` | `#00e5ff` |
| `--nb-accent-text` | `#000000` |
| `--nb-radius` | `6px` |
| `--nb-border-style` | `1px solid #00e5ff40` |
| `--nb-font-family` | `"Share Tech Mono", "Courier New", monospace` |
| `--nb-font-scale` | `1` |

---

### Steampunk

Warm sepia tones, aged-brass accents. Serif typeface. Victorian mechanical mood.

| Token | Value |
|---|---|
| `--nb-surface` | `#2b1d12` |
| `--nb-surface-alt` | `#3a2618` |
| `--nb-text` | `#f0dfc0` |
| `--nb-text-muted` | `#a08060` |
| `--nb-accent` | `#e0a83f` |
| `--nb-accent-text` | `#1a0f08` |
| `--nb-radius` | `8px` |
| `--nb-border-style` | `2px solid #8b6914` |
| `--nb-font-family` | `Georgia, "Times New Roman", serif` |
| `--nb-font-scale` | `1` |

---

### Standard

Clean, neutral, mid-grey. Minimal personality — good baseline for customisation.

| Token | Value |
|---|---|
| `--nb-surface` | `#f5f5f5` |
| `--nb-surface-alt` | `#e8e8e8` |
| `--nb-text` | `#1a1a1a` |
| `--nb-text-muted` | `#666666` |
| `--nb-accent` | `#4a7dfc` |
| `--nb-accent-text` | `#ffffff` |
| `--nb-radius` | `6px` |
| `--nb-border-style` | `1px solid #d0d0d0` |
| `--nb-font-family` | `system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Nord

Based on the Nord colour palette. Cool arctic blues and greys. Dark background.

| Token | Value |
|---|---|
| `--nb-surface` | `#2e3440` |
| `--nb-surface-alt` | `#3b4252` |
| `--nb-text` | `#eceff4` |
| `--nb-text-muted` | `#9099a8` |
| `--nb-accent` | `#88c0d0` |
| `--nb-accent-text` | `#2e3440` |
| `--nb-radius` | `8px` |
| `--nb-border-style` | `1px solid #4c566a` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Dracula

Based on the Dracula colour scheme. Purple-tinted dark. Widely recognised by developers.

| Token | Value |
|---|---|
| `--nb-surface` | `#282a36` |
| `--nb-surface-alt` | `#343746` |
| `--nb-text` | `#f8f8f2` |
| `--nb-text-muted` | `#8b90a0` |
| `--nb-accent` | `#bd93f9` |
| `--nb-accent-text` | `#282a36` |
| `--nb-radius` | `8px` |
| `--nb-border-style` | `1px solid #44475a` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Solarized Dark

Based on the Solarized colour scheme by Ethan Schoonover. Carefully balanced contrast.

| Token | Value |
|---|---|
| `--nb-surface` | `#002b36` |
| `--nb-surface-alt` | `#073642` |
| `--nb-text` | `#93a1a1` |
| `--nb-text-muted` | `#657b83` |
| `--nb-accent` | `#268bd2` |
| `--nb-accent-text` | `#fdf6e3` |
| `--nb-radius` | `6px` |
| `--nb-border-style` | `1px solid #0a4050` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Forest

Deep greens and earthy tones. Natural, grounded feel.

| Token | Value |
|---|---|
| `--nb-surface` | `#1b2b1e` |
| `--nb-surface-alt` | `#243328` |
| `--nb-text` | `#d4e8d4` |
| `--nb-text-muted` | `#7a9e7a` |
| `--nb-accent` | `#7cae5a` |
| `--nb-accent-text` | `#1b2b1e` |
| `--nb-radius` | `10px` |
| `--nb-border-style` | `1px solid #3a5a3a` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Deep Ocean

Dark aqua and teal. Calm, deep-water aesthetic.

| Token | Value |
|---|---|
| `--nb-surface` | `#0a1e2b` |
| `--nb-surface-alt` | `#112840` |
| `--nb-text` | `#c8eaf0` |
| `--nb-text-muted` | `#6a9aaa` |
| `--nb-accent` | `#3ec6e0` |
| `--nb-accent-text` | `#0a1e2b` |
| `--nb-radius` | `12px` |
| `--nb-border-style` | `1px solid #1a4a60` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Sunset

Warm pinks, corals, and dusty purples. Soft, romantic mood.

| Token | Value |
|---|---|
| `--nb-surface` | `#2b1420` |
| `--nb-surface-alt` | `#3a1e2e` |
| `--nb-text` | `#fbe4d8` |
| `--nb-text-muted` | `#c08080` |
| `--nb-accent` | `#ff6b6b` |
| `--nb-accent-text` | `#2b1420` |
| `--nb-radius` | `14px` |
| `--nb-border-style` | `1px solid #6a2a40` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Monochrome

Pure greyscale. Maximum legibility. No colour distractions.

| Token | Value |
|---|---|
| `--nb-surface` | `#1a1a1a` |
| `--nb-surface-alt` | `#2a2a2a` |
| `--nb-text` | `#e8e8e8` |
| `--nb-text-muted` | `#888888` |
| `--nb-accent` | `#d0d0d0` |
| `--nb-accent-text` | `#1a1a1a` |
| `--nb-radius` | `4px` |
| `--nb-border-style` | `1px solid #444444` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Cotton Candy

Soft pastel pinks and purples. Light, airy, gentle.

| Token | Value |
|---|---|
| `--nb-surface` | `#fdf0f7` |
| `--nb-surface-alt` | `#f5d8ee` |
| `--nb-text` | `#4a3350` |
| `--nb-text-muted` | `#9a7aa8` |
| `--nb-accent` | `#f4a6d7` |
| `--nb-accent-text` | `#4a3350` |
| `--nb-radius` | `20px` |
| `--nb-border-style` | `1px solid #e8b8e0` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Industrial

Dark concrete greys with amber accents. Utilitarian, heavy.

| Token | Value |
|---|---|
| `--nb-surface` | `#2b2b2b` |
| `--nb-surface-alt` | `#383838` |
| `--nb-text` | `#d8d8d8` |
| `--nb-text-muted` | `#888888` |
| `--nb-accent` | `#e08a3c` |
| `--nb-accent-text` | `#1a1a1a` |
| `--nb-radius` | `2px` |
| `--nb-border-style` | `2px solid #555555` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

### Galaxy

Deep space blacks with violet and starlight accents.

| Token | Value |
|---|---|
| `--nb-surface` | `#0a0a1a` |
| `--nb-surface-alt` | `#12122a` |
| `--nb-text` | `#e8e4ff` |
| `--nb-text-muted` | `#8880c0` |
| `--nb-accent` | `#c77dff` |
| `--nb-accent-text` | `#0a0a1a` |
| `--nb-radius` | `14px` |
| `--nb-border-style` | `1px solid #3a2a6a` |
| `--nb-font-family` | `"Inter", system-ui, sans-serif` |
| `--nb-font-scale` | `1` |

---

## Typography

| Theme group | Font stack |
|---|---|
| Most themes | `"Inter", system-ui, sans-serif` |
| Liquid Glass | `-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif` |
| Retro | `"Courier New", "Lucida Console", monospace` |
| Cyberpunk | `"Share Tech Mono", "Courier New", monospace` |
| Steampunk | `Georgia, "Times New Roman", serif` |

`--nb-font-scale` multiplies the base font size (default `1rem = 16px`).
User can override this per-theme in Settings.

## Spacing & Radius

`--nb-radius` ranges from `2px` (Industrial, Retro — sharp/utilitarian) to `22px`
(Liquid Glass — fully rounded). Cotton Candy uses `20px`. Most themes cluster at
`4px`–`14px`.

User can also override the radius per-theme via the ThemeCustomizer in Settings.

## Border Styles

`--nb-border-style` accepts any valid CSS `border` shorthand value. Typical values:
`none`, `1px solid [colour]`, `2px solid [colour]`. The `1px solid rgba(255,255,255,0.6)`
on Liquid Glass creates the frosted-glass edge. Industrial and Steampunk use `2px`
to reinforce the heavy aesthetic.

Widget-level border style can be overridden per-widget-instance in the widget's
settings panel (none / hairline / thick / engraved presets).
