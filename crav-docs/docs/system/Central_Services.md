# CR AudioViz AI - Central Services Consolidation

## Overview

All 93+ apps in the CR AudioViz AI ecosystem use centralized services through `craudiovizai.com/api`. This eliminates separate auth, credits, and other service implementations across individual apps.

## Date Completed
January 9, 2026

## Last Updated
January 27, 2026 - Canonical Hub-and-Spoke Architecture Lock

---

# Canonical Shared Services Architecture (Hub-and-Spoke Model)

## AUTHORITATIVE ARCHITECTURAL DECISION

**Effective Date:** January 27, 2026  
**Status:** LOCKED - No Deviations Permitted  
**Authority:** Roy Henderson, CEO & Co-Founder

### Core Principle

**`javariverse-hub` (craudiovizai.com) is the SOLE OWNER and EXCLUSIVE PROVIDER of all shared services across the entire CR AudioViz AI ecosystem.**

All other applications, including Javari AI, are **CONSUMERS ONLY** and **MUST NOT** implement their own versions of shared services.

---

## Hub-and-Spoke Architecture

```
                    ┌─────────────────────────────────┐
                    │     JAVARIVERSE-HUB (HUB)      │
                    │    craudiovizai.com/api        │
                    │                                 │
                    │  ✅ OWNS ALL SHARED SERVICES   │
                    │  • Authentication (OAuth/SSO)   │
                    │  • Payments (Stripe + PayPal)   │
                    │  • Credits System               │
                    │  • Subscriptions & Billing      │
                    │  • Webhooks                     │
                    │  • CRM & Customer Data          │
                    │  • Support Ticketing            │
                    │  • Analytics & Tracking         │
                    │  • Marketing Automation         │
                    │  • Activity Logs & Audit        │
                    │  • Asset Management             │
                    │  • Cross-Selling Engine         │
                    └──────────────┬──────────────────┘
                                   │
                                   │ ALL APPS CONNECT HERE
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
              │  JAVARI   │  │  100+   │  │  SHARED   │
              │    AI     │  │  APPS   │  │ SUPABASE  │
              │ (SPOKE)   │  │(SPOKES) │  │    DB     │
              │           │  │         │  │           │
              │ CONSUMES  │  │ CONSUME │  │ ACCESSED  │
              │   ONLY    │  │  ONLY   │  │ VIA HUB   │
              └───────────┘  └─────────┘  └───────────┘
```

---

## Ownership Rules

### ✅ HUB OWNS (javariverse-hub ONLY)

1. **Payment Processing**
   - Stripe integration and API
   - PayPal integration and API
   - Checkout session creation
   - Payment webhook handlers
   - Subscription management
   - Invoice generation

2. **Credit System**
   - Credit balance management
   - Credit transactions ledger
   - Credit spending logic
   - Credit refund processing
   - Auto-reload functionality
   - Credit package definitions

3. **Authentication & Authorization**
   - OAuth providers (Google, GitHub, etc.)
   - Email/password authentication
   - Session management
   - JWT token issuance
   - User permissions
   - Admin bypass logic

4. **Billing & Subscriptions**
   - Subscription lifecycle management
   - Plan upgrades/downgrades
   - Billing cycle management
   - Proration calculations
   - Cancellation handling

5. **Customer Relationship Management (CRM)**
   - Customer data storage
   - Lead tracking
   - Marketing campaigns
   - Email automation
   - Customer segmentation

6. **Support Infrastructure**
   - Ticket creation and management
   - Enhancement request voting
   - Knowledge base
   - FAQ management

7. **Analytics & Tracking**
   - Event tracking
   - Page view analytics
   - Conversion tracking
   - User behavior analysis
   - Revenue reporting

8. **Cross-Platform Services**
   - Activity logging / Audit trails
   - Notifications (email, push, in-app)
   - Asset management (logos, images)
   - Cross-selling recommendations
   - App registry and health monitoring

### ❌ APPS MUST NOT IMPLEMENT

**Apps (including Javari AI) are PROHIBITED from implementing:**

1. ❌ Payment processing logic (Stripe, PayPal, or any payment gateway)
2. ❌ Credit management systems
3. ❌ Subscription handling
4. ❌ Authentication systems (OAuth, email/password)
5. ❌ Session management
6. ❌ Billing calculations
7. ❌ Webhook handlers for payments
8. ❌ Customer data storage (except app-specific data)
9. ❌ Support ticketing systems
10. ❌ Analytics tracking infrastructure

**VIOLATION:** Any app found implementing the above is in architectural violation and must be refactored immediately.

### ✅ APPS MAY IMPLEMENT

Apps ARE PERMITTED to implement:

1. ✅ App-specific business logic
2. ✅ App-specific UI/UX
3. ✅ App-specific data models (in separate tables)
4. ✅ App-specific API routes (non-shared functionality)
5. ✅ App-specific features and workflows

**WITH THE REQUIREMENT:** All apps MUST use `lib/central-services.ts` to access shared services.

---

## Payment & Credit Flow Diagram

### Subscription Purchase Flow

```
1. USER (Any App)
   ↓ Clicks "Subscribe to Pro"
   
2. APP (javari-books, games, etc.)
   ↓ Redirects to: craudiovizai.com/pricing
   
3. HUB (javariverse-hub)
   ↓ User selects plan
   ↓ Acknowledges No-Refund Policy
   ↓ Creates Stripe checkout session via /api/payments/stripe/checkout
   
4. STRIPE
   ↓ User completes payment
   ↓ Fires webhook to: craudiovizai.com/api/webhooks/stripe
   
5. HUB (Webhook Handler)
   ↓ Validates webhook signature
   ↓ Creates subscription record in Supabase
   ↓ Adds credits to credit_transactions table
   ↓ Updates credit_balances table
   
6. USER
   ↓ Redirected back to original app
   ↓ App reads updated balance from Supabase
   ✅ User sees new credit balance
```

### Credit Spending Flow

```
1. USER (In Any App)
   ↓ Performs action (e.g., "Generate AI image")
   
2. APP (javari-logo, javari-books, etc.)
   ↓ Calls: CentralServices.Credits.canAfford('ai_image')
   ↓ Hub responds: { allowed: true, cost: 5, balance: 600 }
   
3. APP
   ↓ Calls: CentralServices.Credits.spendForAction('ai_image', 'app-id', 'description')
   ↓ Hub API: POST craudiovizai.com/api/credits/spend
   
4. HUB (Credit API)
   ↓ Validates user session
   ↓ Checks admin bypass (royhenderson@craudiovizai.com = FREE)
   ↓ Executes atomic deduction in Supabase
   ↓ Logs transaction in credit_transactions table
   ↓ Returns: { success: true, new_balance: 595 }
   
5. APP
   ↓ Proceeds with action
   ✅ User sees result
```

---

## Explicit Rules: Payment Logic

### ✅ CORRECT (Hub Owns Payments)

```typescript
// In javariverse-hub/app/api/payments/stripe/checkout/route.ts
export async function POST(req: NextRequest) {
  const { planId, userId, agreedToNoRefundPolicy } = await req.json();
  
  // Hub creates Stripe session
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{ price: PRICE_IDS[planId], quantity: 1 }],
    mode: 'subscription',
    metadata: {
      user_id: userId,
      no_refund_policy_agreed: 'true'
    }
  });
  
  return NextResponse.json({ url: session.url });
}
```

```typescript
// In ANY app (javari-books, javari-spirits, etc.)
import { CentralServices } from '@/lib/central-services';

async function handleSubscribe() {
  // App redirects to hub for payment
  window.location.href = 'https://craudiovizai.com/pricing?plan=pro';
}
```

### ❌ WRONG (App Tries to Own Payments)

```typescript
// ❌ ARCHITECTURAL VIOLATION - NEVER DO THIS
// In javari-books/app/api/payments/stripe/route.ts

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);  // ❌ NO!

export async function POST(req: NextRequest) {
  // ❌ Apps MUST NOT create Stripe sessions
  const session = await stripe.checkout.sessions.create({...});  // ❌ VIOLATION!
}
```

**IF YOU SEE THIS:** The app is in violation and must be refactored to use central services.

---

## Explicit Rules: Credit Logic

### ✅ CORRECT (App Consumes Credits via Hub)

```typescript
// In any app
import { CentralServices } from '@/lib/central-services';

async function generateInvoice() {
  // Check if user can afford
  const { allowed, cost } = await CentralServices.Credits.canAfford('invoice_generate');
  
  if (!allowed) {
    // Redirect to hub for credit purchase
    window.location.href = 'https://craudiovizai.com/pricing';
    return;
  }
  
  // Spend credits via hub
  await CentralServices.Credits.spendForAction('invoice_generate', 'javari-invoice', 'Created invoice');
  
  // Proceed with invoice generation
  // ...
}
```

### ❌ WRONG (App Tries to Manage Credits)

```typescript
// ❌ ARCHITECTURAL VIOLATION - NEVER DO THIS

// App tries to query Supabase directly for credits
const { data } = await supabase
  .from('credit_balances')
  .update({ credits_available: balance - cost })  // ❌ NO!
  .eq('user_id', userId);

// App tries to create transaction records
await supabase
  .from('credit_transactions')
  .insert({ user_id, amount: -cost, ... });  // ❌ VIOLATION!
```

**IF YOU SEE THIS:** The app is bypassing central services and must be refactored.

---

## Central Services Available

| Service | Endpoint | Description | Owner |
|---------|----------|-------------|-------|
| Authentication | `/api/auth/*` | OAuth, Email/Password, Session management | Hub ONLY |
| Credits | `/api/credits/*` | Balance, Spend, Refund, History, Auto-reload | Hub ONLY |
| Payments | `/api/payments/*` | Stripe, PayPal, Subscriptions | Hub ONLY |
| Subscriptions | `/api/subscriptions/*` | Plan management, upgrades, cancellations | Hub ONLY |
| Webhooks | `/api/webhooks/*` | Stripe, PayPal event handlers | Hub ONLY |
| Support | `/api/support/*` | Tickets, Knowledge Base, FAQ | Hub ONLY |
| Enhancements | `/api/support/enhancements/*` | Feature Requests, Voting | Hub ONLY |
| Analytics | `/api/analytics/*` | Event Tracking, Page Views | Hub ONLY |
| Activity | `/api/activity/*` | Audit Trail | Hub ONLY |
| Notifications | `/api/notifications/*` | Email, Push, In-App | Hub ONLY |
| Registry | `/api/registry/*` | App Discovery, Health Reporting | Hub ONLY |
| Recommendations | `/api/recommendations` | Cross-selling | Hub ONLY |
| CRM | `/api/crm/*` | Customer data, campaigns | Hub ONLY |
| Assets | `/api/assets/*` | Logos, images, media | Hub ONLY |

**ALL PAYMENT LOGIC LIVES IN JAVARIVERSE-HUB. APPS NEVER TOUCH STRIPE OR PAYPAL.**

---

## Database Access Rules

### Shared Tables (Hub Manages, Apps Read)

| Table | Hub Access | App Access |
|-------|-----------|------------|
| `users` | Full (create, update, delete) | Read-only via session |
| `profiles` | Full | Read-only via session |
| `subscriptions` | Full | Read-only via API |
| `credit_transactions` | Full | Read-only via API |
| `credit_balances` | Full | Read-only via API |
| `payments` | Full | **NO ACCESS** |
| `invoices` | Full | Read-only via API |
| `support_tickets` | Full | Create via API, Read via API |
| `user_activity` | Full | Create via API only |

### App-Specific Tables (App Manages)

Apps MAY create and manage their own tables:
- `javari_spirits_bottles`
- `javari_cards_collections`
- `javari_books_library`

**RULE:** App-specific tables MUST NOT duplicate or replace shared service tables.

---

## Admin Bypass

The following email addresses receive FREE access to all services:
- royhenderson@craudiovizai.com
- cindyhenderson@craudiovizai.com
- roy@craudiovizai.com
- cindy@craudiovizai.com
- admin@craudiovizai.com

**Implementation:** Admin bypass is enforced in the HUB only. Apps inherit this via central services API.

---

## Credit Costs

Standard credit costs defined in central-services.ts:

| Action | Cost |
|--------|------|
| AI Image | 5 credits |
| AI Video | 20 credits |
| AI Audio | 10 credits |
| AI Text/Chat | 1 credit |
| Pattern (Basic) | 3 credits |
| Pattern (Advanced) | 10 credits |
| PDF Generate | 3 credits |
| eBook Generate | 10 credits |
| Invoice Generate | 2 credits |
| Game Play | FREE |

---

## Usage Examples

### Check and Spend Credits
```typescript
import { CentralServices } from './central-services';

// Check if user can afford action
const { allowed, cost, balance } = await CentralServices.Credits.canAfford('ai_image');

if (allowed) {
  // Spend credits
  await CentralServices.Credits.spendForAction('ai_image', 'my-app-id', 'Generated AI image');
}
```

### Authentication
```typescript
import { CentralAuth } from './central-services';

// Get current session
const session = await CentralAuth.getSession();

// Sign in
await CentralAuth.signIn('user@example.com', 'password');

// OAuth
CentralAuth.oAuthSignIn('google', window.location.href);
```

### Support Tickets
```typescript
import { CentralServices } from './central-services';

// Create ticket
await CentralServices.Support.createTicket(
  'Bug Report',
  'Description of the issue...',
  'bug',
  'my-app-id'
);
```

### Analytics
```typescript
import { CentralServices } from './central-services';

// Track event
await CentralServices.Analytics.track('feature_used', { feature: 'ai_image' }, 'my-app-id');

// Track page view
await CentralServices.Analytics.pageView('/dashboard', 'my-app-id');
```

---

## Enforcement & Compliance

### Code Review Checklist

Before any app deployment, verify:

- [ ] No Stripe imports in app code
- [ ] No PayPal imports in app code
- [ ] No direct credit_balances table writes
- [ ] No direct credit_transactions table writes
- [ ] No payment webhook handlers in app
- [ ] Uses `CentralServices` for all shared functionality
- [ ] Only accesses Supabase for app-specific tables

### Architectural Violations

**IF AN APP:**
1. Creates Stripe/PayPal sessions
2. Handles payment webhooks
3. Directly modifies credit balances
4. Implements its own auth system
5. Stores customer payment data

**THEN:**
- Flag as architectural violation
- Block deployment
- Require immediate refactor to use central services

---

## Files Updated

### Per App
1. `lib/central-services.ts` - v3.0.0 (871 lines)
2. `lib/supabase.ts` - Standardized with central services integration

### Total Changes
- 93 apps updated with central-services.ts v3.0.0
- 43 apps had supabase.ts standardized
- 3 new API routes created (/api/registry/*)

---

## Exceptions

1. **market-oracle-app** - Archived/read-only repository, cannot be updated

---

## Verification

All apps verified to have:
- ✅ `lib/central-services.ts` v3.0.0
- ✅ `lib/supabase.ts` with central services re-exports
- ✅ Successful Vercel deployments
- ✅ No payment processing code
- ✅ No direct credit management code

---

## Live Endpoints

- Hub: https://craudiovizai.com
- Registry API: https://craudiovizai.com/api/registry
- Status API: https://craudiovizai.com/api/registry/status

---

## Summary

**This architecture is LOCKED and NON-NEGOTIABLE.**

All payment, credit, auth, and shared service logic lives in `javariverse-hub`.  
All apps are consumers only.  
Any deviation is an architectural violation requiring immediate correction.

**Documented:** January 27, 2026  
**Authority:** Roy Henderson, CEO & Co-Founder
