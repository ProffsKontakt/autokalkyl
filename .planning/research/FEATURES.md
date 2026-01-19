# Feature Landscape: Kalkyla.se

**Domain:** Multi-tenant SaaS for battery ROI calculations (sales enablement)
**Researched:** 2026-01-19
**Confidence:** MEDIUM-HIGH (verified against multiple SaaS patterns and Swedish energy market data)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or unprofessional.

### Multi-Tenant Organization Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Organization CRUD | Basic business unit management | Low | Create, read, update, delete organizations |
| User invitation system | Standard onboarding pattern | Medium | Email invites with role assignment |
| Role-based access control (RBAC) | Security baseline for B2B | Medium | Super Admin > Org Admin > Closer > Prospect hierarchy |
| Organization-scoped data isolation | Multi-tenant requirement | High | Every record must belong to exactly one tenant |
| Basic branding (logo, primary color) | Competitive expectation | Low | White-label is standard in B2B SaaS |
| User profile management | Basic UX expectation | Low | Name, email, password change |

**Source:** Multi-tenant architecture patterns are well-documented. Role-based access with tenant-scoped permissions is the "obvious access control mechanism" per [WorkOS guide](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture). Data isolation where "every piece of data belongs to exactly one tenant" is a first-class requirement per [Frontegg](https://frontegg.com/blog/saas-multitenancy).

### Calculation Builder

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Customer information capture | Basic data entry | Low | Name, address, contact info |
| Consumption data input | Core functionality | Medium | 12 months x 24 hours = 288 data points default |
| Battery selection from catalog | Product configuration | Medium | Pre-defined battery options per org |
| Pricing/margin configuration | CPQ baseline | Medium | Base price + margin calculation |
| Save and retrieve calculations | Persistence expectation | Low | CRUD for calculations |
| Calculation summary view | Results presentation | Medium | ROI metrics, payback period, savings breakdown |

**Source:** CPQ (Configure, Price, Quote) software "allows users to select products and configure them based on customer requirements" per [Salesforce CPQ guide](https://www.salesforce.com/sales/cpq/what-is-cpq/). Product configuration with pricing that "adjusts as user choices change" is standard.

### Customer-Facing Shareable Links

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Unique shareable URL per calculation | Core value proposition | Low | UUID-based public links |
| View-only mode for prospects | Security requirement | Low | No edit access for external viewers |
| Mobile-responsive display | 2025 baseline | Medium | Must work on phones |
| Org branding on shared view | Professional appearance | Low | Logo, colors from org settings |
| Results summary display | Core output | Medium | Clear presentation of ROI/savings |

**Source:** Calculator builders universally offer "shareable URL, iFrame, QR code options" per [Cowculator](https://www.cowculator.app/en/) and similar tools. [Shout.com](https://shout.com/development/interactive-calculator-builder/) confirms "URL link for simple sharing" is standard.

### Admin Dashboard

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Calculation count/status overview | Basic metrics | Low | How many calculations created, viewed |
| User list management | Admin necessity | Low | See and manage org users |
| Basic activity log | Audit trail | Medium | Who did what, when |
| Organization settings page | Config management | Low | Branding, defaults |

**Source:** "An effective SaaS Dashboard focuses on actionable metrics, boasts real-time data updates, and offers customization options" per [NetSuite](https://www.netsuite.com/portal/resource/articles/erp/saas-dashboards.shtml).

---

## Differentiators

Features that set product apart. Not expected, but valued. Competitive advantage.

### Swedish Energy Market Intelligence

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Natagarare (grid operator) database | Swedish-specific value | Medium | Pre-loaded effekttariff rates by grid operator |
| Effekttariff (power tariff) optimization | Key Swedish savings mechanism | High | Calculate peak demand fee savings (81.25 SEK/kW typical) |
| Grid services income projection | Additional revenue stream | High | FCR-D, aFRR, mFRR market participation estimates |
| Spotpris (spot price) integration | Real-time price data | Medium | Nord Pool integration for accurate savings |
| Swedish tax incentive calculation | Accurate ROI | Medium | 50% "Gron teknik" deduction on storage, 20% on installation |

**Source:** Swedish effekttariff model charges based on "average of your three highest hourly peaks each month" per [Sourceful Energy](https://sourceful.energy/blog/how-stockholm-homeowners-are-saving-2-925-kr-per-year-on-peak-demand-fees). Stockholm homeowners save 267 EUR/year on peak demand fees alone. Swedish "Gron teknik" tax credit offers 50% deduction per [Vnice Power analysis](https://vnicepower.store/blogs/news/is-home-battery-storage-worth-it-in-sweden).

### Interactive Consumption Simulator

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Interactive consumption adjustment | Prospect engagement | High | Let prospects modify their consumption estimates |
| Visual consumption profile | Understanding | Medium | 24-hour profile visualization |
| Before/after comparison | Value demonstration | Medium | Show impact of battery on consumption pattern |
| Scenario comparison | Decision support | High | Compare different battery sizes/configs |

**Source:** Interactive elements that "empower prospects to click and choose what they want" drive higher engagement per [FastSpring IQ](https://fastspring.com/interactive-quotes/). "Dynamic pricing that prospects can adjust to fit their needs" is a key CPQ differentiator.

### Advanced Sales Enablement

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| PDF export of calculations | Professional delivery | Medium | Branded PDF for offline sharing |
| Margin alerts via webhook | Protect profitability | Medium | N8N integration for low-margin warnings |
| Calculation templates | Faster quoting | Low | Pre-configured starting points |
| Duplicate calculation | Iteration support | Low | Quick variations for comparison |

**Source:** "Built-in proposal generation enables users to easily publish and send error-free quotes with consistent, preapproved branding" per [NetSuite CPQ](https://www.netsuite.com/portal/resource/articles/erp/configure-price-quote-cpq.shtml). Webhook-based alerting follows best practice of "authenticate quickly, persist safely, acknowledge immediately" per [Beeceptor](https://beeceptor.com/docs/webhook-feature-design/).

### Analytics and Insights

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Calculation conversion tracking | Sales performance | Medium | Which calculations lead to views/engagement |
| Closer performance metrics | Team management | Medium | Calculations per closer, view rates |
| Time-based trends | Business intelligence | Medium | Calculations over time, seasonal patterns |
| Custom event tracking (PostHog) | Deep analytics | Medium | User behavior, feature usage |

**Source:** "Analytics and reporting are the fastest-expanding sub-segment" in sales enablement per [Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/sales-enablement-platform-market). Role-specific dashboards for "sales, marketing, finance" are best practice per [NetSuite](https://www.netsuite.com/portal/resource/articles/erp/saas-dashboards.shtml).

### Advanced Organization Features

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Custom domain support | Enterprise branding | High | calculations.customerdomain.com |
| SSO integration (SAML/OIDC) | Enterprise sales | High | Defer unless targeting large orgs |
| API access for integrations | Platform extensibility | High | REST API for CRM integration |
| Bulk user import | Enterprise onboarding | Medium | CSV import for larger orgs |

**Source:** "Enterprise customers will also need features such as Single Sign-On (SSO) integration" per [WorkOS](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture). Custom domains and SSO are "enterprise" tier features in most SaaS.

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time spot price display on public links | Prices change; creates confusion/liability | Show calculation date, note prices are estimates |
| Actual grid services contract integration | Complex, regulatory, outside scope | Project estimated income based on market averages |
| Customer self-registration | Creates spam, support burden | Invitation-only via org admins |
| Public calculation directory | Privacy violation, competitive exposure | Private links only |
| Complex consumption import (CSV, API) | Too technical for sales closers | Simple manual input with smart defaults |
| AI-generated consumption estimates | Unreliable, liability risk | User-provided data with validation |
| Multi-currency support | Swedish market only | SEK hardcoded |
| Prospect editing of calculations | Breaks closer control, audit trail | View-only with "request adjustment" |
| In-app chat/messaging | Scope creep, support burden | Email link in interface instead |
| Automatic contract generation | Legal complexity, outside scope | Export to PDF, external signing |
| Battery comparison shopping | Becomes price comparison site | Org-specific battery catalog only |
| Historical spot price charts | Feature creep, data licensing | Link to external resources |
| Complex approval workflows | Over-engineering for initial market | Simple margin alerts instead |

**Rationale:**
- Complexity avoidance: Each anti-feature adds maintenance burden disproportionate to value
- Liability reduction: Avoid features that could create legal/financial exposure
- Focus preservation: Stay in the "sales enablement calculator" lane, not "energy management platform"

---

## Feature Dependencies

```
FOUNDATION (Must exist first):
  Organization Management
    |
    +-- User Management (requires org context)
    |
    +-- Battery Catalog (org-scoped)
    |
    +-- Natagarare Database (org-scoped or global)

CORE PRODUCT (Requires foundation):
  Calculation Builder
    |
    +-- Consumption Input (core data)
    |
    +-- Battery Selection (from catalog)
    |
    +-- Pricing/ROI Engine (calculation logic)
    |
    +-- Results Display (output)

DISTRIBUTION (Requires core):
  Shareable Links
    |
    +-- Public View (requires calculation)
    |
    +-- Org Branding (requires org settings)

ENHANCEMENT (Can layer on):
  Analytics (requires calculations + views)
  Margin Alerts (requires pricing engine)
  PDF Export (requires results)
  Interactive Adjustment (requires consumption + recalculation)
```

---

## MVP Recommendation

For MVP, prioritize in this order:

### Phase 1: Foundation
1. Organization CRUD with basic branding
2. User management with RBAC (4 roles)
3. Battery catalog per org
4. Natagarare database (can be global/seeded)

### Phase 2: Core Calculator
5. Calculation builder: customer info, consumption, battery selection
6. ROI calculation engine: spotpris savings, effekttariff savings, payback period
7. Calculation save/retrieve
8. Basic results display

### Phase 3: Distribution
9. Shareable public links
10. Mobile-responsive public view
11. Org branding on public view

### Defer to Post-MVP

| Feature | Reason to Defer |
|---------|-----------------|
| Grid services income projection | Requires market data integration, complex |
| Interactive consumption adjustment | UX complexity, recalculation engine |
| PDF export | Nice-to-have, not blocking sales |
| Margin alerts (N8N webhook) | Enhancement layer |
| Analytics dashboard | Need data first |
| SSO/custom domain | Enterprise features |
| 15-year projection | 10-year sufficient initially |

---

## Complexity Estimates

| Feature Category | Estimated Effort | Risk Level |
|------------------|------------------|------------|
| Org management (basic) | 2-3 days | Low |
| User management + RBAC | 3-5 days | Medium |
| Battery catalog | 1-2 days | Low |
| Natagarare database | 2-3 days | Low |
| Consumption input UI | 3-5 days | Medium |
| ROI calculation engine | 5-8 days | High |
| Shareable links | 2-3 days | Low |
| Public view + branding | 2-3 days | Low |
| Interactive adjustment | 5-7 days | High |
| PDF export | 2-3 days | Medium |
| Webhook alerts | 1-2 days | Low |
| Analytics integration | 2-3 days | Low |

**Total MVP estimate:** 20-30 days development

---

## Sources

### Multi-Tenant SaaS Patterns
- [WorkOS Multi-Tenant Architecture Guide](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture) - RBAC, SSO, tenant context
- [Frontegg SaaS Multitenancy](https://frontegg.com/blog/saas-multitenancy) - Data isolation, security patterns
- [Wildnet White-Label Guide](https://www.wildnetedge.com/blogs/how-to-build-a-white-label-saas-product-for-multi-branding-success) - Branding customization

### ROI Calculator & CPQ Tools
- [Salesforce CPQ Guide](https://www.salesforce.com/sales/cpq/what-is-cpq/) - Configure, Price, Quote patterns
- [NetSuite CPQ](https://www.netsuite.com/portal/resource/articles/erp/configure-price-quote-cpq.shtml) - Product configuration, quote generation
- [FastSpring Interactive Quotes](https://fastspring.com/interactive-quotes/) - Prospect interaction patterns
- [Dock Revenue Archives](https://www.dock.us/revenue-archives/roi-calculators) - B2B ROI calculator examples

### Interactive Calculator Builders
- [Cowculator](https://www.cowculator.app/en/) - Shareable links, embedding
- [Outgrow](https://outgrow.co/blog/interactive-calculator-builders) - Lead generation calculators
- [Shout.com](https://shout.com/development/interactive-calculator-builder/) - Sharing options
- [ConvertCalculator](https://www.convertcalculator.com/) - Excel-like formulas

### Swedish Energy Market
- [Sourceful Energy - Stockholm Peak Demand](https://sourceful.energy/blog/how-stockholm-homeowners-are-saving-2-925-kr-per-year-on-peak-demand-fees) - Effekttariff specifics
- [Vnice Power - Sweden Battery Guide](https://vnicepower.store/blogs/news/is-home-battery-storage-worth-it-in-sweden) - Swedish ROI analysis
- [Strategic Energy Europe](https://strategicenergy.eu/sweden-610-mw-batteries-2024/) - Swedish battery market
- [Svenska kraftnat Tariffs](https://www.svk.se/en/stakeholders-portal/electricity-market/connecting-to-the-grid/tariffcharges/) - Grid tariff structure

### SaaS Dashboards & Analytics
- [NetSuite SaaS Dashboards](https://www.netsuite.com/portal/resource/articles/erp/saas-dashboards.shtml) - Dashboard best practices
- [Userpilot Dashboard Tools](https://userpilot.com/blog/dashboard-reporting-tools/) - Reporting features
- [Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/sales-enablement-platform-market) - Sales enablement market

### Webhook & Integration Patterns
- [Beeceptor Webhook Design](https://beeceptor.com/docs/webhook-feature-design/) - Architecture patterns
- [AWS Webhooks](https://aws.amazon.com/blogs/compute/sending-and-receiving-webhooks-on-aws-innovate-with-event-notifications/) - Reliability patterns
