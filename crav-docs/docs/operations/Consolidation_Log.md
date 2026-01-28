# CR AudioViz AI - Consolidation Log

## Purpose
This log documents all major consolidation and architectural decisions made for the CR AudioViz AI platform.

---

## Entry: Canonical Shared Services Architecture Lock

**Date:** January 27, 2026, 4:30 AM EST  
**Type:** Architectural Decision Record (ADR)  
**Authority:** Roy Henderson, CEO & Co-Founder  
**Status:** LOCKED - No Deviations Permitted

### Decision

**LOCKED the Hub-and-Spoke shared services architecture as the canonical model for the entire CR AudioViz AI ecosystem.**

### Context

Following comprehensive review of all past chats, documentation, and repository structure, inconsistencies and ambiguities were identified regarding which repository owns shared services (payments, credits, authentication, etc.).

Multiple sources suggested payment logic might exist in both `javariverse-hub` AND `javari-ai`, creating confusion and potential for architectural drift.

### Resolution

**AUTHORITATIVE DECLARATION:**

1. **`javariverse-hub` (craudiovizai.com) is the SOLE OWNER of ALL shared services.**

2. **Shared services include (non-exhaustive):**
   - Authentication (OAuth, email/password, sessions)
   - Payments (Stripe + PayPal integration)
   - Credits system (balances, transactions, spending)
   - Subscriptions & Billing
   - Webhooks (Stripe, PayPal)
   - CRM & Customer Data
   - Support Ticketing
   - Analytics & Tracking
   - Marketing Automation
   - Activity Logs & Audit Trails
   - Asset Management
   - Cross-Selling Engine

3. **ALL other apps (including Javari AI) are CONSUMERS ONLY.**

4. **Apps MUST NOT implement:**
   - Payment processing logic
   - Credit management systems
   - Subscription handling
   - Authentication systems
   - Session management
   - Billing calculations
   - Webhook handlers for payments
   - Customer data storage (except app-specific data)

5. **Any app found implementing the above is in architectural violation and must be refactored immediately.**

### Rationale

**Benefits:**
- Eliminates duplication and inconsistency
- Single source of truth for critical business logic
- Easier to maintain and debug
- Consistent user experience across all apps
- Simplified compliance (PCI-DSS, GDPR, etc.)
- Faster app development (no need to rebuild shared services)
- Unified analytics and reporting

**Risks of Alternative Approaches:**
- Payment logic bugs affecting multiple apps
- Inconsistent credit spending behavior
- Security vulnerabilities duplicated across apps
- Difficult to track payments and transactions
- Impossible to maintain unified customer view

### Implementation Details

**Updated Documentation:**
- `docs/CENTRAL_SERVICES.md` - Comprehensive architectural lock document
- Added explicit DO / DO NOT lists for apps
- Added payment & credit flow diagrams
- Added enforcement checklist for code reviews

**Key Statements Added:**
- "All payment logic lives in javariverse-hub. Apps never touch Stripe or PayPal."
- "javariverse-hub is the SOLE OWNER and EXCLUSIVE PROVIDER of all shared services."
- "Apps are CONSUMERS ONLY and MUST NOT implement their own versions of shared services."

**Enforcement Mechanisms:**
1. Code review checklist before app deployment
2. Automated checks for Stripe/PayPal imports in app code
3. Architectural violation flagging system
4. Deployment blocking for non-compliant apps

### Migration Impact

**No code changes required** - This is a documentation-only lock to prevent future violations.

All existing apps already use `lib/central-services.ts` v3.0.0 and are compliant with this architecture.

### Compliance Verification

**Apps Verified:**
- ✅ 93 apps using `central-services.ts` v3.0.0
- ✅ No payment processing code in app repositories
- ✅ No direct credit management in app repositories
- ✅ All apps consuming shared services via hub

**Exceptions:**
- `market-oracle-app` - Archived/read-only, cannot be updated

### Future Enforcement

**Any new app MUST:**
1. Use `lib/central-services.ts` from day one
2. Never import Stripe or PayPal SDKs
3. Never directly query credit_balances or credit_transactions tables
4. Never implement payment webhooks
5. Redirect to hub for all payment/subscription operations

**Code Review Gate:**
Before any app deployment, automated checks will verify:
- No Stripe imports
- No PayPal imports
- No direct writes to shared service tables
- Uses `CentralServices` for all shared functionality

### Architectural Diagram

```
┌─────────────────────────────────────────┐
│    JAVARIVERSE-HUB (CENTRAL HUB)       │
│       craudiovizai.com/api              │
│                                         │
│  ✅ OWNS ALL SHARED SERVICES           │
│  • Authentication                       │
│  • Payments (Stripe + PayPal)           │
│  • Credits System                       │
│  • Subscriptions                        │
│  • CRM, Support, Analytics              │
└──────────────┬──────────────────────────┘
               │
               │ ALL APPS CONNECT HERE
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌──▼──┐  ┌───▼───┐
│JAVARI │  │100+ │  │SHARED │
│  AI   │  │APPS │  │  DB   │
│       │  │     │  │       │
│CONSUME│  │ USE │  │ACCESS │
│ ONLY  │  │ONLY │  │VIA HUB│
└───────┘  └─────┘  └───────┘
```

### References

- **Documentation:** `/docs/CENTRAL_SERVICES.md`
- **Implementation:** `/lib/central-services.ts` v3.0.0
- **Prior Work:** Consolidation completed January 9, 2026
- **Chat Context:** "Payments architecture verification" (January 27, 2026)

### Sign-Off

**Approved By:** Roy Henderson, CEO & Co-Founder  
**Date:** January 27, 2026  
**Effective Immediately:** Yes

---

## Previous Entries

### Entry: Central Services v3.0.0 Consolidation

**Date:** January 9, 2026  
**Summary:** Updated all 93 apps to use `lib/central-services.ts` v3.0.0, eliminating separate auth, credits, and service implementations across individual apps.

**Files Updated:**
- 93 apps with central-services.ts v3.0.0
- 43 apps with standardized supabase.ts
- 3 new API routes created (/api/registry/*)

**Status:** Complete

---

*This log is maintained to track all major architectural decisions and consolidations for the CR AudioViz AI platform.*
