---
name: Obsidian Telemetry
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb693'
  primary: '#ffb693'
  on-primary: '#561f00'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#a04100'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#5f97ff'
  on-tertiary-container: '#002f6b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
  carbon-slate: '#111827'
  surface-border: '#1E293B'
  telemetry-amber: '#F59E0B'
  severity-critical: '#EF4444'
  severity-high: '#F59E0B'
  severity-medium: '#EAB308'
  severity-low: '#10B981'
  signal-cyan: '#06B6D4'
typography:
  display-lg:
    fontFamily: JetBrains Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: JetBrains Mono
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: JetBrains Mono
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  telemetry-readout:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0.02em
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies the precision, grit, and analytical authority of an advanced automotive telemetry bench and flight-ready diagnostic station. The target audience includes master technicians, automotive diagnostic engineers, performance tuners, and high-performance workshop managers who rely on rapid, mission-critical data processing under harsh workshop illumination and high-stress environments.

The visual style is a hybrid of **Precision Neo-Brutalism** and **Tactile Glassmorphic Carbon**. It fuses machined hardware tactility with real-time digital computing:
- **Atmosphere:** Deep obsidian carbon backdrops reduce eye strain in dimly lit bays while maximizing contrast for high-luminance diagnostic telemetry.
- **Physicality:** Components feel grounded and anodized. Panels emulate CNC-milled chassis frames, knurled toggles, and laser-etched readouts rather than soft consumer software.
- **Energy & Focus:** High-contrast neon amber and electric cyan act as functional beacons, directing user attention strictly to live telemetry deltas, anomaly spikes, and AI diagnostic recommendations.

## Colors

The palette is engineered around luminous spectral contrast over low-albedo carbon substrates. 

### Core Palette Roles
- **Primary (`#FF6B00`):** Kinetic Diagnostic Orange. Used for primary system actions, triggered fault locks, active vehicle scanning states, and primary diagnostic confirm controls.
- **Secondary (`#06B6D4`):** Electric Cyan. Dedicated to real-time live sensor streaming (RPM, manifold pressure, O2 curves), digital bus activity, and AI diagnostic insights.
- **Tertiary (`#3B82F6`):** Precision Signal Blue. Applied to non-critical system links, calibration states, passive telemetry historical charts, and standard connectivity indicators (OBD-II/CAN bus link).
- **Neutral (`#0B0F17`):** Obsidian Base. The master ground plane representing deep void carbon, absorbing glare and eliminating ambient distractions.

### Diagnostic Severity Roles
- **Critical (`#EF4444`):** Catastrophic mechanical/electrical failure, immediate limp mode, or sensor voltage short. Demands immediate operator halt.
- **High (`#F59E0B`):** Impending component failure, out-of-spec tolerances, or pending trouble codes (DTCs).
- **Medium (`#EAB308`):** Informational alerts, maintenance threshold proximity, or intermittent misfire counters.
- **Low / Verified (`#10B981`):** Calibrated, nominal parameters, clean sensor handshakes, and passed ECU sweeps.

## Typography

The typography pairs strict, industrial monospace telemetry with an unyielding neo-grotesque sans.

- **Monospace Engine (`JetBrains Mono`):** Applied to telemetry figures, hex addresses, freeze-frame data, live PID values, system labels, and diagnostic error codes (e.g., `P0300`, `U0100`). It ensures numerical columns remain aligned without horizontal jitter during high-frequency data refresh rates.
- **Narrative & Diagnostic Engine (`Inter`):** Applied to AI narrative summaries, mechanic repair logs, customer inspection explanations, and multi-paragraph technical service bulletins (TSBs). It delivers transparent legibility under rapid skimming conditions.
- **Case Rule:** Monospaced metadata tags, status banners, and system parameters must consistently render in uppercase with positive letter spacing (`0.06em` to `0.1em`).

## Layout & Spacing

Layouts follow a structured, multi-tier fluid command grid optimized for ruggedized touch tablets, multi-monitor diagnostic benches, and handheld workshop terminals.

### Grid & Layout Engine
- **Desktop & Workshop Console (1200px+):** 12-column layout with fixed 24px (`1.5rem`) gutters and safe margins of 40px (`2.5rem`). Layout prioritizes split views: 4 columns for real-time fault trees and CAN bus status, 8 columns for waveform graphs, engine telemetry, and AI copilot output.
- **Tablet Diagnostic Pad (768px – 1199px):** 8-column layout with 16px (`1rem`) gutters and 24px (`1.5rem`) margins. Diagnostic tables wrap cleanly, and live gauge readouts stack into 2x2 modular matrix clusters.
- **Handheld Mobile (under 768px):** 4-column compact layout with 12px gutters and 16px (`1rem`) edge padding. Critical metrics convert to high-impact vertical summary blocks.

### Spacing Principles
- Compact micro-rhythms (`space-xs` and `space-sm`) are utilized within sensor groups and hex readouts to maximize information density.
- Macro intervals (`space-lg` and `space-xl`) isolate volatile fault cards and diagnostic confirmation triggers to eliminate accidental touch inputs in glove-operated conditions.

## Elevation & Depth

Visual hierarchy does not rely on soft drop shadows, which wash out on low-quality workshop screens. Instead, depth is articulated through layered carbon tiers, crisp 1px anodized aluminum edge borders, and targeted luminescent backlighting.

### Depth Hierarchy
- **Canvas Base (Level 0):** Hex `#0B0F17` solid obsidian floor with faint raster grid lines (`rgba(255, 255, 255, 0.03)`).
- **Machined Carbon Panels (Level 1):** Hex `#111827` overlaid with a 1px border of `#1E293B`. Panels feature a subtle top-lit inner highlight (`inset 0 1px 0 0 rgba(255, 255, 255, 0.07)`).
- **Floating Diagnostic Cards & Drawers (Level 2):** Translucent carbon background (`rgba(17, 24, 39, 0.85)` with `backdrop-filter: blur(12px)`) framed by a 1px border of `rgba(255, 255, 255, 0.12)`. Subtle outer shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.7)`.
- **Active Telemetry & Alarm Overlays (Level 3):** Modal overlays, oscilloscope popouts, and bottom diagnostic command bars. Features an ambient glow tinted to the active channel:
  - Critical fault state: `0 0 24px -2px rgba(239, 68, 68, 0.25)`.
  - Live AI sweep state: `0 0 24px -2px rgba(6, 182, 212, 0.25)`.
  - High-priority action state: `0 0 24px -2px rgba(255, 107, 0, 0.28)`.

## Shapes

The interface employs a tight, technical corner radius (`roundedness: 1` = 0.25rem / 4px base; 0.5rem / 8px for outer container structures). 

- **Structural Containers:** Outer cards and diagnostic modules use `rounded-lg` (8px), reinforcing a durable, enclosure-like aesthetic without appearing toy-like or overly pill-shaped.
- **Data Cells & Telemetry Chips:** Interior inputs, status tags, and readout badges stay strictly at 4px corner radii, reflecting machined industrial metal bezels.
- **Chamfer Metaphor:** Key diagnostic buttons and active system tabs may feature micro 45-degree chamfered corners on the upper-right edge to evoke high-spec motorsport avionics and diagnostic ECUs.

## Components

### Buttons & Trigger Controls
- **Primary Telemetry Trigger:** High-energy solid `#FF6B00` background with deep obsidian `#0B0F17` bold monospace text. Top edge carries a 1px highlight (`rgba(255, 255, 255, 0.2)`). Hover state introduces an intense amber glow (`0 0 16px rgba(255, 107, 0, 0.5)`). Active state visually presses inward via `transform: scale(0.98)`.
- **Secondary Console Button:** Obsidian background `#111827`, 1px anodized border (`#1E293B`), text `#06B6D4`. Hover state elevates the border to `#06B6D4` with a subtle inner blue tint.
- **Emergency Halt / Fault Purge:** Solid `#EF4444` outline button with glowing red text and an instant pulse animation on hover.

### Diagnostic Chips & Severity Badges
- Designed like surface-mount electronic labels. Height: 22px. Padding: 0 8px.
- Backgrounds use a low-opacity wash (12%) of the status color paired with a 1px solid border of the exact status hex (e.g., `#EF4444` for DTC Critical). Monospace uppercase label at `label-sm` with a preceding pulsing micro-LED indicator dot (5px).

### Telemetry Lists & Data Grids
- Data lists feature zebra-alternating rows (`#0B0F17` to `#0F1522`) with 1px bottom separators (`rgba(255, 255, 255, 0.04)`).
- Key-value pairs display sensor names in muted `Inter` (`#94A3B8`) on the left, and real-time live numeric metrics right-aligned in bright `JetBrains Mono` (`#F8FAFC`). Hovering a row initiates a faint horizontal scanline highlight.

### Toggles & Hardware Switches
- Tactile rocker switches emulating physical flight-deck or dyno-bench hardware. Track: 44px by 24px recessed dark metal (`#05080E`) with an inset shadow.
- Thumb: 18px machined aluminum knob (`#334155`). Active state snaps to `#FF6B00` with an internal directional status indicator light.

### Form Inputs & Hex Parameters
- Recessed data inputs with dark fill (`#090D14`), 1px structural border (`#1E293B`), and high-legibility monospace text (`#F8FAFC`). Focus state changes border to neon cyan (`#06B6D4`) with zero fuzzy blur, maintaining razor-sharp vector clarity.

### Digital Vehicle Inspection Cards
- Enclosed modules with an anodized top header containing VIN, CAN-bus baud rate, and ECU connection ping. 
- Integrated real-time sparkline charts and live status meters spanning the bottom edge of the card, color-coded directly to severity states.

### Floating Bottom Diagnostic Console
- Fixed bottom dock (`height: 64px`) across viewports, floating 16px above the viewport boundary. Finished with a heavy carbon blur (`backdrop-filter: blur(16px)`), dual-channel USB/OBD connection health indicators on the left, active AI diagnostic query feed in the center, and rapid-fire fault code purge triggers on the right.