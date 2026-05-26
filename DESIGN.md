---
name: Gamasa Properties
description: Calm Arabic-first real estate product for finding, booking, and managing rentals in Gamasa.
colors:
  primary: "#3b82f6"
  background-light: "#f6f7fb"
  background-dark: "#121520"
  surface-light: "#fcfdff"
  surface-dark: "#1e2130"
  surface-dim: "#f8fafc"
  border-light: "#d0d5e7"
  border-dark: "#2a3142"
  text-main: "#0e111b"
  text-muted: "#4e5f97"
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef4444"
  info: "#06b6d4"
typography:
  display:
    fontFamily: "Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "normal"
  headline:
    fontFamily: "Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
    height: "44px"
  input-default:
    backgroundColor: "{colors.surface-dim}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
    height: "48px"
  card-default:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: Gamasa Properties

## 1. Overview

**Creative North Star: "The Trusted Coastal Desk"**

Gamasa Properties is a product interface, not a campaign surface. It should feel calm, competent, and local: a reliable real estate desk that happens to live on a phone, tablet, and desktop. The design serves decisions: compare properties, understand price and location, save a shortlist, book, add a listing, and manage status.

The system rejects generic SaaS drama, decorative glassmorphism, nested cards, and heavy purple-blue gradients. It uses restrained blue as a functional accent, tinted neutral surfaces, clear Arabic hierarchy, and stable touch-first controls.

**Key Characteristics:**
- Arabic-first and RTL-native.
- Calm, practical, and trustworthy.
- Touch-first on mobile, denser on desktop.
- Clear state handling for loading, empty, error, disabled, offline, and long-text cases.

## 2. Colors

The palette is restrained: soft tinted neutrals carry the interface, while blue marks primary actions, current selection, and important status.

### Primary
- **Reliable Coastal Blue**: Used for primary actions, active navigation, selected filters, and the strongest trust signals.

### Secondary
- **Success Green**: Used only for verified, available, successful, or completed states.
- **Warning Amber**: Used for pending, attention, or offline notices.
- **Error Red**: Used for destructive actions, failed requests, and validation.

### Neutral
- **Cool Page Mist**: The default light app background.
- **White-Tinted Surface**: Cards, sheets, headers, forms, and raised panels.
- **Deep Night Surface**: Dark mode surfaces without pure black.
- **Slate Ink**: Primary text.
- **Muted Blue Slate**: Secondary text and metadata.
- **Soft Border Blue**: Dividers, outlines, chips, and low-emphasis containers.

### Named Rules
**The Accent Rarity Rule.** Blue is functional, not decorative. If everything is blue, nothing is primary.

**The No Pure Extremes Rule.** Avoid pure black and pure white in new UI. Use tinted neutrals so surfaces feel softer and less glaring.

## 3. Typography

**Display Font:** Noto Sans Arabic with system fallback  
**Body Font:** Noto Sans Arabic with system fallback  
**Label/Mono Font:** System fallback only when Latin technical text requires it

**Character:** The type is direct and readable. It favors strong weights for page titles and restrained body text for scanning property details.

### Hierarchy
- **Display** (900, 2.25rem+, 1.15): Home hero and rare page-level statements only.
- **Headline** (900, 1.875rem, 1.2): Screen titles and major sections.
- **Title** (800, 1.125rem, 1.35): Cards, panels, sheets, and form groups.
- **Body** (400-600, 1rem, 1.7): Descriptions, helper text, property summaries, and error explanations.
- **Label** (700, 0.875rem, 1.4): Buttons, chips, form labels, tabs, and compact controls.

### Named Rules
**The Arabic Breathing Rule.** Arabic text must not be clipped, over-compressed, or forced into one line when two lines are clearer.

## 4. Elevation

Elevation is structural and subtle. Most depth comes from borders, tonal layering, and small shadows. Large blurred shadows are reserved for floating mobile controls and high-value panels.

### Shadow Vocabulary
- **Soft Surface** (`0 4px 20px -2px rgba(0, 0, 0, 0.05)`): Resting cards and calm panels.
- **Primary Glow** (`0 0 20px rgba(37, 99, 235, 0.15)`): Rare primary emphasis and active controls.
- **Bottom Navigation** (`0 -10px 40px rgba(0, 0, 0, 0.08)`): Mobile navigation and floating action bars.

### Named Rules
**The State-Only Lift Rule.** Resting UI should feel stable. Motion and elevation appear mainly on hover, focus, active, open, or selected states.

## 5. Components

### Buttons
- **Shape:** Soft rounded rectangle (16px) or icon circle for compact actions.
- **Primary:** Blue background, tinted white text, 44px minimum height, icon plus label when space allows.
- **Hover / Focus:** Slight tonal shift, visible focus ring, no bounce or elastic motion.
- **Secondary / Ghost:** Neutral surface or transparent background with clear borders and text contrast.

### Chips
- **Style:** Rounded pills with border and tinted background.
- **State:** Selected chips use primary or semantic color with high contrast; unselected chips stay quiet.

### Cards / Containers
- **Corner Style:** 16-24px depending on scale; avoid nesting cards inside cards.
- **Background:** Tinted surface over cool page background.
- **Shadow Strategy:** Soft by default; stronger only for floating controls.
- **Border:** Low-contrast border for separation.
- **Internal Padding:** 16px on mobile, 20-24px on tablet and desktop.

### Inputs / Fields
- **Style:** Tinted field surface, 16px radius, 48px minimum height.
- **Focus:** Primary border or ring with no layout shift.
- **Error / Disabled:** Error text stays visible and specific; disabled state reduces contrast but keeps labels readable.

### Navigation
- **Style:** Desktop uses stable top navigation. Mobile uses thumb-reachable bottom navigation and sticky local headers.
- **States:** Active route must be visually distinct by color, filled icon, or indicator, not only hover.

### Property Card
- **Role:** The signature comparison unit.
- **Behavior:** Image, title, price, location, and quick save remain readable at small widths. Long titles may wrap to two lines; metadata must not squeeze the price.

## 6. Do's and Don'ts

### Do:
- **Do** keep all primary touch targets at least 44px.
- **Do** test at 390px, 768px, 1024px, and 1440px.
- **Do** use progressive disclosure on mobile and denser information on desktop.
- **Do** keep Arabic text aligned, readable, and resilient to long labels.
- **Do** show loading, empty, error, and offline states near the affected content.

### Don't:
- **Don't** make the product feel like a generic SaaS landing page.
- **Don't** use heavy purple or blue-purple gradients as the dominant identity.
- **Don't** rely on decorative glassmorphism, nested cards, or noisy shadows.
- **Don't** hide important workflows on mobile.
- **Don't** make Arabic text feel squeezed, clipped, or secondary.
- **Don't** use side-stripe borders, gradient text, bounce easing, or modal-first interaction when inline or sheet patterns fit better.
