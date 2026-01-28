# E2E Test Baseline - craudiovizai.com

**Frozen:** January 7, 2026  
**Owner:** CR AudioViz AI Engineering  
**Target:** https://craudiovizai.com

---

## Pinned Versions

| Component | Version | Lock Method |
|-----------|---------|-------------|
| @playwright/test | 1.48.0 | package.json (exact, no caret) |
| Playwright Container | v1.48.0-jammy | workflow YAML |
| Node.js | 20.x | workflow YAML |

---

## What Is Covered

| Test | Route | Assertion |
|------|-------|-----------|
| Homepage loads | `/` | No `Application error`, body visible |
| Login renders | `/login` | No JS crash, content renders |
| Get Started routes | `/` → click | Navigation succeeds |
| Social links valid | footer | No `href="#"` on social icons |
| Apps page works | `/apps` | Page loads, card clicks work |
| Pricing loads | `/pricing` | No 404, content renders |

### Detection Mechanisms

- **pageerror** listener: Catches uncaught JavaScript exceptions → **TEST FAILS**
- **console.error** listener: Logs warnings (CSP, 404) → **LOGGED ONLY, NO FAIL**
- **Application error** text detection → **TEST FAILS**

---

## What Is NOT Covered (Intentional)

| Area | Reason |
|------|--------|
| Authentication flows | Requires test accounts, deferred |
| Payment processing | Requires Stripe test mode setup |
| API endpoints | Covered by unit tests, not E2E |
| Mobile viewports | Desktop-first, mobile deferred |
| Cross-browser | Chromium only for speed |
| Visual regression | No baseline images yet |
| Performance metrics | Not in scope for critical path |

---

## Failure Escalation

```
Test Fails
    ↓
Workflow exits non-zero
    ↓
GitHub Issue auto-created
    ↓
Labels: [bug, e2e-failure]
    ↓
Artifacts uploaded (30-day retention):
  - playwright-report/
  - test-results/
  - Screenshots
  - Traces
  - Videos
```

### Issue Template

```
Title: [E2E] Test failure on craudiovizai.com
Body:
  - Target URL
  - Workflow run link
  - Timestamp
  - Test output (last 3000 chars)
  - Link to artifacts
```

---

## Deterministic Guarantees

- **Retries: 0** — No masking flaky tests
- **Workers: 1** — Sequential execution
- **Parallel: false** — Predictable order
- **forbidOnly: true** — No `.only()` in CI

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Run E2E tests
npm run e2e

# View report
npm run e2e:report
```

---

## Maintenance

- Tests live in: `tests/e2e/craudiovizai.critical.spec.ts`
- Config: `playwright.config.ts`
- Workflow: `.github/workflows/e2e-craudiovizai-playwright.yml`

**Do not modify pinned versions without updating this baseline.**
