---
status: complete
phase: 02-reference-data
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md
started: 2026-01-19T18:15:00Z
updated: 2026-01-19T18:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. View Battery List
expected: Navigate to /dashboard/batteries. See list of battery brands with expandable rows showing configurations nested underneath.
result: pass

### 2. Create Battery Brand
expected: Click "Ny Märke" button. Fill in brand name (e.g., "Tesla"). Submit. Brand appears in the list.
result: pass

### 3. Create Battery Configuration
expected: From a brand row, click to add configuration. Fill in specs (model name, capacity kWh, power kW, efficiency %, cycle count, warranty years, cost). Submit. Config appears nested under its brand.
result: pass
note: "User noted Swedish characters (å, ä, ö) missing - shows 'Installningar' instead of 'Inställningar'"

### 4. Edit Battery Brand
expected: Click a brand row to edit. Change the name. Save. List reflects updated name.
result: pass
note: "User wants configurable product types ('Produkt', 'Tjänst') instead of hardcoded 'Nytt' from isNewStack boolean"

### 5. Delete Battery Brand
expected: Click delete on a brand. Confirm. Brand (and its configurations) removed from list.
result: pass
note: "User wants navigation link to /dashboard/batteries in sidebar/menu"

### 6. View Natagare List
expected: Navigate to /dashboard/natagare. See list of grid operators (natagare) with their day/night effect tariff rates displayed.
result: pass

### 7. Create Natagare
expected: Click "Ny Nätägare" button. Fill in name, day rate (SEK/kW), night rate (SEK/kW), day hours (e.g., 6-22). Submit. Natagare appears in list.
result: pass
note: "User wants unlimited decimal precision for rates (currently limited to 2 decimals in form)"

### 8. Edit Natagare Rates
expected: Click to edit a natagare. Change day or night rate. Save. Updated rate displays in list.
result: pass

### 9. Delete Natagare (non-default)
expected: For a non-default natagare, click delete. Confirm. Natagare removed from list.
result: pass
note: "User wants navigation link to /dashboard/natagare in sidebar/menu"

### 10. Default Natagare Protected
expected: For a default natagare (like Ellevio), delete button is disabled or hidden. You cannot delete default natagare.
result: skipped
reason: No default natagare seeded - feature is for pre-seeded defaults

### 11. View Electricity Prices
expected: Navigate to /dashboard/electricity. See quarterly average electricity prices displayed for all 4 elomraden (SE1-SE4) with day and night averages.
result: pass
note: "Page loads correctly, shows 'Ingen data tillgänglig' - no prices fetched yet"

### 12. Tenant Isolation - Batteries
expected: Log in as Org Admin for one organization. Create a battery. Log in as Org Admin for a different organization. The battery from the first org is NOT visible.
result: pass

### 13. Tenant Isolation - Natagare
expected: Log in as Org Admin for one organization. Create a natagare. Log in as Org Admin for a different organization. The natagare from the first org is NOT visible.
result: pass

### 14. Closer View-Only Access
expected: Log in as Closer. Navigate to batteries and natagare pages. You can view the lists but create/edit/delete buttons are hidden or disabled.
result: pass

## Summary

total: 14
passed: 13
issues: 0
pending: 0
skipped: 1

## Gaps

[none yet]
