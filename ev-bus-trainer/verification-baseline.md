# Phase 0 — Baseline Verification Report

**Date:** 2026-06-23
**Scope:** `D:\EV arch_v2\ev-bus-trainer\` (before any modification)
**Purpose:** Establish the golden reference. All subsequent phases must reproduce or exceed these results; any regression triggers rollback.

---

## 1. Build verification — PASS

Command: `npm run build` (= `tsc -b && vite build`)

- **TypeScript (`tsc -b`):** PASS — no type errors, project-references build clean.
- **Vite production build:** PASS — `vite v8.0.14`, 2149 modules transformed, built in 967 ms, **0 errors, 0 warnings**.
- **Output artifacts:**
  - `dist/index.html` — 0.57 kB (gzip 0.36 kB)
  - `dist/assets/index-C44qQ2Yc.js` — 444.02 kB (gzip 136.21 kB)
  - `dist/assets/index-CIBPwCNs.css` — 39.45 kB (gzip 7.70 kB)

Conclusion: the source compiles and bundles with no diagnostics. This is the safety net — if a later change introduces a broken reference, the build is likely to surface it.

## 2. App launch against CURRENT source — PASS

**Correction (2026-06-23):** the original `release/win-unpacked/` was a **stale v1 build (Jun 2)** that predated all recent source work (files dated Jun 17–23). It did NOT represent the current app. It has since been removed by the user. Re-baseline is now done against the **current source**.

- Fresh `dist/` rebuilt from current source (2026-06-23 14:40): `index.html`, `assets/index-C44qQ2Yc.js` (444 KB), `assets/index-CIBPwCNs.css` (39 KB).
- Launched `npx electron .` against fresh `dist/` → **9 Electron processes** came up.
- Log showed only Chromium GPU disk-cache permission warnings (`cache_util_win.cc` / `gpu_disk_cache.cc`): these are **cosmetic**, caused by the working-directory cache path, and do **not** affect any app functionality.
- `electron/main.cjs:25` load path confirmed: `loadFile(path.join(__dirname, '..', 'dist', 'index.html'))`. `base:'./'` is compatible with `file://`.

Conclusion: the **current** application builds and launches cleanly.

**Note (not a functional issue):** one residual file `release/win-unpacked/resources/app.asar` (17 MB, from the deleted v1) holds a persistent OS handle and resists deletion even with no process owning it. It is isolated and harmless; Phase 4 packages to a clean output dir, so this lock is bypassed.

## 3. Asset plumbing — PASS (programmatic)

- `dist/component-images/` → **44 PNGs** (matches `componentImageById` map in `components.ts`).
- `dist/training-videos/` → **7 MP4s** (AUX, CAN, HV, LV, Regen, propulsion, pneumatics — matches `videoPath()` calls).
- `dist/` → **8 "Updated" flowchart SVGs** present (the set referenced by `components.ts:1332–1394`).
- `index.html` references `/favicon.svg` (present in dist) and `/src/main.tsx` (dev entry).

## 4. Baseline size snapshot

| Item | Size |
|---|---|
| `dist/` (build output) | **67 MB** |
| `release/` (electron-builder output) | **576 MB** |
| `release/E-Bus Systems Trainer 1.0.0.exe` (portable) | **106 MB** |
| `release/E-Bus Systems Trainer Setup 1.0.0.exe` (NSIS installer) | **107 MB** |
| `dist/assets/index-*.js` (the app bundle) | 444 kB |

These are the numbers all later "savings" claims are measured against.

## 5. Interactive runtime checklist — REQUIRES HUMAN

The items below need a person at the screen (this shell cannot interact with the GUI). The app is **already running** from step 2 — please exercise it now and mark PASS/FAIL:

- [ ] All 8 flowcharts render: HV, LV, CAN, AUX, Regen, Torque (5.5), Overall, Pneumatics
- [ ] SVG interactions work: hover highlights cells, clicking a cell opens its DetailPanel
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] Theme toggle works and persists after closing/reopening the app
- [ ] Zoom in works
- [ ] Zoom out works
- [ ] Pan / drag works
- [ ] Reset-zoom works
- [ ] Sidebar navigation switches modules
- [ ] Header navigation switches modules
- [ ] CommandPalette (Ctrl/Cmd+K) opens, searches, navigates
- [ ] All 7 training videos play (HV, LV, CAN, AUX, Regen, propulsion, pneumatics)
- [ ] Component descriptions render in DetailPanel
- [ ] Component image enlarge (lightbox) works
- [ ] Navigation between all flowchart modules works

**Phase 0 conclusion:** Build + launch + asset-plumbing all PASS. Pending your interactive checklist, the baseline is established and Phases 2–4 may proceed; if any interactive item is FAIL on the *current* (unmodified) app, STOP and report before any change.
