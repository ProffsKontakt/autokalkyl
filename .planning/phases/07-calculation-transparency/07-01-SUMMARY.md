---
phase: 07-calculation-transparency
plan: 01
subsystem: ui-components
one-liner: "Reusable breakdown components with Framer Motion animations showing calculation formulas for spotpris, effekt, and stodtjanster"
tags: [framer-motion, react, expandable, breakdowns, transparency, swedish, dark-mode]

# Dependency graph
requires:
  - phase: 06-calculation-engine
    plan: 01
    provides: "EMALDO_CAMPAIGN_MONTHS constant"
  - phase: 06-calculation-engine
    plan: 02
    provides: "StodtjansterInput pattern for consistent Swedish UI text"
provides:
  - "ExpandableBreakdown: Reusable wrapper with color themes and animations"
  - "SpotprisBreakdown: Spotpris formula transparency (capacity × efficiency × cycles × spread × 365)"
  - "EffektBreakdown: Peak shaving formula transparency (peak × reduction% × tariff × 12)"
  - "StodtjansterBreakdown: Grid services income breakdown (Emaldo zone-based or manual)"
affects:
  - 07-02 # Public results view will integrate these breakdowns

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reusable ExpandableBreakdown wrapper with color prop for category theming"
    - "Framer Motion AnimatePresence for smooth expand/collapse"
    - "Swedish formula explanations with mono-font breakdown display"
    - "Dark mode support via Tailwind dark: variants"
    - "formatSek helper using toLocaleString('sv-SE')"

key-files:
  created:
    - src/components/calculations/breakdowns/expandable-breakdown.tsx
    - src/components/calculations/breakdowns/spotpris-breakdown.tsx
    - src/components/calculations/breakdowns/effekt-breakdown.tsx
    - src/components/calculations/breakdowns/stodtjanster-breakdown.tsx

key-decisions:
  - "Use button + motion.div instead of native details/summary for full animation control"
  - "Color themes (green/blue/purple) match savings category conventions"
  - "formatSek helper defined locally in each breakdown (pattern for reuse)"
  - "Swedish explanatory text before formula breakdown for transparency"

patterns-established:
  - "Expandable sections with animated chevron rotation"
  - "Formula breakdowns in mono font with gray labels and highlighted totals"
  - "Constraint feedback (isConstrained) shown in amber text"
  - "Emaldo vs non-Emaldo conditional rendering patterns"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 7 Plan 01: Breakdown Components Summary

**One-liner:** Reusable breakdown components with Framer Motion animations showing calculation formulas for spotpris, effekt, and stodtjanster

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-01-31T10:39:32Z
- **Completed:** 2026-01-31T10:41:17Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

Created four reusable breakdown components that provide calculation transparency for each savings category:

1. **ExpandableBreakdown wrapper** - Reusable component with:
   - Three color themes (green, blue, purple) for category differentiation
   - Framer Motion animations (chevron rotation, height/opacity transitions)
   - Props: title, subtitle, icon, color, defaultOpen, children
   - Dark mode support throughout

2. **SpotprisBreakdown** (SPOT-04):
   - Shows: Capacity × Verkningsgrad × Cykler/dag = Daglig energi
   - Then: Daglig energi × Prisskillnad = Daglig besparing
   - Finally: Daglig besparing × 365 = Årlig besparing
   - Green color theme, lightning bolt icon

3. **EffektBreakdown** (PEAK-04):
   - Shows: Nuvarande toppeffekt × Reduktion% = Målreduktion
   - Constraint display: Amber text when battery capacity limits reduction
   - Then: Faktisk reduktion × Effekttariff = Månatlig besparing
   - Finally: Månatlig besparing × 12 = Årlig besparing
   - Blue color theme, chart icon

4. **StodtjansterBreakdown** (GRID-05):
   - **Emaldo mode:** Displays guaranteed monthly income × 12 = annual (first 36 months)
   - Post-campaign: Battery capacity × rate = annual income (year 4+)
   - **Non-Emaldo mode:** Simple capacity × rate calculation
   - Purple color theme, plug icon

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ExpandableBreakdown wrapper component** - `36931b4` (feat)
2. **Task 2: Create category-specific breakdown components** - `9b051b4` (feat)

## Files Created

All files in `src/components/calculations/breakdowns/`:
- `expandable-breakdown.tsx` - Wrapper with animations (93 lines)
- `spotpris-breakdown.tsx` - Spotpris formula breakdown (83 lines)
- `effekt-breakdown.tsx` - Peak shaving formula breakdown (105 lines)
- `stodtjanster-breakdown.tsx` - Grid services income breakdown (108 lines)

**Total:** 389 lines of production-ready, TypeScript-validated code

## Decisions Made

**DEC-07-01-01: Button + motion.div over native details/summary**
- **Choice:** Use button + Framer Motion AnimatePresence instead of native HTML5 details/summary
- **Rationale:** Full control over animation timing, smoother height animations, consistent with project patterns
- **Impact:** Better UX with smooth expand/collapse, matches existing Framer Motion usage

**DEC-07-01-02: Local formatSek helper in each breakdown**
- **Choice:** Define formatSek inline in each component rather than importing shared utility
- **Rationale:** Simple pattern, easy to customize per component if needed, no dependency on utilities folder structure
- **Impact:** Self-contained components, clear pattern for future breakdowns

**DEC-07-01-03: Swedish explanatory text first**
- **Choice:** Show plain-text explanation paragraph before formula breakdown
- **Rationale:** Transparency requires context - users understand *why* before seeing *how*
- **Impact:** More educational UI, reduces confusion about technical formulas

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Mapping

| Requirement | Delivery | Evidence |
|------------|----------|----------|
| TRANS-01: Each savings category expandable breakdown | ✓ Complete | Three breakdowns (spotpris, effekt, stodtjanster) |
| SPOT-04: Spotpris formula transparency | ✓ Complete | SpotprisBreakdown shows capacity × efficiency × cycles × spread × 365 |
| PEAK-04: Effektavgift formula transparency | ✓ Complete | EffektBreakdown shows peak × reduction% × tariff × 12, constraint display |
| GRID-05: Stodtjanster income breakdown | ✓ Complete | StodtjansterBreakdown shows Emaldo zone rates + post-campaign |

## Integration Points

### Consumed By
- **07-02 (Public Results View):** Will import and render these breakdowns
- **07-03 (Breakdown Data Pipeline):** Will provide props data from calculation results

### Depends On
- **06-01:** Uses EMALDO_CAMPAIGN_MONTHS constant
- **06-02:** Follows StodtjansterInput pattern for Swedish text consistency
- **Framer Motion:** For AnimatePresence and motion.div animations
- **React 19:** Component architecture
- **Tailwind CSS 4:** Styling and dark mode

### External Dependencies
- **framer-motion** (v12.x) - Already in project
- **@/lib/calculations/constants** - EMALDO_CAMPAIGN_MONTHS

## Testing Notes

### Manual Testing Checklist
- [x] TypeScript compiles without errors (pnpm tsc --noEmit passed)
- [ ] ExpandableBreakdown renders with all three color themes
- [ ] Chevron rotates smoothly on click
- [ ] Content expands/collapses with height animation
- [ ] SpotprisBreakdown shows correct formula steps
- [ ] EffektBreakdown displays constraint message in amber when isConstrained=true
- [ ] StodtjansterBreakdown switches display based on isEmaldoBattery
- [ ] Dark mode works (check bg colors, text colors, borders)
- [ ] formatSek formats numbers with Swedish locale (12 345 kr)

### TypeScript Verification
```bash
pnpm tsc --noEmit  # Passed ✓
```

## Next Phase Readiness

**Ready for 07-02 (Public Results View Integration)**
- All breakdown components export properly
- TypeScript types are explicit and complete
- Swedish text is consistent with existing UI
- Dark mode support is comprehensive
- No blockers identified

**Component interface ready:**
```typescript
// SpotprisBreakdown
props: { capacityKwh, cyclesPerDay, efficiency, spreadOre, annualSavingsSek }

// EffektBreakdown
props: { currentPeakKw, peakShavingPercent, actualPeakShavingKw, newPeakKw, tariffRateSekKw, annualSavingsSek, isConstrained }

// StodtjansterBreakdown
props: { elomrade, isEmaldoBattery, batteryCapacityKw, guaranteedMonthlySek?, guaranteedAnnualSek?, postCampaignRatePerKwYear?, postCampaignAnnualSek?, displayedAnnualSek }
```

**Future Considerations:**
- Consider extracting formatSek to shared utility if pattern repeats across project
- May want keyboard shortcuts (Space/Enter to toggle expand)
- Could add "expand all" / "collapse all" button if multiple breakdowns on one page
- Accessibility testing needed (screen reader support for formula steps)

## Production Readiness

**Status:** Component library ready, not production-deployed yet

**Still needed:**
- Integration into public results view (07-02)
- Data pipeline to provide breakdown props from calculation results (07-03)
- Visual regression testing for animations
- Accessibility audit (ARIA labels, keyboard navigation)
- Mobile responsive testing (formula layout on small screens)

**Known limitations:**
- formatSek duplicated across three files (acceptable for MVP, extract if needed)
- No loading state (assumes data is always available)
- No error boundaries (will crash if required props missing)
- Fixed icon implementation (emoji) - could be made customizable

## Pattern Reusability

**ExpandableBreakdown pattern can be reused for:**
- FAQ sections
- Technical specifications
- Warranty details
- Installation requirements
- Any content that benefits from progressive disclosure

**Example:**
```typescript
<ExpandableBreakdown
  title="Vad ingår i installationen?"
  color="blue"
  icon={<span>🔧</span>}
>
  <ul>...</ul>
</ExpandableBreakdown>
```

## References

**Related Plans:**
- 06-01-SUMMARY.md: Calculation constants foundation
- 06-02-SUMMARY.md: StodtjansterInput pattern reference
- 07-RESEARCH.md: Architecture patterns and anti-patterns

**Key Files:**
- src/components/calculations/controls/stodtjanster-input.tsx: Swedish text patterns
- src/lib/calculations/constants.ts: EMALDO_CAMPAIGN_MONTHS constant

**Documentation:**
- .planning/phases/07-calculation-transparency/07-RESEARCH.md: Pattern specifications
- .planning/phases/07-calculation-transparency/07-01-PLAN.md: Original requirements

---
*Phase: 07-calculation-transparency*
*Completed: 2026-01-31*
