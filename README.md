<div align="center">
<img width="1200" height="475" alt="LUMINA Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LUMINA

LUMINA is a local-first cognitive care workspace built on React 19 + Vite. The current product baseline is an encrypted browser vault with journaling, behavioral activation, habits, ERP, sleep tracking, day closure, export, and a rule-based Reflejo state engine.

## Current Status

Validated on April 19, 2026:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test -- --run`
- `npm run build`

This repository treats `src/` as the only canonical application. `docs/idea 1` and `docs/idea 2` remain as conceptual references for product language and interaction patterns, not as parallel sources of truth.

## Product Frame

LUMINA brings together three operating pillars:

1. Think: CBT journaling with L1/L2/L3 progression, distortion detection, and ICC-based restructuring.
2. Act: behavioral activation, habits, streak logic, and recovery-aware gamification.
3. Regulate: Reflejo guidance, breathing, sleep architecture, crisis access, and day closure.

Reflejo uses deterministic local rules. Anchor mode now reacts to real high-intensity signals on the current 1-10 scale rather than legacy 0-100 assumptions.

## Technical Baseline

- React 19 + Vite
- Tailwind CSS 4
- Motion
- LocalForage + IndexedDB
- Web Crypto API with AES-GCM
- Recharts
- Vitest + ESLint + TypeScript

## Repository Truth

```text
src/                         canonical app
docs/idea 1/                 concept reference only
docs/idea 2/                 concept reference only
scratch/                     experiments and one-off scripts
```

## Local Workflow

```bash
npm install
npm run dev
```

For a full repository gate:

```bash
npm run verify
```

## Android Track

LUMINA now includes an Android-first Capacitor wrapper while keeping `src/` as the canonical app.

Current native scope:

- encrypted backup export to Android files
- native share sheet for encrypted backups
- native haptics
- status bar and keyboard polish
- safe-area aware mobile overlays

First-time Android setup:

```bash
npm install
npm run cap:sync:android
```

Then:

1. Install Android Studio
2. Open [android](C:/Users/Junior/OneDrive/Documents/GitHub/LUMINA/android)
3. Let Gradle and SDK components finish installing
4. Run on an emulator or USB-connected device

Useful commands:

```bash
npm run cap:sync:android
npm run cap:open:android
```

Notes for this phase:

- Android is the current native target
- iOS is intentionally deferred until storage is hardened beyond WebView persistence
- native builds use `npm run build:native`, which skips PWA registration inside the wrapper
- Android automatic app backup is disabled to preserve the local-first privacy model

## Core Flow

1. Create encrypted vault
2. Unlock with in-memory passphrase
3. Use journal, activation, habits, mood, ERP, goals, sleep, analysis
4. Export Markdown or CSV locally
5. Lock, auto-lock, change passphrase, or wipe vault

## Notes

- No backend, sync, or auth is included in this MVP baseline.
- Dates are handled in local `YYYY-MM-DD` form to avoid UTC rollover bugs.
- Export is intended for user portability and therapist review, not cloud ingestion.
