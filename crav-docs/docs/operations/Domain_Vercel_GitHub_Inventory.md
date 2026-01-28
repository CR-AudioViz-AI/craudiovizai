# Domain, Vercel & GitHub Inventory

**Last Updated:** January 7, 2026  
**Owner:** CR AudioViz AI, LLC  
**Verified By:** Automated deployment pipeline

---

## Infrastructure Summary

| Component | Identifier |
|-----------|------------|
| **GitHub Repo** | CR-AudioViz-AI/javariverse-hub |
| **Vercel Project** | javariverse-hub |
| **Vercel Project ID** | prj_fmk3PLscIPrcAseKwhjCMBglH8C4 |
| **Vercel Team ID** | team_Z0yef7NlFu1coCJWz8UmUdI5 |
| **Default Branch** | main |
| **Framework** | Next.js |

---

## Domain Inventory (14 Total)

### Primary Domains

| Domain | Type | Status |
|--------|------|--------|
| craudiovizai.com | Production | ✅ Active |
| www.craudiovizai.com | Redirect | ✅ Active |
| javariverse.com | Production | ✅ Active |
| www.javariverse.com | Redirect | ✅ Active |

### CRAIverse Domains

| Domain | Type | Status |
|--------|------|--------|
| craiverse.com | Production | ✅ Active |
| www.craiverse.com | Redirect | ✅ Active |
| craiverse.net | Production | ✅ Active |
| www.craiverse.net | Redirect | ✅ Active |
| craiverse.org | Production | ✅ Active |
| www.craiverse.org | Redirect | ✅ Active |

### Vercel System Domains

| Domain | Type | Purpose |
|--------|------|---------|
| javariverse-hub.vercel.app | System | Default Vercel URL |
| craudiovizai-website.vercel.app | System | Legacy alias |
| javariverse-hub-git-main-*.vercel.app | Preview | Branch previews |
| javariverse-hub-*-*.vercel.app | Preview | PR previews |

---

## DNS Configuration

All domains use Vercel DNS with automatic SSL.

### Required DNS Records (per domain)

```
Type  Name  Value
A     @     76.76.21.21
AAAA  @     2606:4700:7::1
CNAME www   cname.vercel-dns.com
```

---

## Deployment Flow

```
Push to main
    ↓
GitHub Actions (E2E Tests)
    ↓ (parallel)
Vercel Build Triggered
    ↓
Build & Deploy
    ↓
All 14 domains updated
    ↓
E2E tests validate production
```

---

## Access & Permissions

### GitHub Repository

| Role | Access |
|------|--------|
| Owner | CR-AudioViz-AI org |
| Workflows | Read contents, Write issues |

### Vercel Project

| Role | Access |
|------|--------|
| Team | team_Z0yef7NlFu1coCJWz8UmUdI5 |
| Production | Protected (main branch only) |

---

## Verification Commands

### Vercel CLI

```bash
# List project domains
vercel domains ls --project javariverse-hub

# Check deployment status
vercel ls javariverse-hub
```

### API Verification

```bash
# Get project info
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/javariverse-hub?teamId=team_Z0yef7NlFu1coCJWz8UmUdI5"
```

---

## Related Documentation

- [E2E_BASELINE.md](./E2E_BASELINE.md) - Test coverage and baseline
- [CI_GUARDRAILS.md](./CI_GUARDRAILS.md) - CI/CD operational procedures
- [ROADMAP.md](./ROADMAP.md) - Project roadmap and phases
