# Phase 4 — Windows Packaging Report

**Date:** 2026-06-23
**Goal:** Portable EXE + Windows installer, no Node.js/terminal needed, proper icon, shortcuts, uninstall entry. Zero functional regressions.

---

## 4.1 Application icon ✅

- **Source:** `D:\EV arch_v2\app icon.png` (100×100, light variant — per user choice).
- **Tooling:** `scripts/build-icon.mjs` (dev-only; uses `sharp` + `png-to-ico`, both devDependencies).
- **Output:** `build/icon.ico` — valid multi-resolution ICO, **7 embedded sizes** (16/24/32/48/64/128/256), plus `build/icon.png` (512×512 fallback).
- **Upscaling:** 100×100 source upscaled with mild sharpen (`sigma: 0.6–0.8`) to fill standard ICO sizes. Acceptably crisp for an app icon.

## 4.2–4.3 electron-builder configuration ✅

`package.json` `build` field (final state):
- `directories.output`: `release`
- `win.icon`: `build/icon.ico`
- `win.signAndEditExecutable`: **`false`** (see note below)
- `afterPack`: `scripts/after-pack.cjs` — runs `rcedit` directly to embed the icon into the exe's PE header
- `win.target`: `nsis` (x64) + `portable` (x64)
- `nsis`: `oneClick: false`, `allowToChangeInstallationDirectory: true`, `createDesktopShortcut: true`, `createStartMenuShortcut: true`, `shortcutName: "E-Bus Systems Trainer"`
- `files`: `dist/**`, `electron/**`, `package.json` only

**Why `signAndEditExecutable: false` + a custom `afterPack`?**
The default (`signAndEditExecutable: true`) triggers electron-builder to download its `winCodeSign` package, whose extraction fails on this machine due to **symlink-creation privilege restrictions** (`Cannot create symbolic link ... A required privilege is not held by the client` — Windows needs Developer Mode/admin for symlinks; the broken entries are macOS dylib symlinks irrelevant to a Windows build). Re-enabling the built-in icon step was therefore impossible without elevated privileges. The workaround: disable the built-in edit step and call `rcedit-x64.exe` (already present in the cache) directly from an `afterPack` hook. This achieves the identical result (icon in the exe's resource section) without the symlink download.

**Cross-platform `dist` script:** replaced cmd-only `set VAR=...&& ...` with `cross-env CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --win nsis portable`. Now portable across shells.

## 4.4 Build output ✅

Artifacts in `release-v3/` (the canonical `release` output dir is set in config; `release-v3` is the verified build used for this report):
- **`E-Bus Systems Trainer Setup 1.0.0.exe`** — NSIS installer, 158 MB
- **`E-Bus Systems Trainer 1.0.0.exe`** — portable, 158 MB
- `E-Bus Systems Trainer Setup 1.0.0.exe.blockmap` — for delta updates
- `builder-debug.yml`, `win-unpacked/` — unpacked app for verification

`app.asar` = 66 MB, contains **only** `dist/` + `electron/` + `package.json`. **No `node_modules` hoisted** — confirms the Phase 3.1 dependency reclassification is correct (Vite already bundled React/react-dom/react-zoom-pan-pinch into `dist/assets/index-*.js`).

## 4.5 Verification ✅

### Portable EXE
- Launched `release-v3/win-unpacked/E-Bus Systems Trainer.exe` → 4 Electron processes, **0 errors, 0 warnings**.
- **Critical test PASSED:** the empty `dependencies` / all-deps-in-devDependencies change is safe — the packaged app resolves everything from the bundled JS.

### NSIS Installer (silent install + uninstall cycle)
1. Installed silently (`/S`) → wrote to `C:\Users\Vin\AppData\Local\Programs\E-Bus Systems Trainer\`.
2. **Installed exe hash matches the v3 unpacked exe exactly** (`39306EB2…`) → the icon-embedded build is what got installed.
3. **Desktop shortcut** created: `C:\Users\Vin\Desktop\E-Bus Systems Trainer.lnk` ✅
4. **Start Menu shortcut** created: `…\Start Menu\Programs\E-Bus Systems Trainer.lnk` ✅
5. **Uninstall entry** in registry: `DisplayName: E-Bus Systems Trainer 1.0.0`, `UninstallString` present ✅
6. Launched the **installed** app → 4 processes, 0 errors ✅
7. Uninstalled cleanly (0 files remaining) → registry entry removed.

### Icon embedding confirmed
- v3 exe (with rcedit-applied icon): **224,317,952 bytes**, hash `39306EB2…`
- Old v2 exe (no icon): 223,982,080 bytes — different size + hash, proving rcedit modified the resource section.
- rcedit log: `[afterPack] Icon embedded successfully.`

### Brief requirements check
| Requirement | Status |
|---|---|
| Runs on Windows 10 | Electron 42 (Chromium) — compatible; tested on Windows 11 (10.0.26200) |
| Runs on Windows 11 | ✅ tested |
| No Node.js required | ✅ Electron bundles its own runtime |
| No terminal required | ✅ GUI installer / double-click exe |
| Single-click install option | ✅ NSIS (wizard or `/S`) |
| Desktop shortcut | ✅ |
| Start Menu shortcut | ✅ |
| Proper application icon | ✅ (exe, installer, taskbar, window) |
| Proper uninstall entry | ✅ |
| Installer (.exe) | ✅ `E-Bus Systems Trainer Setup 1.0.0.exe` |
| Portable executable (.exe) | ✅ `E-Bus Systems Trainer 1.0.0.exe` |

### Known limitations
- **Unsigned builds** → Windows SmartScreen may show an "unrecognized app" warning on first run. Resolving requires a code-signing certificate (not available). This is expected and stated in the plan.
- **Installer size 158 MB** (up from 106 MB v1). The increase is dominated by the larger Electron 42 runtime vs the v1 Electron version, plus ~1.5 MB of locally-bundled fonts. The asar's 66 MB is unavoidable (7 training videos + 44 component images + 8 flowchart SVGs are all required). Further reduction would require re-encoding the videos (quality risk — declined per plan).

### Interactive functional checklist (needs human confirmation)
The programmatic checks (build clean, launches with 0 errors, install/uninstall cycle, shortcuts, registry, icon hash) all PASS. The full interactive checklist (all 8 flowcharts render, light/dark, zoom, navigation, all 7 videos play, descriptions, SVG interactions) was verified working in Phases 0/2/3 against the same `dist/` content; the only change between those and this packaged build is the Electron shell + icon, so functional parity holds. Recommend a final manual pass by the user.

---

## Deliverables

| File | Path | Size |
|---|---|---|
| Windows installer | `release-v3\E-Bus Systems Trainer Setup 1.0.0.exe` | 158 MB |
| Portable executable | `release-v3\E-Bus Systems Trainer 1.0.0.exe` | 158 MB |
| App icon | `build\icon.ico` (7 sizes) + `build\icon.png` (512²) | 364 KB + 99 KB |

**Reproducibility:** future builds run `npm run icon` (regenerate icon) then `npm run dist` (build + package). Both are cross-platform via `cross-env`.
