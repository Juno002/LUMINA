# Walkthrough — Lumina MVP Local-First

This walkthrough describes the real application currently shipped in `src/`.

## 1. Entry and Security

- New users create a vault locally.
- Returning users unlock with their passphrase.
- The passphrase stays in memory while the vault is open.
- Settings allow lock, auto-lock tuning, passphrase rotation, export, and wipe.

## 2. Think

- Journal entries move from observation to deeper restructuring.
- Distortions are detected locally from text.
- Level 3 entries calculate ICC from 1-10 credibility deltas.
- Analysis surfaces recent patterns and inferred themes from valid distortion ids only.

## 3. Act

- Activation turns planned intentions into completed behavioral data.
- Habits track yes/no, numeric, and timer rhythms.
- Recovery bonus and streak logic reward returning after gaps instead of punishing them.
- Goals keep a strategic layer over habits and activation.

## 4. Regulate

- Reflejo reacts to recent journal signals, ICC, rumination, and absence.
- Crisis access remains available from locked and unlocked flows.
- Sleep and mood logs support day-to-day regulation.
- Day closure gives the app a clean daily ending rather than a perpetually open loop.

## 5. Data Ownership

- Everything remains local-first.
- Markdown export is designed for therapist or self-review.
- CSV export is designed for raw portability.
- No backend, sync, or third-party AI processing is part of this MVP.

## 6. Verification Snapshot

Verified on April 19, 2026:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test -- --run`
- `npm run build`

For repeatable local verification:

```bash
npm run verify
```

## 7. Concept Sources

The conceptual DNA of Lumina still comes from `docs/idea 1` and `docs/idea 2`, but the product is now consolidated into one implementation path. Those folders are reference material, not alternate runtime states.
