# Memento Mori App - 3-Phase Implementation Plan

Date: 2026-02-11
Owner: Sid / Codex

## Phase 1 - Foundation + MVP

Goal: Ship a usable first version that renders life-in-weeks, supports onboarding, and exports PNG.

Scope:
- Set up project tooling and tests (`Vitest`, Playwright Chromium)
- Implement core week math and deterministic category allocation
- Build onboarding form (birth date, life expectancy, categories)
- Render week grid on canvas with hover details and today marker
- Show primary insights (weeks lived, remaining, percent lived)
- Add PNG export
- Add a responsive layout baseline (desktop + mobile friendly stacking)

Dependencies:
- Runtime: `react`, `react-dom`, `date-fns`, `zustand`, `html-to-image`/canvas export
- Dev: `vitest`, `@testing-library/*`, `@playwright/test`, `jsdom`, `typescript`, `vite`

Testing gates:
- Unit tests for week math and category allocation pass before each feature commit
- E2E test covers onboarding -> visualization -> PNG export

Exit criteria:
- User can reach first visualization in < 90 seconds
- Grid and metrics are stable and deterministic for same inputs
- Chromium E2E passes

## Phase 2 - Persistence + Mobile Polish

Goal: Make the app resilient across sessions and stronger on mobile interaction.

Scope:
- Add `localStorage` persistence + restore prompt/resume behavior
- Add URL hash share encoding/decoding (`v1.<base64url>`)
- Add category editing UX and stricter validation feedback
- Improve mobile/touch ergonomics (tap tooltip, spacing, panel behavior)

Dependencies:
- Browser storage APIs
- URL-safe encoding utilities

Testing gates:
- Unit tests for share-state encode/decode and persistence helpers
- E2E tests for restore flow and mobile viewport journey

Exit criteria:
- Refresh restores state
- Shared link reproduces same visualization state
- Mobile Chromium E2E passes

## Phase 3 - Accessibility + Finish

Goal: Finalize production-quality interaction and handoff readiness.

Scope:
- Keyboard navigation for key controls and week focus behavior
- Theme presets and reset-all action
- Defensive error handling for corrupted state
- Final UI polish and copy refinements

Dependencies:
- Existing state and rendering architecture from Phases 1-2

Testing gates:
- Unit tests for reset/state guards
- E2E tests for share roundtrip and accessibility smoke

Exit criteria:
- Core flows are keyboard reachable
- Invalid state payloads fail soft
- All test suites pass in Chromium

## Commit Strategy

- Commit per feature slice, never bundling unrelated work
- For each feature commit:
  1. Run `npm run test:unit`
  2. Commit if green
- At phase milestones:
  1. Run `npm run test:unit`
  2. Run `npm run test:e2e`
  3. Commit/push milestone
