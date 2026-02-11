# Memento Mori — Technical Specification

**Version:** 1.1  
**Date:** 2026-02-11  
**Author:** Sid (Portfolio Project)  
**Status:** Implementation-Ready (Revised)

---

## 1. Product Overview & Purpose

### Core Value Proposition

Memento Mori is a single-page visualization tool that converts abstract mortality awareness into a tangible, pixel-level rendering of your life in weeks. Users input their birth date, expected lifespan, and time-allocation categories, then see a grid where every pixel is one week of their life — past weeks filled and color-coded by how time was spent, future weeks available for intentional planning.

The insight is visceral: your life is a finite grid, and most of it is already filled in. The tool makes the remaining space *feel* scarce, which is the point.

### Use Cases

| Use Case | Description |
|---|---|
| **Self-reflection** | A user sits down on a Sunday, inputs their data, and stares at the grid. They export it as a desktop wallpaper. |
| **Goal setting** | A user allocates future weeks to categories ("I want 30% of my remaining weeks on creative work") and sees whether their current trajectory matches. |
| **Sharing** | A user exports a high-res image and posts it to social media or prints it as a poster. |
| **Portfolio demo** | Sid uses this as a polished, self-contained artifact demonstrating frontend visualization chops and product thinking. |

### User Personas

1. **The Reflective Professional (Primary):** 28–45, knowledge worker, familiar with life-optimization frameworks (Eisenhower matrix, time-blocking). Wants a tool that creates an emotional response, not just a chart. Technically literate enough to understand a web app without onboarding.
2. **The Casual Visitor (Secondary):** Arrives via a social media share. Wants to input their own data in under 60 seconds and see their grid. Low friction tolerance.

### Success Metrics (Portfolio Context)

| Metric | Target |
|---|---|
| Time to first visualization | < 90 seconds from page load |
| Export quality | Crisp at 4K resolution, suitable for print |
| Lighthouse Performance score | > 90 |
| Code quality | Clean component architecture, demonstrable in a walkthrough |
| "Wow factor" | Someone seeing the grid for the first time has an emotional reaction |

### Scope Boundaries

**In Scope (v1.x):**
- Single-page client-only app
- User-provided estimates for historical/future category allocation
- Deterministic weekly grid rendering, insights, and exports
- Local persistence (`localStorage`) and URL share state

**Out of Scope (v1.x):**
- User accounts, cloud sync, or multi-device persistence
- Health/longevity advice or actuarial recommendations
- Social feed or server-side sharing
- AI-generated life planning

---

## 2. User Experience Flow

### Journey Map

```
Landing → Onboarding Input → Grid Visualization → Insights Panel → Export
```

**Step 1: Landing**
- Minimal splash. A tagline ("Your life in weeks."), a single CTA ("Begin"), and maybe a sample grid rendered as a teaser in the background.
- No signup. No accounts. This is a stateless tool.

**Step 2: Data Input (Onboarding Wizard)**
- Presented as a stepped form (3–4 steps), not a single wall of fields.
- Each step has a clear, single question with defaults pre-filled.

**Step 3: Grid Visualization**
- The grid renders after input. This is the hero moment.
- Grid animates in — pixels fill from birth date to today, color-coded.
- Future weeks render as muted/outlined pixels.
- Interactive: hover over any pixel to see the week's date range and category.

**Step 4: Insights Panel**
- A sidebar or overlay showing summary analytics derived from the grid.
- Percentage breakdown by category, time remaining, trends.

**Step 5: Export**
- Download as PNG (high-res), PDF (poster format), or SVG.
- Optional: share link that encodes state in URL parameters (no backend needed).

### Input Requirements

| Field | Type | Default | Notes |
|---|---|---|---|
| Birth date | Date picker | None (required) | Used to calculate weeks lived |
| Life expectancy | Number (years) | 80 | Slider with range 40–120. Can type custom. |
| Categories | Array of `{name, color, icon?}` | 5 defaults provided | Defaults: Work, Family, Rest, Growth, Play |
| Historical allocation | Per-category percentage for "past" weeks | Equal split | Optional. User can adjust with sliders. |
| Future allocation | Per-category percentage for "future" weeks | Equal split | This is the intentional planning layer. |
| Color scheme | Preset or custom | "Obsidian" (dark) | 3–4 presets + custom color picker per category |

### Validation & Edge Cases

| Case | Rule | UI Behavior |
|---|---|---|
| Birth date in the future | Invalid | Block continue; inline error: "Birth date must be in the past." |
| Age > life expectancy | Valid but terminal | Render full grid as lived, set remaining weeks to `0`, show "beyond expectancy" note. |
| Life expectancy outside slider range | Clamp to min/max | If typed manually, clamp to 40–120 and show helper text. |
| Category percentages do not sum to 100 | Invalid until resolved | Disable "Continue" and show running total with delta. |
| No categories left after delete | Invalid | Prevent deleting last category. |
| Leap years / DST differences | UTC math only | Use UTC midnight dates and integer week math to avoid timezone drift. |
| Corrupted URL/local state | Recoverable | Ignore invalid payload, fall back to defaults, show non-blocking toast. |
| Unsupported browser export path | Recoverable | Keep grid usable; disable unsupported export format and explain why. |

### Output Formats

| Format | Spec |
|---|---|
| **Interactive web view** | The primary output. Canvas/SVG grid with hover tooltips, zoom, pan. |
| **PNG export** | 4096×4096 minimum. Clean render without UI chrome. |
| **PDF export** | A3/poster layout with grid + legend + summary stats. |
| **SVG export** | Vector format for print shops or further editing. |
| **URL share** | Encode all input state as URL-safe base64 (`v1`-prefixed) in URL hash. Recipient sees the same grid. No backend. |

---

## 3. Core Features

### 3.1 Memento Mori Pixel Grid

The centerpiece. A rectangular grid where:
- Each pixel = 1 week of life
- Columns = 52 weeks (week-of-year index)
- Rows = life years (one row per year)
- Past weeks are filled with category colors
- Current week is highlighted (pulsing border or glow)
- Future weeks are outlined or translucent

**Grid Math:**
```
total_weeks = life_expectancy_years × 52
weeks_lived = clamp(floor((today_utc - birth_date_utc) / 7_days), 0, total_weeks)
weeks_remaining = max(0, total_weeks - weeks_lived)
grid_cols = 52
grid_rows = ceil(total_weeks / 52)
```

**Interaction:**
- Hover: tooltip with week number, date range (Mon–Sun), category
- Click: opens a detail card (optional — nice-to-have)
- Zoom: scroll-to-zoom on the grid, with smooth interpolation
- Age markers: every 10th row labeled ("Age 30", "Age 40", etc.)

### 3.2 Category/Bucket System

Users define how they spend time across named categories. Each category has:

```typescript
interface Category {
  id: string;           // uuid
  name: string;         // "Work", "Family", etc.
  color: string;        // hex value
  icon?: string;        // optional emoji or icon identifier
  pastPercent: number;  // 0–100, user-estimated allocation for lived weeks
  futurePercent: number; // 0–100, user-intended allocation for remaining weeks
}
```

**Default categories (pre-filled, editable):**

| Name | Color | Default Past % | Default Future % |
|---|---|---|---|
| Work | `#4A90D9` | 35 | 25 |
| Family | `#E07A5F` | 20 | 30 |
| Rest | `#81B29A` | 25 | 20 |
| Growth | `#F2CC8F` | 10 | 15 |
| Play | `#9B72CF` | 10 | 10 |

Percentages must sum to 100. UI enforces this with a stacked slider or proportional adjustment.

### 3.3 Historical vs. Planned Visualization

The grid has a visible dividing line at the "today" marker:
- **Indices `< todayWeekIndex`:** Historical weeks. Colors are solid, rendered as filled squares. Represents "how you've spent your time."
- **Indices `>= todayWeekIndex`:** Future weeks. Colors are translucent or pattern-filled (diagonal stripes, dots). Represents "how you intend to spend your time."

This visual distinction is critical. The past is fixed; the future is mutable.

### 3.4 Insights/Analytics Display

A collapsible panel showing derived metrics:

| Metric | Calculation |
|---|---|
| Weeks lived | `floor((today - birthDate) / 7)` |
| Weeks remaining | `totalWeeks - weeksLived` |
| % of life lived | `(weeksLived / totalWeeks) × 100` |
| Category breakdown (past) | Pie/donut chart of past allocation |
| Category breakdown (future) | Pie/donut chart of planned allocation |
| "If you changed today" | Delta visualization: what happens if you shift future allocation |
| Life phases | Overlay markers for major life phases (childhood, career, retirement) |

### 3.5 Export Functionality

Three export paths, all client-side:

1. **PNG:** Use `html-to-image` or direct Canvas `toDataURL()`. Render at 2x or 4x for print quality. Strip UI chrome, include legend and title.
2. **PDF:** Use `jsPDF` or `@react-pdf/renderer`. Layout: grid centered, legend below, stats in margin. A3 landscape format.
3. **SVG:** Direct DOM serialization of the SVG grid element. Clean, scalable, editable.

All exports include:
- The grid itself
- A legend mapping colors to categories
- Summary text: name (optional), birth year, life expectancy, date generated

---

## 4. Technical Architecture

### Frontend Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | React 18+ with TypeScript | Component model fits the widget-heavy UI. TS for type safety on the data structures. Portfolio-standard. |
| **Build tool** | Vite | Fast dev server, minimal config, good for single-page apps. |
| **Visualization** | HTML5 Canvas (primary) + SVG (export fallback) | Canvas handles 4,000+ pixel grid at 60fps. SVG for vector export. D3 is overkill here — the grid is regular, not data-driven in the D3 sense. |
| **Styling** | Tailwind CSS | Rapid iteration, consistent spacing/color system, purges unused CSS. |
| **State management** | Zustand | Lightweight, no boilerplate, perfect for a single-page app with ~10 state fields. |
| **Animation** | Framer Motion | Page transitions, grid reveal animation, panel slides. |
| **Export** | `html-to-image` + `jsPDF` | Proven client-side export pipeline. |
| **Date math** | `date-fns` | Tree-shakeable, no Moment.js bloat. |

### Why Canvas Over SVG for the Grid

The grid at max life expectancy (100 years × 52 weeks) = **5,200 DOM elements** if rendered as SVG `<rect>`. That's manageable but sluggish on mobile with hover interactions. Canvas renders the entire grid as a single bitmap, with hit-testing handled via coordinate math. SVG is used only for the export path where vector fidelity matters.

### Data Structures

```typescript
// Core input state
interface MementoMoriState {
  birthDate: string;          // ISO 8601 date
  lifeExpectancyYears: number;
  categories: Category[];
  colorScheme: 'obsidian' | 'paper' | 'midnight' | 'custom';
  currentStep: 'input' | 'visualization' | 'export';
}

// Derived (computed, not stored)
interface DerivedMetrics {
  totalWeeks: number;
  weeksLived: number;
  weeksRemaining: number;
  percentLived: number;
  todayWeekIndex: number;      // index into the grid
  gridDimensions: { cols: 52; rows: number };
}

// Single pixel in the grid
interface WeekPixel {
  index: number;               // 0-based sequential
  row: number;                 // year of life (0-indexed)
  col: number;                 // week of year (0–51)
  dateRange: { start: string; end: string };
  isPast: boolean;
  isCurrent: boolean;
  category: Category | null;   // assigned category
}
```

### Calculation Logic

```typescript
function computeWeeks(birthDate: Date, lifeExpectancyYears: number): DerivedMetrics {
  const totalWeeks = lifeExpectancyYears * 52;
  const today = new Date(); // interpreted as UTC date-only below
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const toUtcDateOnly = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const rawWeeksLived = Math.floor((toUtcDateOnly(today) - toUtcDateOnly(birthDate)) / msPerWeek);
  const weeksLived = Math.max(0, Math.min(rawWeeksLived, totalWeeks));
  const weeksRemaining = Math.max(0, totalWeeks - weeksLived);
  
  return {
    totalWeeks,
    weeksLived,
    weeksRemaining,
    percentLived: (weeksLived / totalWeeks) * 100,
    todayWeekIndex: weeksLived,
    gridDimensions: { cols: 52, rows: Math.ceil(totalWeeks / 52) },
  };
}
```

**Category assignment for pixels:**
Past and future segments are assigned with exact category counts (not just probabilistic approximation), then deterministically shuffled so the grid is stable across renders.

```typescript
function buildSegmentCategories(totalWeeks: number, percents: number[], seed: number): number[] {
  // 1) Convert percentages to exact integer quotas using largest-remainder allocation.
  const raw = percents.map(p => (p / 100) * totalWeeks);
  const base = raw.map(Math.floor);
  let remainder = totalWeeks - base.reduce((a, b) => a + b, 0);
  const byRemainder = raw
    .map((value, i) => ({ i, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < remainder; k++) base[byRemainder[k].i] += 1;

  // 2) Expand indices by quota.
  const buckets: number[] = [];
  base.forEach((count, categoryIndex) => {
    for (let j = 0; j < count; j++) buckets.push(categoryIndex);
  });

  // 3) Deterministic Fisher-Yates shuffle to avoid visible blocks.
  let s = seed >>> 0;
  const rand = () => ((s = (1664525 * s + 1013904223) >>> 0) / 2 ** 32);
  for (let i = buckets.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [buckets[i], buckets[j]] = [buckets[j], buckets[i]];
  }

  return buckets;
}
```

### Performance Considerations

| Concern | Mitigation |
|---|---|
| 5,200 pixels on Canvas | Single draw call per frame. Batch rendering. Only redraw dirty regions on interaction. |
| Hover hit detection | Coordinate math (`floor(mouseX / pixelSize)`) instead of DOM event delegation. O(1). |
| Export at 4K | Offscreen canvas at target resolution. Render once, export, dispose. |
| Bundle size | Vite tree-shaking + code splitting. Target < 200KB gzipped. |
| Mobile performance | Reduce pixel size, disable hover (use tap), limit animation complexity. |

### No Backend

This is entirely client-side. Zero API calls. Zero auth. Zero infrastructure cost.

The only "persistence" is:
1. URL hash encoding (share links)
2. Optional localStorage (save mid-session)

### Privacy, Safety, and Messaging

| Topic | Requirement |
|---|---|
| Data collection | No analytics or third-party tracking by default in v1.x. |
| Sensitive framing | Include a short disclaimer: "This tool is reflective, not medical or predictive advice." |
| User control | "Reset all data" action clears in-memory state, URL hash state, and localStorage. |
| Offline behavior | App remains functional without network after initial load. |
| Share links | Links contain only user-entered, non-authenticated state; no hidden identifiers. |

---

## 5. State Management & Persistence

### Session State (Zustand Store)

```typescript
interface AppStore {
  // Input state
  birthDate: string | null;
  lifeExpectancyYears: number;
  categories: Category[];
  colorScheme: ColorScheme;
  
  // UI state
  currentStep: Step;
  isPanelOpen: boolean;
  hoveredWeek: number | null;
  zoomLevel: number;
  
  // Actions
  setBirthDate: (date: string) => void;
  setLifeExpectancy: (years: number) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  addCategory: () => void;
  removeCategory: (id: string) => void;
  reset: () => void;
}
```

### localStorage Persistence (Optional)

On any state change, debounce-save to `localStorage` under key `memento-mori-state`. On page load, check for existing state and offer to resume.

```typescript
const STORAGE_KEY = 'memento-mori-state';
const SAVE_DEBOUNCE_MS = 1000;

function saveState(state: Partial<AppStore>) {
  const serializable = {
    birthDate: state.birthDate ?? null,
    lifeExpectancyYears: state.lifeExpectancyYears ?? 80,
    categories: state.categories ?? [],
    colorScheme: state.colorScheme ?? 'obsidian',
    schemaVersion: 1,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

function loadState(): Partial<AppStore> | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
```

### URL Share Encoding

Encode the input state (not UI state) as URL-safe base64 JSON in the URL hash:

```
https://memento-mori.app/#v1.eyJiaXJ0aERhdGUiOi...
```

Decode on load. If both localStorage and URL hash exist, URL hash wins (it's an intentional share). Invalid or unknown versions should fail soft and load defaults.

---

## 6. Design & Visual Specs

### Grid Layout

| Parameter | Value |
|---|---|
| Pixel size (desktop) | 10×10px with 2px gap |
| Pixel size (mobile) | 6×6px with 1px gap |
| Grid width (desktop) | 52 × 12px = 624px |
| Grid height (80yr life) | 80 × 12px = 960px |
| Corner radius per pixel | 1px (subtle, not circular) |
| "Today" marker | Bright accent border (2px), pulsing glow animation |
| Year labels | Every 10 rows, left margin, muted text |
| Grid container | Centered, scrollable vertically on mobile, fit-to-viewport on desktop |

### Color Schemes (Presets)

**Obsidian (Default — Dark)**
```css
--bg-primary: #0D0D0D;
--bg-surface: #1A1A1A;
--text-primary: #E8E8E8;
--text-muted: #666666;
--grid-empty: #1F1F1F;
--grid-future-opacity: 0.35;
--accent: #FF6B35;
```

**Paper (Light)**
```css
--bg-primary: #F5F0EB;
--bg-surface: #FFFFFF;
--text-primary: #2C2C2C;
--text-muted: #999999;
--grid-empty: #E8E3DE;
--grid-future-opacity: 0.3;
--accent: #D4421E;
```

**Midnight (Deep Blue)**
```css
--bg-primary: #0A0E1A;
--bg-surface: #111827;
--text-primary: #D1D5DB;
--text-muted: #4B5563;
--grid-empty: #151C2E;
--grid-future-opacity: 0.3;
--accent: #60A5FA;
```

### Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| Tagline / hero text | `Playfair Display` or `Cormorant Garamond` | 48px | 700 |
| Section headers | Same display font | 24px | 600 |
| Body / labels | `IBM Plex Sans` or `Source Sans 3` | 14–16px | 400 |
| Monospace (stats) | `JetBrains Mono` | 13px | 400 |
| Tooltip text | Body font | 12px | 400 |

### Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `≥1024px` (Desktop) | Grid + insights panel side by side. Full hover interactions. |
| `768–1023px` (Tablet) | Grid full width. Insights as collapsible bottom sheet. |
| `<768px` (Mobile) | Reduced pixel size. Tap instead of hover. Insights as overlay modal. Pinch-to-zoom on grid. |

### Accessibility

| Requirement | Implementation |
|---|---|
| Color contrast | All text meets WCAG AA (4.5:1 ratio minimum) |
| Keyboard navigation | Tab through input fields. Arrow keys to navigate grid. Enter to select pixel. |
| Screen reader | Grid has `aria-label` describing overall stats. Individual pixels are not individually labeled (5,200 elements), but summary region provides equivalent info. |
| Reduced motion | Respect `prefers-reduced-motion`. Disable grid reveal animation, pulse on "today" marker. |
| Color blindness | Patterns (stripes, dots, crosshatch) as secondary encoding alongside color. Togglable in settings. |

---

## 7. Quality Gates & Test Plan

### Non-Functional Requirements

| Category | Requirement |
|---|---|
| Initial load performance | Largest Contentful Paint < 2.5s on mid-tier desktop in production build |
| Interaction performance | Hover/tap latency < 16ms for tooltip lookup at 5,200 weeks |
| Reliability | No uncaught runtime errors across core flow on Chromium, Firefox, Safari |
| Export correctness | PNG/PDF/SVG outputs preserve category legend and week colors without clipping |
| Determinism | Same input payload always produces identical pixel-category mapping |
| Bundle budget | JavaScript bundle target < 250KB gzipped for MVP |

### Test Matrix

| Layer | What to test | Tools |
|---|---|---|
| Unit | Week math, clamping, quota distribution, seeded shuffle determinism | Vitest |
| Component | Wizard validation, slider constraints, tooltip rendering, error states | React Testing Library |
| Integration | End-to-end flow from input to export and reset behavior | Playwright |
| Visual regression | Grid orientation, today marker, legend alignment | Playwright snapshots |
| Accessibility | Keyboard traversal and contrast checks | axe-core + manual pass |

### Minimum Acceptance Criteria (MVP Exit)

1. User can complete onboarding and see a grid within 90 seconds on first use.
2. Week math is stable across timezones for the same birth date.
3. Category totals for past and future segments match configured percentages within integer-week rounding rules.
4. PNG export opens at 4096×4096 and visually matches on-screen grid/legend.
5. Reload restores the previous state from `localStorage` unless URL hash state is present.
6. Invalid input and corrupted shared state fail gracefully without app crash.

---

## 8. Implementation Roadmap

### Phase 1: MVP (Target: 1 week)

**Goal:** Working grid visualization with basic input and PNG export.

| Feature | Priority |
|---|---|
| Birth date + life expectancy input | P0 |
| Default 5 categories with fixed colors | P0 |
| Canvas grid rendering (past = solid, future = outlined) | P0 |
| "Today" marker | P0 |
| Hover tooltips (week date range) | P0 |
| Basic insights (weeks lived, % remaining) | P0 |
| PNG export | P0 |
| Obsidian color scheme only | P0 |
| Desktop layout only | P0 |

**Deliverable:** A functional single-page app that renders the grid and exports an image.

**Phase 1 Exit Criteria:**
1. All P0 features implemented behind a single production route.
2. At least one end-to-end test covers input -> render -> PNG export.
3. No high-severity accessibility blockers in core flow.

### Phase 2: Polish & Interaction (Target: +3–4 days)

| Feature | Priority |
|---|---|
| Category editor (add/remove/recolor) | P1 |
| Past/future percentage sliders | P1 |
| Grid reveal animation on first render | P1 |
| 3 color scheme presets | P1 |
| Responsive layout (tablet + mobile) | P1 |
| localStorage persistence | P1 |
| PDF export | P1 |
| Year/age labels on grid margin | P1 |

**Phase 2 Exit Criteria:**
1. Tablet and mobile layouts are usable without horizontal overflow.
2. Local resume flow works after page refresh.
3. PDF export includes grid, legend, and summary metrics.

### Phase 3: Delight & Share (Target: +2–3 days)

| Feature | Priority |
|---|---|
| URL share encoding | P2 |
| SVG export | P2 |
| Custom color picker per category | P2 |
| Color-blind mode (pattern encoding) | P2 |
| Zoom/pan on grid | P2 |
| Keyboard navigation | P2 |
| "Life phases" overlay (childhood, career, retirement markers) | P2 |
| Smooth transition animations between input steps | P2 |

**Phase 3 Exit Criteria:**
1. URL share links round-trip state without data loss.
2. SVG export opens correctly in a standard vector editor.
3. Accessibility checks pass for keyboard-only grid interaction.

### Nice-to-Haves (Backlog)

| Feature | Notes |
|---|---|
| "What if" mode | Slider to simulate different life expectancies in real-time |
| Comparison view | Side-by-side grids with different allocations |
| Journal mode | Click a week to write a note (localStorage only) |
| Sound design | Subtle audio on grid reveal (ambient, not intrusive) |
| i18n | Multi-language support |
| PWA | Installable as a mobile app |

---

## Appendix A: Component Tree

```
<App>
  <ThemeProvider>
    <LandingPage />              // Step 1
    <InputWizard>                // Step 2
      <BirthDateStep />
      <LifeExpectancyStep />
      <CategoriesStep />
      <ColorSchemeStep />
    </InputWizard>
    <VisualizationView>          // Step 3–4
      <GridCanvas />             // The main grid (Canvas)
      <GridOverlay />            // Hover tooltip, today marker (DOM overlay)
      <InsightsPanel />          // Stats sidebar
        <CategoryBreakdown />
        <MetricCards />
      <ExportModal />            // Step 5
    </VisualizationView>
  </ThemeProvider>
</App>
```

## Appendix B: File Structure

```
memento-mori/
├── src/
│   ├── components/
│   │   ├── landing/
│   │   │   └── LandingPage.tsx
│   │   ├── input/
│   │   │   ├── InputWizard.tsx
│   │   │   ├── BirthDateStep.tsx
│   │   │   ├── LifeExpectancyStep.tsx
│   │   │   ├── CategoriesStep.tsx
│   │   │   └── ColorSchemeStep.tsx
│   │   ├── grid/
│   │   │   ├── GridCanvas.tsx
│   │   │   ├── GridOverlay.tsx
│   │   │   └── useGridRenderer.ts
│   │   ├── insights/
│   │   │   ├── InsightsPanel.tsx
│   │   │   ├── CategoryBreakdown.tsx
│   │   │   └── MetricCards.tsx
│   │   └── export/
│   │       ├── ExportModal.tsx
│   │       ├── exportPNG.ts
│   │       ├── exportPDF.ts
│   │       └── exportSVG.ts
│   ├── store/
│   │   └── useAppStore.ts
│   ├── lib/
│   │   ├── weekMath.ts
│   │   ├── categoryAssignment.ts
│   │   ├── urlEncoding.ts
│   │   └── localStorage.ts
│   ├── styles/
│   │   └── themes.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── fonts/
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Appendix C: Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.0.0",
    "html-to-image": "^1.11.0",
    "jspdf": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```
