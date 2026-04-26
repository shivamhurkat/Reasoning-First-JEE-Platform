---
name: Aura Performance
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#ddb7ff'
  on-secondary: '#4a0080'
  secondary-container: '#7900cd'
  on-secondary-container: '#ddb7ff'
  tertiary: '#ffb77d'
  on-tertiary: '#4d2600'
  tertiary-container: '#cf7d30'
  on-tertiary-container: '#432100'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0050'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

This design system is engineered for high-achievers. It adopts a **Minimalist-Glassmorphic** style that draws heavily from the "Linear" aesthetic—combining ultra-dark canvases with razor-sharp precision. The personality is unapologetically elite and performance-oriented, designed to make users feel like they are entering a high-stakes, high-reward environment. 

The visual language relies on depth created through subtle luminance rather than heavy shadows. It utilizes "glow-as-affordance" to guide the eye toward primary conversion points, maintaining a confident, uncluttered interface that prioritizes speed and clarity.

## Colors

The palette centers on a deep, obsidian-like navy (`#0A0C10`) which provides a premium foundation for high-contrast elements. **Electric Blue** serves as the primary action color, signifying technological precision. **Violet** is used for secondary accents and depth-inducing gradients, while **Soft Orange** is reserved strictly for moments of achievement, urgency, or "glow" highlights.

Text follows a strict hierarchy: pure white for primary headlines to ensure maximum readability, and a muted off-white/grey for secondary information to maintain the dark-mode aesthetic without causing eye strain.

## Typography

The design system utilizes **Inter** across all levels to achieve a systematic, utilitarian, and modern feel. The hierarchy is defined by aggressive weight contrasts. Headlines are bold and tightly tracked (negative letter spacing) to feel impactful and "locked-in." 

Body text remains spacious with a generous line-height to ensure readability during long study sessions. A specialized "Label Caps" style is used for eyebrow headlines and small metadata to provide an editorial, premium touch.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop (12 columns) and a **Fluid Grid** for mobile devices. The spacing logic is built on an 8px base unit, ensuring mathematical harmony across all components.

Mobile-first constraints dictate that vertical rhythm is prioritized. Large sections are separated by `xl` spacing to create a sense of prestige and "breathing room," preventing the elite content from feeling crowded. Container margins are generous to keep focus on the center-weighted content.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Glassmorphism**. Rather than traditional black shadows, this design system uses:

1.  **Inner Glows:** 1px semi-transparent borders (top and left) to simulate a light source from above.
2.  **Backdrop Blurs:** Surfaces use a 12px-20px blur with a 5% white overlay to create a "frosted glass" look over background gradients.
3.  **Luminescent Gradients:** Subtle radial gradients (Violet to Navy) sit behind key sections to lift them off the base background.
4.  **Stroke Elevation:** Floating cards use a 1px border with a `linear-gradient` from white (10% opacity) to transparent to define edges sharply.

## Shapes

The shape language is **Rounded**, following modern OS standards (like macOS). This softens the high-contrast "sharpness" of the dark theme, making the "elite" positioning feel accessible and polished rather than aggressive. 

Standard components use a 0.5rem (8px) radius. Larger cards and containers scale up to 1rem or 1.5rem to create a nested, organic feel. High-action buttons may occasionally use pill-shapes to differentiate them from static card elements.

## Components

### Buttons
Primary buttons use a solid Electric Blue fill with a subtle "inner-shimmer" gradient. Hover states should trigger a soft blue outer glow. Secondary buttons use the "Ghost" style—thin borders with white text.

### Cards
Cards are the hallmark of this design system. They feature a `1px` border (white at 10% opacity) and a background color slightly lighter than the base navy (`#161920`). On mobile, cards should span the full width of the screen with `md` horizontal padding.

### Input Fields
Inputs are dark-filled with a subtle bottom-border highlight. On focus, the border transitions to Electric Blue with a 4px soft outer glow.

### Chips & Badges
Small, high-contrast pills with "Label Caps" typography. Use Violet for "Premium" features and Soft Orange for "New" or "Live" indicators.

### Progress Indicators
Thin, sleek bars using a gradient from Electric Blue to Violet. These should have a slight "pulse" animation to signify active performance tracking.