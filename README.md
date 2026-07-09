# EVATS: Electric Vehicle Architecture Training System

> ⚠️ **IMPORTANT DEPLOYMENT DISCLAIMER:** This repository hosts an unofficial, non-commercial educational prototype developed strictly for training visualization, systems topology modeling, and portfolio verification. It is not commissioned, endorsed, or officially affiliated with SWITCH Mobility Automotive Ltd. All corporate names, layouts, and logos are implemented in a mock capacity to simulate a real-world, production-tier OEM software environment.

---

## System Functional Overview

EVATS is an interactive, high-fidelity WebGL utility designed for field service technicians and graduate engineering trainees. The platform bridges the gap between 3D physical layout and 2D schematic logic by mapping complex electric bus subsystems to an interactive, hollowed-out schematic shell. Users can rotate, explore spatial integration points, and seamlessly drill down into granular diagnostic flowcharts.

---

## Core Software Architecture & State Machine

The application pipeline is governed by three discrete render states with an asynchronous preload layer:

- **State 0: SPLASH** — A sterile industrial gateway panel that triggers background threads the millisecond it mounts.
- **State 1: SYSTEM\_TOPOLOGY** — The core 3D interactive graphics viewport tracking 8 distinct high-voltage and low-voltage subsystems via screen projection.
- **State 2: FLOWCHART\_VIEWER** — The deep-dive diagnostic logic viewer that clears WebGL memory fragments on mount to render targeted architectural flowcharts.

### Asynchronous Preload Strategy

The 722 kB municipal bus GLB asset downloads, parses, and pushes geometries to GPU VRAM silently *during the splash screen state*, creating a perceived 0 ms, zero-lag transition to the active topology layout.

---

## Graphics Engine & Custom Render Pipeline Optimizations

The following WebGL overrides transform the raw 3D mesh into a clean blueprint framework:

- **Solid-Occlusion Pass** — The mesh is dual-rendered with a solid underlying layer colour-matched exactly to the flat `#FAFAFA` background to naturally occlude interior seating and back-facing wireframe webs.
- **Contour Filtering Pass** — Uses sharp boundary edge detection (threshold angles restricted to 20–30 degrees) to display crisp engineering vector profiles rather than raw polygon triangulations.
- **High-Contrast Palette** — Optimised for clean light modes utilising high-visibility Technical Slate Dark Blue (`#1E293B`) line profiles instead of low-contrast neon colours.
- **Perspective Depth Fading** — Integrates subtle linear distance fog to smoothly dissolve far-side geometries into the canvas background to maintain rapid spatial orientation.

---

## Spatial Anchor Mapping & Coordinate Projection Math

Floating UI elements interact with the 3D scene through a virtual vector field. Subsystem coordinate bounds are configured via `Vector3` fields relative to the model centre `(0, 0, 0)`.

A Normalised Device Coordinate (NDC) projection loop inside the rendering engine maps matrix world positions directly to absolute 2D UI layout layers:

```
X_pixel = (vector.x * 0.5 + 0.5) * canvasWidth
Y_pixel = (-(vector.y * 0.5) + 0.5) * canvasHeight
```

---

## System Diagnostics Panel & Engineering Credits

```
+-----------------------------------------------------------+
| SYSTEM INFO                                           [X] |
| --------------------------------------------------------- |
| APPLICATION: EVATS (Electric Vehicle Architecture         |
|              Training System)                             |
| BUILD STATUS: v1.3-Stable (July 2026)                     |
|                                                           |
| BUILT BY:                                                 |
|  > Vinesh — Technical Documentation, Flowchart Logic,     |
|             and UI Architecture                           |
|    [https://www.linkedin.com/in/vinesh7796]               |
|                                                           |
| SECURITY CLASSIFICATION:                                  |
|  - SWITCH Mobility Internal Evaluation Tool               |
|  - PROPRIETARY AND CONFIDENTIAL DATA                      |
|                                                           |
| © 2026 SWITCH Mobility Ltd. All rights reserved.          |
+-----------------------------------------------------------+
```
