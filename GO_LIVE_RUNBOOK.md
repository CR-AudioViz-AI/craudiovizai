# CR AUDIOVIZ AI - GO-LIVE RUNBOOK v1.0
## Launch Readiness & Operations Guide

**Created:** January 2, 2026 - 2:11 AM EST  
**Version:** 1.0  
**Owner:** Roy Henderson (CEO)

---

## 📋 PRE-LAUNCH CHECKLIST

### Gate 1: Revenue & Onboarding ✅
| Task | Status | Verified By | Date |
|------|--------|-------------|------|
| Pricing page accurate | ⬜ | | |
| Stripe checkout end-to-end | ⬜ | | |
| PayPal checkout end-to-end | ⬜ | | |
| Welcome email sequence (Gmail) | ⬜ | | |
| Welcome email sequence (Outlook) | ⬜ | | |
| Welcome email sequence (Yahoo) | ⬜ | | |
| Churn prevention triggers | ⬜ | | |
| Analytics: signup → purchase | ⬜ | | |

### Gate 2: Cloud Reliability ✅
| Task | Status | Verified By | Date |
|------|--------|-------------|------|
| Rate limiting active | ✅ | Claude | Jan 2, 2026 |
| Circuit breakers configured | ✅ | Claude | Jan 2, 2026 |
| DB pooled connections | ⬜ | | |
| DB indexes verified | ⬜ | | |
| Cron idempotency verified | ⬜ | | |
| Monitoring dashboards live | ✅ | Claude | Jan 2, 2026 |
| Alerts configured | ⬜ | | |

### Gate 3: Security ✅
| Task | Status | Verified By | Date |
|------|--------|-------------|------|
| RLS on all tables | ⬜ | | |
| RBAC on admin APIs | ⬜ | | |
| Webhook validation | ⬜ | | |
| No secrets in client bundles | ⬜ | | |
| OWASP scan passed | ⬜ | | |

### Gate 4: Rollback Readiness ✅
| Task | Status | Verified By | Date |
|------|--------|-------------|------|
| Feature flags working | ✅ | Claude | Jan 2, 2026 |
| Incident mode tested | ⬜ | | |
| Rollback procedure documented | ✅ | Claude | Jan 2, 2026 |
| Kill switches verified | ✅ | Claude | Jan 2, 2026 |

---

## 🚀 LAUNCH DAY TIMELINE

### T-24 Hours (Day Before)
- [ ] Final staging verification
- [ ] Team notification sent
- [ ] Support channels ready
- [ ] Status page prepared

### T-4 Hours
- [ ] Clear all test data
- [ ] Verify production environment variables
- [ ] Final smoke tests
- [ ] Monitoring dashboards open

### T-1 Hour
- [ ] Team standup call
- [ ] Confirm on-call assignments
- [ ] Pre-warm all endpoints: `GET /api/cron/warmup`
- [ ] Verify all cron jobs active

### T-0 (Launch)
- [ ] Remove maintenance mode (if any)
- [ ] Enable marketing emails
- [ ] Monitor dashboards for 15 minutes
- [ ] First user signup verification

### T+1 Hour
- [ ] Review initial metrics
- [ ] Check error rates
- [ ] Verify first emails sent
- [ ] Team check-in

### T+24 Hours
- [ ] Daily metrics review
- [ ] User feedback collection
- [ ] Bug triage
- [ ] Post-launch retrospective

---

## 🔧 ROLLBACK PROCEDURE

### Severity Levels:
| Level | Description | Action |
|-------|-------------|--------|
| P0 | Complete outage | Immediate rollback |
| P1 | Revenue impacted | Rollback within 15 min |
| P2 | Major feature broken | Hotfix or rollback within 1 hour |
| P3 | Minor issue | Monitor and fix in next deploy |

### Rollback Steps:

#### Option A: Feature Flag Disable
```bash
# Disable specific feature
curl -X POST https://craudiovizai.com/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"flag": "email_automation", "enabled": false}'
```

#### Option B: Incident Mode (Master Kill Switch)
```bash
# Enable incident mode - disables all non-critical operations
curl -X POST https://craudiovizai.com/api/admin/incident-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

#### Option C: Vercel Deployment Rollback
```bash
# Rollback to previous deployment
# Go to: https://vercel.com/roy-hendersons-projects-1d3d5e94/crav-website/deployments
# Click on last known good deployment → Promote to Production
```

#### Option D: Database Rollback
```sql
-- Only if data corruption suspected
-- Contact: royhenderson@craudiovizai.com
-- Requires: Supabase dashboard access
```

---

## 📊 MONITORING URLS

| Dashboard | URL |
|-----------|-----|
| Observability | https://craudiovizai.com/admin/observability |
| Vercel Logs | https://vercel.com/roy-hendersons-projects-1d3d5e94/crav-website |
| Supabase | https://supabase.com/dashboard/project/gfberqarqcqwzjvqjxfk |
| Stripe | https://dashboard.stripe.com |
| PayPal | https://www.paypal.com/merchantapps/home |

---

## 🚨 ALERT THRESHOLDS

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Error Rate | >2% | >5% | Check logs, consider rollback |
| Latency (p99) | >2000ms | >5000ms | Scale or optimize |
| Email Backlog | >100 | >500 | Check Resend, restart cron |
| DB Connections | >70% | >90% | Scale DB or optimize queries |
| Failed Payments | >5 | >20 | Check Stripe, notify support |

---

## 📧 CONTACT ESCALATION

| Role | Contact | Phone |
|------|---------|-------|
| CEO | Roy Henderson | royhenderson@craudiovizai.com |
| CMO | Cindy Henderson | cindy@craudiovizai.com |
| Vercel Support | support@vercel.com | - |
| Supabase Support | support@supabase.io | - |
| Stripe Support | support@stripe.com | - |

---

## ✅ POST-LAUNCH CHECKLIST

### Day 1:
- [ ] All signup flows working
- [ ] First paying customer acquired
- [ ] Email sequences firing correctly
- [ ] No P0/P1 incidents

### Week 1:
- [ ] Conversion rate tracking
- [ ] User feedback collected
- [ ] Bug backlog triaged
- [ ] Performance baseline established

### Month 1:
- [ ] MRR tracking
- [ ] Churn rate analysis
- [ ] Feature usage analytics
- [ ] Infrastructure cost review

---

*"Never settle. Build systems that build systems."*  
*— The Henderson Standard*
