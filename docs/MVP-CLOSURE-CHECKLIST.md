# MVP Closure Checklist

Last review: `2026-04-19`

## Verified Automatically

- [x] `npx tsc --noEmit`
- [x] `npm run lint`
- [x] `npm test -- --run`
- [x] `npm run build`

## Base Consolidation

- [x] `src/` established as the canonical application
- [x] `schemaVersion` present in the vault model
- [x] migration path executed on load
- [x] thought-entry intensity and ICC inputs aligned to 1-10
- [x] local-date helpers used for date-only logic
- [x] shell navigation extracted from `App.tsx`
- [x] habits, journal, and analysis views decomposed into domain components

## UX and Product Integrity

- [x] change-passphrase flow implemented
- [x] encrypted backup export and restore implemented
- [x] wipe flow moved to editorial confirmation
- [x] destructive confirmations removed from key views
- [x] dashboard resilience index tied to live data
- [x] analysis uses recent entries and valid distortions
- [x] CSV export escapes content safely

## Automated QA Added

- [x] `useVault` lifecycle integration tests cover create, unlock, lock, passphrase rotation, wipe, and legacy migration
- [x] `useVault` backup cycle test covers encrypted export and restore, including crisis-plan payload
- [x] HTTP smoke check confirms the dev server responds on `http://localhost:3000/`

## Documentation

- [x] README aligned with the real MVP scope
- [x] roadmap aligned with the real MVP scope
- [x] walkthrough aligned with the real MVP scope
- [x] prototype folders described as conceptual references

## Manual Product QA Still Recommended

- [ ] create vault and unlock in browser
- [ ] verify passphrase change end-to-end in UI
- [ ] verify encrypted backup export and restore end-to-end in UI
- [ ] verify auto-lock timing in UI
- [ ] verify export download contents manually
- [ ] verify crisis flow from locked state
- [ ] verify mobile overlays and PWA installability
- [ ] run visual/browser QA once `agent-browser` or equivalent browser automation is available in the environment
