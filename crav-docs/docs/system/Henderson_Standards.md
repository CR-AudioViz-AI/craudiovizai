# Henderson Standards v1.0
## CR AudioViz AI Platform Development Guidelines

**Effective Date:** January 9, 2026  
**Maintainer:** Cindy & Roy Henderson  
**Platform:** craudiovizai.com

---

## 1. Architecture Principle: Centralized Services

### 1.1 Core Rule
**ALL apps MUST route through craudiovizai.com/api for shared services.**

NO app should have its own:
- Authentication endpoints
- Credit management
- Payment processing
- User database connections

### 1.2 Required Files

Every app in the CR AudioViz AI ecosystem MUST have:

```
lib/
├── central-services.ts   # v3.1.0+ (REQUIRED)
└── supabase.ts           # App-specific data ONLY (optional)
```

### 1.3 Central Services Version Requirements

| Version | Status | Notes |
|---------|--------|-------|
| 3.1.0+  | ✅ CURRENT | Full API coverage, Admin bypass |
| 3.0.0   | ⚠️ DEPRECATED | Upgrade required |
| 2.x     | ❌ REJECTED | Must upgrade immediately |
| 1.x     | ❌ REJECTED | Must upgrade immediately |

---

## 2. Central Services API

### 2.1 Available Endpoints

All apps route through `https://craudiovizai.com/api` for:

| Service | Endpoint | Description |
|---------|----------|-------------|
| Auth | `/auth/*` | OAuth, Email/Password, Sessions |
| Credits | `/credits/*` | Balance, Spend, Refund, History |
| Payments | `/payments/*` | Stripe, PayPal, Checkout |
| Support | `/support/*` | Tickets, Knowledge Base |
| Enhancements | `/enhancements/*` | Feature Requests, Voting |
| Analytics | `/analytics/*` | Events, Page Views |
| Activity | `/activity/*` | Audit Trail |
| Notifications | `/notifications/*` | Email, Push, In-App |
| Registry | `/registry/*` | App Discovery, Health |

### 2.2 Admin Bypass

Founders (Cindy & Roy Henderson) receive **FREE unlimited access** to ALL features across ALL apps.

```typescript
// Admin emails that bypass credit charges
const ADMIN_EMAILS = [
  'royhenderson@craudiovizai.com',
  'cindyhenderson@craudiovizai.com',
  'roy@craudiovizai.com',
  'cindy@craudiovizai.com',
  'admin@craudiovizai.com'
];
```

---

## 3. Branding & Color Palette

### 3.1 Approved Colors

| Color | Usage | Hex |
|-------|-------|-----|
| Cyan | Primary accent, buttons, links | `#0891B2` (cyan-600) |
| Slate | Text, borders | `#475569` (slate-600) |
| Gray | Backgrounds | `#F3F4F6` (gray-100) |
| White | Cards, backgrounds | `#FFFFFF` |
| Red | Errors ONLY, "Cindy & Roy" | `#DC2626` (red-600) |

### 3.2 Forbidden Colors

These colors MUST NOT be used anywhere in the platform:
- Purple / Violet
- Green / Emerald
- Yellow / Amber
- Orange
- Pink / Rose
- Indigo

### 3.3 Red Usage Policy

Red is ONLY allowed for:
1. Error messages and states
2. The founders' names "Cindy & Roy" 
3. Warning indicators

---

## 4. Mobile-First Design

### 4.1 Viewport Requirements

| Requirement | Value |
|-------------|-------|
| Minimum viewport | 375px width |
| Tap targets | ≥44px x 44px |
| Font size | ≥14px base |
| Line height | ≥1.5 |

### 4.2 Layout Rules

- Single-column layouts on mobile
- No horizontal scroll
- Bottom navigation for primary actions
- Sticky headers ≤60px height

---

## 5. Credit Costs

### 5.1 Standard Costs by Action

```typescript
const CREDIT_COSTS = {
  // AI Generation
  'ai_image': 5,
  'ai_video': 20,
  'ai_audio': 10,
  'ai_text': 1,
  'ai_code': 2,
  'ai_chat': 1,
  
  // Pattern Generation
  'pattern_basic': 3,
  'pattern_intermediate': 5,
  'pattern_advanced': 10,
  'pattern_custom': 15,
  
  // Documents
  'pdf_generate': 3,
  'invoice_generate': 2,
  'ebook_generate': 10,
  
  // Games
  'game_play': 0,  // Free
  'game_premium_feature': 2,
};
```

---

## 6. Pricing Tiers

### 6.1 Core Plans

| Plan | Price | Credits/Month |
|------|-------|---------------|
| Free | $0 | 50 |
| Pro | $19/mo | 500 |
| Business | $99/mo | 5,000 |

### 6.2 Policies

- **AI Support with escalation** - all plans
- **No refunds** - Credits valid until term ends
- **Credits don't roll over** - Use it or lose it

---

## 7. Testing Requirements

### 7.1 E2E Coverage

All apps MUST have Playwright tests covering:
- Public routes
- Authentication flows
- Critical user journeys
- Mobile viewport (375px)

### 7.2 Build Verification

- No TypeScript errors
- No ESLint errors
- Successful Vercel deployment

---

## 8. File Structure

### 8.1 Standard App Structure

```
app/
├── page.tsx           # Home page
├── layout.tsx         # Root layout
└── api/               # API routes (minimal)
components/
├── layout/
│   ├── Header.tsx
│   └── Footer.tsx
└── [feature]/
lib/
├── central-services.ts  # REQUIRED - v3.1.0+
└── supabase.ts          # App-specific data only
public/
package.json
```

---

## 9. Naming Conventions

### 9.1 Files
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- API routes: `route.ts`

### 9.2 Variables
```typescript
// Constants
const MAX_CREDITS = 1000;
const API_BASE_URL = 'https://craudiovizai.com/api';

// Functions
function calculateTotalCredits() { }
async function fetchUserData() { }

// Components
function UserDashboard() { }
export default function HomePage() { }
```

---

## 10. Accessibility

### 10.1 Requirements

1. All images MUST have `alt` text
2. All forms MUST have labels
3. All buttons MUST have accessible names
4. Color contrast minimum 4.5:1 for text
5. Focus states MUST be visible
6. Keyboard navigation MUST work

---

## 11. Enforcement

### 11.1 Automated Checks

- CI/CD gates on pull requests
- Automated audits via Javari AI
- Nightly compliance scans

### 11.2 Non-Compliance Consequences

Apps that fail standards may be:
- Flagged in admin dashboard
- Excluded from recommendations
- Deprioritized in search results
- Removed from platform

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Maintainer:** CR AudioViz AI Platform Team - Cindy & Roy Henderson
