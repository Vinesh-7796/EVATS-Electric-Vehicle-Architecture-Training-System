# Phase 2 + Phase 3 — Verification Report

**Date:** 2026-06-23
**Scope:** `D:\EV arch_v2\ev-bus-trainer\`
**Guardrail:** zero functional regressions; build + launch must remain green.

---

## Phase 2 — Safe Cleanup ✅

### 2.1 Archived unused assets (12 files → `_archive/assets/`)
Confidence 100% (zero string references anywhere). Moved, not deleted, for trivial rollback.
- `public/icons.svg`
- 8 old (non-"Updated") flowchart SVGs:
  `Flowchart 1 HV power system.drawio.svg`, `Flowchart 2 LV power system.drawio.svg`,
  `Flowchart 3 can Bus network.drawio.svg`, `Flowchart 4 HV Auxilary network.drawio.svg`,
  `Flowchart 5 Regenerative braking.drawio.svg`,
  `Flowchart 5.5 Torque Powertrain and Energy Flow.drawio.svg`,
  `Flowchart 6 Overall Power System.drawio.svg`, `Flowchart 7 Pneumatic Systems.svg`
- `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg` (Vite scaffolding leftovers)

### 2.2 Stale dev artifacts removed
- Hard-deleted: stray reserved-name `nul` file.
- Archived (cautious, no git): `vite-dev.log`, `vite-dev.err.log`, `vite-current.log`,
  `vite-current.err.log`, `svg-ids.txt`, `test-results/`.

### 2.3 Unused dependency removed
- `docx` (^9.7.1) removed from `dependencies`. `npm install` pruned it from `node_modules` (**−7.2 MB**).

### 2.4 `.gitignore` hygiene
- Added `release`, `release-v2`, `_archive`, `nul`.

### 2.5 Verification
- Rebuild: clean, 0 errors, 2149 modules.
- `dist/`: 9 SVGs (favicon + 8 Updated — every flowchart referenced by `components.ts`), 44 images, 7 videos. **No old flowchart variants present.**
- App launches: 4 Electron processes, no errors.

---

## Phase 3 — Build Optimization ✅

### 3.1 Dependency reclassification
- `react`, `react-dom`, `react-zoom-pan-pinch` moved `dependencies` → `devDependencies`.
- Rationale: all statically imported → already bundled into `dist/assets/index-*.js`; `electron/main.cjs` imports nothing external → electron-builder no longer hoists them into `app.asar` (smaller installer).
- `dependencies` is now `{}` (empty). To be validated by Phase 4 packaged run (the real test); one-line revert if any runtime resolution fails.

### 3.2 Vite production options (`vite.config.ts`)
- `build.target: 'esnext'` — Electron 42 ships modern Chromium; smaller, no legacy transforms.
- `build.cssCodeSplit: false` — single CSS file for the file://-loaded desktop app.

### 3.3 Fonts bundled locally (offline-capable)
- Replaced `@import url('https://fonts.googleapis.com/...')` (CDN) with local `@font-face` declarations.
- Downloaded into `src/assets/fonts/`: Inter 400/500/600/700 + JetBrains Mono 500/600 (TTF, ~1.5 MB).
- Vite fingerprints them into `dist/assets/`. App no longer needs internet for correct typography.

### 3.3b Scrollbar styling (user request — pure CSS, mode-aware)
- Thin (8px), rounded (9999px), transparent track.
- Light-mode thumb: slate-400 @ 35% (hover 60%).
- Dark-mode thumb: slate-500 @ 45% (hover 70%).
- `scrollbar-width: thin` for spec-compliance fallback.

### 3.5 Verification
- Rebuild: clean, 0 errors, 2149 modules.
- Bundled CSS contains all scrollbar rules (`scrollbar-width`, `scrollbar-track`, `scrollbar-thumb` ×4).
- App launches: 4 Electron processes, **0 errors, 0 warnings**.

### Bundle size vs Phase 0 baseline

| Asset | Phase 0 (baseline) | Phase 3 (final) | Δ |
|---|---|---|---|
| `index-*.js` | 444.02 kB | 444.02 kB | unchanged (no regression) |
| CSS | 39.45 kB | 30.41 kB | **−9.04 kB (−23%)** |
| Fonts | CDN (online only) | 6 local TTF (~1.5 MB) | offline-capable |
| `node_modules/docx` | 7.2 MB | — (pruned) | **−7.2 MB** |
| Unused SVGs in dist | ~1.66 MB | — (archived) | **−1.66 MB** |

---

## Remaining (Phase 4)
- Windows packaging: generate app icon, configure electron-builder, make the `dist` script cross-platform, build installer + portable exe, and verify the actual packaged artifacts (not just `npm run desktop`).
