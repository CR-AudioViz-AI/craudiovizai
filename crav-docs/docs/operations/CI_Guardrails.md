# CI Guardrails - javariverse-hub

**Last Updated:** January 7, 2026  
**Repository:** CR-AudioViz-AI/javariverse-hub  
**Production:** https://craudiovizai.com

---

## When CI Runs

| Trigger | Workflow | Action |
|---------|----------|--------|
| Push to `main` | E2E Tests | Runs Playwright against production |
| Push to `main` | CI/CD Pipeline | Build + Deploy to Vercel |
| Pull Request to `main` | E2E Tests | Validates changes before merge |
| Pull Request to `main` | CI/CD Pipeline | Preview deployment |
| Manual dispatch | E2E Tests | On-demand validation |

### Workflow Files

```
.github/workflows/
├── e2e-craudiovizai-playwright.yml  # E2E critical path tests
├── ci.yml                            # Build pipeline
├── playwright.yml                    # Legacy (disabled)
└── stability.yml                     # Stability checks
```

---

## What Blocks Deploys

| Check | Blocks Deploy? | Severity |
|-------|----------------|----------|
| E2E test failure | ❌ No (separate workflow) | Creates issue |
| Build failure | ✅ Yes | Stops deployment |
| TypeScript errors | ❌ No (ignoreBuildErrors: true) | Logged only |
| ESLint errors | ❌ No (ignoreDuringBuilds: true) | Logged only |

### Current Configuration

Vercel deploys on every push to `main` regardless of E2E status.  
E2E failures create GitHub issues for manual triage.

**Future enhancement:** Add branch protection rule requiring E2E pass.

---

## Who Owns Failures

| Failure Type | Owner | Response Time |
|--------------|-------|---------------|
| E2E critical path | Engineering Lead | 4 hours |
| Build failure | Last committer | Immediate |
| Deployment failure | DevOps / Vercel | 1 hour |
| P0 Issue created | On-call engineer | Same day |

### Escalation Path

```
E2E Failure → GitHub Issue [e2e-failure] → Slack #eng-alerts → PagerDuty (if critical)
```

---

## Where Artifacts Live

### GitHub Actions Artifacts

| Artifact | Retention | Contents |
|----------|-----------|----------|
| playwright-results | 30 days | Reports, screenshots, traces, videos |
| test-output.log | 30 days | Raw test console output |

**Access:** `Actions` tab → Select run → `Artifacts` section

### Vercel

| Artifact | Location |
|----------|----------|
| Build logs | Vercel Dashboard → Deployments |
| Function logs | Vercel Dashboard → Logs |
| Preview URLs | PR comments (auto-posted) |

---

## Workflow Permissions

| Workflow | Permissions |
|----------|-------------|
| E2E Tests | `contents: read`, `issues: write` |
| CI/CD | `contents: read` |

---

## Environment Variables

### Required Secrets (GitHub)

| Secret | Used By | Purpose |
|--------|---------|---------|
| (none currently) | — | E2E tests hit public URLs |

### Required Secrets (Vercel)

| Variable | Purpose |
|----------|---------|
| SUPABASE_URL | Database connection |
| SUPABASE_SERVICE_ROLE_KEY | Auth |
| STRIPE_* | Payment processing |
| Various API keys | Third-party integrations |

---

## Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| E2E pass rate | GitHub Actions | <100% → Issue created |
| Deploy success | Vercel | Failure → Email |
| Site uptime | (external) | TBD |

---

## Runbooks

### E2E Test Failing

1. Check GitHub Issue for error details
2. Download artifacts from workflow run
3. Review `test-output.log` for stack trace
4. Check `playwright-report/index.html` for visual diff
5. Reproduce locally: `npm run e2e`
6. Fix and push to `main`
7. Verify CI goes green
8. Close issue

### Build Failing

1. Check Vercel deployment logs
2. Identify failing step
3. Fix locally, test with `npm run build`
4. Push fix to `main`

---

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Review E2E coverage | Monthly | Engineering |
| Update Playwright version | Quarterly | DevOps |
| Audit CI permissions | Quarterly | Security |
| Rotate credentials | See ROADMAP.md | Engineering Lead |
