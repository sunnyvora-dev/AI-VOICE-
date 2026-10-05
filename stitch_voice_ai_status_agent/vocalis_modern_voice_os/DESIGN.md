---
name: Vocalis Modern Voice OS
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#4fdbc8'
  on-tertiary: '#003731'
  tertiary-container: '#1abaa8'
  on-tertiary-container: '#00443c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  badge-status:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-performance, mission-critical operational cockpit for autonomous voice intelligence and real-time conversational agents. The visual language blends computational precision with acoustic fluidity, combining structural enterprise ergonomics with ambient acoustic feedback.

The target audience spans voice infrastructure engineers, AI product operators, contact center directors, and developer teams who require sub-second situational awareness. The interface evokes hyper-responsive reliability, clinical clarity, and ambient intelligence.

Visual direction balances deep obsidian glassmorphism with high-contrast tactical data surfaces. Interfaces rely on translucent surface layering, razor-thin structural dividers, micro-glows indicating active signal streams, and purposeful acoustic visualizers that translate abstract AI reasoning into tangible, observable telemetry.

## Colors

The palette is engineered specifically for deep-contrast low-light environments, maximizing optical hierarchy without visual fatigue:

- **Primary Canvas & Ground (`#0B0F19`)**: Base system backdrop. Represents absolute ground level, absorbing light to let active data modules float with absolute clarity.
- **Surface Elevation (`#111827`, `#1E293B`)**: Layered container levels. `#111827` anchors cards and persistent layout shells; `#1E293B` serves as the primary structural border and hover substrate.
- **Primary Signal - Electric Cyan (`#06B6D4`)**: The principal telemetry color. Denotes system connectivity, primary calls-to-action, network throughput, and confirmed conversational flow states.
- **Secondary State - Radiant Violet/Indigo (`#6366F1`, `#8B5CF6`)**: Expresses cognitive AI operations, synthesis pipelines, voice model inference, and natural language understanding tasks.
- **Tertiary Accent - Mint Teal (`#14B8A6`)**: Dedicated to healthy acoustic pipelines, live microphone activity, clean stream buffers, and resolved sessions.
- **Functional Semantics**:
  - Live/Speaking: Cyan-Teal gradient sweep (`#06B6D4` to `#14B8A6`).
  - Processing/Inference: Pulsing Violet (`#6366F1`).
  - Warning/High Latency: Amber glow (`#F59E0B`).
  - Drop/Error: Electric Coral (`#EF4444`).
- **Text & Visual Levels**:
  - Text Primary: `#F8FAFC` (96% contrast ratio against base ground).
  - Text Secondary: `#94A3B8` (Optimized for secondary metadata, telemetry timestamps, and table subtext).
  - Structural Ghost Borders: Low-alpha slate `#334155` (applied with 40–80% opacity variations).

## Typography

The typographic hierarchy implements three distinct roles:
1. **Geometric Command (Plus Jakarta Sans)**: Used for major system metrics, dashboard module titles, and high-impact headers. Its geometric balance brings warmth and authoritativeness to technical interfaces.
2. **Operational Neutrality (Inter)**: Anchors all conversational transcripts, logs, form inputs, and narrative explanations. Its tall x-height guarantees crisp readability against dark backgrounds.
3. **Engine Telemetry (JetBrains Mono)**: Reserved for live audio sample rates, packet round-trip times (RTT), token velocities, SIP codes, and JSON configuration payloads.

Text weights follow strict contrast rules: Never use pure white for body copy; reserve `#FFFFFF` and `#F8FAFC` for high-impact metric counters and active state titles. Body and transcript items sit at `#94A3B8` and `#CBD5E1` to reduce halation on dark panels.

## Layout & Spacing

The architecture operates on an 8-point base module, scaled down to 4px for tactical dense UI panels (such as mini-waveform tracks, audio gain meters, and status indicators).

### Grid System
- **Desktop (1280px+)**: 12-column dynamic fluid grid with `2rem` outer canvas padding and `1.5rem` structural gutters. Main monitoring layouts leverage asymmetric 8:4 splits (8 columns for live audio flow, real-time waveform, and active transcript; 4 columns for agent parameters, LLM latency graphs, and session telemetry).
- **Tablet (768px - 1279px)**: 8-column layout. Waveforms collapse above transcript feeds; session parameters tuck into retractable slide-over panels.
- **Mobile (< 768px)**: 4-column layout with `1rem` edge margin and `0.75rem` column gutters. Real-time controls convert to sticky bottom bars, maximizing vertical viewport space for speech-to-text live streaming.

Data tables, wave tracks, and audio channel strips employ compact vertical row padding (`space-sm` / `8px`) to ensure operational information density without triggering scroll exhaustion.

## Elevation & Depth

Visual depth is achieved through translucent optical layering, tonal glassmorphism, and selective photon leakage (backlit glows):

1. **Layer 0 (Canvas Deep Ground)**: `#0B0F19` solid.
2. **Layer 1 (Card & Frame Slabs)**: Background `rgba(17, 24, 39, 0.75)` with `12px` to `16px` backdrop-blur and a structural 1px border of `rgba(51, 65, 85, 0.5)`. This creates a tactile, float-isolated foundation.
3. **Layer 2 (Interactive Floating Surfaces & Popovers)**: Background `rgba(30, 41, 59, 0.85)` with `20px` backdrop-blur, an elevated border of `rgba(100, 116, 139, 0.3)`, and an ambient drop shadow: `0 16px 32px -8px rgba(0, 0, 0, 0.65)`.
4. **Layer 3 (Modals & Command Palettes)**: High-translucency obsidian backing `rgba(11, 15, 25, 0.92)` paired with dynamic directional rim lighting: `0 0 0 1px rgba(6, 182, 212, 0.25), 0 24px 48px -12px rgba(0, 0, 0, 0.8)`.

### Ambient Micro-Glow System
Active voice events introduce controlled light bleed:
- Agent Speaking: Outer glow of `0 0 24px -4px rgba(6, 182, 212, 0.35)`.
- Agent Processing: Outer pulse glow of `0 0 24px -4px rgba(99, 102, 241, 0.35)`.
- Critical Alert: Rim highlight of `0 0 16px 0px rgba(239, 68, 68, 0.3)`.

## Shapes

The design uses a calculated combination of structural 8px corners (`roundedness: 2`) for operational framing and full-capsule radii for runtime status indicators:

- **Structural Modules (Cards, Modals, Tables, Panels)**: Uniformly bound by `0.5rem` (8px) inner radii and `0.75rem` (12px) outer borders. This preserves clean rectangular architectural cadence across complex, data-heavy dashboards.
- **Pill Geometry (Status Indicators, Audio Badges, Mode Toggles)**: Locked to 9999px (full pill). Status badges wrap around text and beacon dots in smooth curves, distinguishing operational telemetry from structural containers.
- **Form Inputs & Action Targets**: Consistent `0.5rem` (8px) corner geometry ensures visual cohesion between input bars, search boxes, and interactive button groups.

## Components

### Buttons
- **Primary Cyber (Active Call / Deploy Agent)**: Gradient fill from `#06B6D4` to `#0891B2`. Crisp 1px inner highlight `inset 0 1px 0 rgba(255, 255, 255, 0.25)`. Pure dark label `#04131A` in heavy weight (`600`). On hover: saturation boost with a cyan photon glow `0 0 16px rgba(6, 182, 212, 0.4)`.
- **Secondary Glass**: Surface `rgba(30, 41, 59, 0.6)` with border `1px solid rgba(51, 65, 85, 0.8)`. Text `#F8FAFC`. Hover shifts background to `rgba(51, 65, 85, 0.6)` with border `#06B6D4`.
- **Destructive Tactical (Terminate Call)**: Surface `rgba(239, 68, 68, 0.12)` with border `1px solid rgba(239, 68, 68, 0.35)`. Text `#FCA5A5`.

### Status Badges (Pills)
Full-pill capsules (`padding: 3px 10px`) paired with a 6px glowing beacon dot:
- **Speaking**: Tint `rgba(6, 182, 212, 0.12)`, border `rgba(6, 182, 212, 0.4)`, text `#22D3EE`. Beacon runs an asynchronous 1.2s CSS breath animation.
- **Processing**: Tint `rgba(99, 102, 241, 0.12)`, border `rgba(99, 102, 241, 0.4)`, text `#A5B4FC`.
- **Active / Connected**: Tint `rgba(20, 184, 166, 0.12)`, border `rgba(20, 184, 166, 0.4)`, text `#2DD4BF`.
- **Idle / On Standby**: Tint `rgba(100, 116, 139, 0.12)`, border `rgba(100, 116, 139, 0.3)`, text `#94A3B8`.
- **Completed**: Tint `rgba(51, 65, 85, 0.25)`, border `rgba(51, 65, 85, 0.6)`, text `#CBD5E1`.

### Audio Waveform Visualizer Cards
- Contained within elevated obsidian slabs.
- Displays dual interactive canvases: Agent Channel (Electric Cyan) on the upper track, User Channel (Luminous Violet) on the lower track.
- Background grid: Fine 16px isometric dot matrix in `rgba(51, 65, 85, 0.35)`.
- Visualizer bars: 2.5px width with 1.5px gaps, dynamically reflecting frequency energy with gradient head-caps.

### High-Contrast Telemetry Tables
- Header row: Non-reflective matte finish (`#0F172A`), uppercase labels in `label-mono-sm` font, text `#64748B`.
- Row height: 44px compact. Row separators: 1px subtle divider `rgba(30, 41, 59, 0.8)`.
- Hover state: Row-level gradient highlight `linear-gradient(90deg, rgba(6, 182, 212, 0.05) 0%, transparent 100%)`.

### Inputs & Parameter Sliders
- Input fields: Deep inset background `#090D16` with a recessed border `rgba(51, 65, 85, 0.6)`. Active focus transitions to a cyan highlight border `1px solid #06B6D4` with an inner shadow ring `0 0 0 1px #06B6D4`.
- Voice parameter range sliders (Temperature, Frequency Penalty, Pacing): 4px track with a dual-color fill (Violet to Cyan) and a glowing 14px circular thumb equipped with active coordinate readouts.

### Conversational Stream Logs
- Time-coded conversational blocks with agent utterances indented to the left (Cyan margin tab) and customer utterances aligned to the right with distinct slate-indigo bubble glass.