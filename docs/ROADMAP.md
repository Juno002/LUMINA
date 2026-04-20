# Lumina — Roadmap Real

> Version: `1.0.0-mvp`
> Last updated: `2026-04-19`
> Status: `MVP local-first consolidated`

## Canonical Scope

Lumina's closed MVP is the application inside `src/`.

- `docs/idea 1` and `docs/idea 2` remain conceptual references
- they are not implementation targets
- they should inform product judgment, not create parallel code paths

## What Is Closed In This MVP

- encrypted local vault with schema versioning
- create, unlock, lock, auto-lock, wipe
- passphrase rotation from settings
- CBT journal with distortion detection and ICC
- behavioral activation
- habits, streaks, recovery bonus, XP
- goals
- ERP / exposure logging
- mood and sleep logging
- day closure
- local export in Markdown and CSV
- bilingual UI baseline

## Engineering Baseline

The closure bar for this repository is:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test -- --run`
- `npm run build`

These are also available through:

```bash
npm run verify
```

## What Was Consolidated

- Thought-entry intensity and ICC inputs aligned to the 1-10 scale
- date helpers moved to local-date semantics
- Reflejo consumes valid domain signals only
- analysis uses recent entries and valid distortion ids
- settings no longer ship a dead change-passphrase affordance
- destructive flows use editorial confirmation instead of native `confirm()`
- dashboard resilience index is data-derived rather than hardcoded
- CSV export escapes content correctly

## Post-MVP Horizon

These are intentionally outside the closed MVP:

- cloud sync
- backend auth
- Supabase integration
- state-library migration
- framework migration to Next.js
- unintegrated concept modules from prototype folders

## Manual QA Still Worth Repeating Before Release

- create vault and unlock
- passphrase change without data loss
- auto-lock on inactivity
- export and re-open generated files
- crisis entry from locked and unlocked states
- mobile navigation and overlay behavior
- installability and PWA polish
