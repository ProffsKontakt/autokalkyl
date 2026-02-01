# Phase 8: Schema & Migration Foundation - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Data model extensions for v1.2 features (HeatingType enum, natagare peak fields) and centralization of all hardcoded currentPeakKw references into a single config source. Existing 113 calculations must continue working with unchanged results.

</domain>

<decisions>
## Implementation Decisions

### Migration safety
- Dry-run mode required: migration script shows what would change, requires confirmation before applying
- Verification approach: Claude's discretion (snapshot comparison recommended)
- Rollback strategy: Claude's discretion (transaction + backup recommended)
- Idempotency: Claude's discretion (idempotent preferred for safety)

### Default peak values
- Default value: Claude's discretion (8 kW is current behavior, reasonable Swedish default)
- Configurability: Claude's discretion (code constant likely sufficient)
- New calculations: User must input peak value explicitly — no default pre-filled
- Existing calculations: Claude's discretion (preserve current 8 kW behavior)

### Heating type defaults
- Existing calculations: Claude's discretion (leave null, don't force migration)
- New calculations: Heating type is required in wizard
- Grandfathering: Old calculations work without heating type, new ones require it
- Profile percentages: Claude's discretion (hardcoded research-based profiles likely sufficient)

### Claude's Discretion
- Exact verification method for unchanged calculation results
- Rollback strategy (transaction-based, backup, or both)
- Idempotent vs one-time migration
- Default peak value (8 kW is sensible)
- Where centralized config lives (code constant vs environment)
- How to handle existing calculations' peak values
- Seasonal profile percentages per heating type

</decisions>

<specifics>
## Specific Ideas

- User explicitly wants dry-run confirmation before migration applies
- Peak value must be user-input for new calculations — don't pre-fill a default
- Grandfather existing calculations — don't block or force updates on old data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-schema-migration-foundation*
*Context gathered: 2026-02-01*
