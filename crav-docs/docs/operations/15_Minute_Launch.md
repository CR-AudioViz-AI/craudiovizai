# ⚡ 15-MINUTE LAUNCH CHECKLIST
## Everything You Need to Go Live

**Created:** January 1, 2026 - 9:04 PM EST  
**For:** Roy Henderson, CEO  
**Goal:** Revenue-ready in 15 minutes

---

## STEP 1: Verify Email API Key (3 minutes)

### Open Vercel Dashboard
1. Go to: https://vercel.com/roy-hendersons-projects-1d3d5e94/crav-website/settings/environment-variables
2. Find: `RESEND_API_KEY`
3. Verify: Starts with `re_` and is valid

### If Missing or Invalid:
1. Go to: https://resend.com/api-keys
2. Create new key (name: "CR AudioViz Production")
3. Copy key
4. Paste in Vercel environment variables
5. Save

**✅ Checkpoint:** RESEND_API_KEY shows valid key

---

## STEP 2: Verify Stripe Keys (3 minutes)

### Check Production Mode
1. Go to: https://dashboard.stripe.com
2. Confirm: Toggle shows "Live" (not "Test")
3. Go to: Developers → API keys

### Verify in Vercel:
| Variable | Should Start With |
|----------|-------------------|
| STRIPE_SECRET_KEY | `sk_live_` |
| STRIPE_PUBLISHABLE_KEY | `pk_live_` |
| STRIPE_WEBHOOK_SECRET | `whsec_` |

### If Keys Show `sk_test_`:
- You're still in test mode
- Switch Stripe to Live mode
- Update keys in Vercel

**✅ Checkpoint:** All Stripe keys are LIVE (not test)

---

## STEP 3: Test Checkout Flow (5 minutes)

### Quick Test
1. Open: https://craudiovizai.com/pricing
2. Click: "Get Started" on Starter plan ($19)
3. Enter test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify: Confirmation page appears

### Check Stripe Dashboard
1. Go to: https://dashboard.stripe.com/payments
2. Verify: Payment appears
3. Confirm: Status is "Succeeded"

### Check Email
1. Check: royhenderson@craudiovizai.com
2. Verify: Welcome email received

**✅ Checkpoint:** Payment processed, email received

---

## STEP 4: Quick Smoke Test (2 minutes)

### Test These Pages Load:
| URL | Expected |
|-----|----------|
| craudiovizai.com | Homepage loads |
| craudiovizai.com/pricing | Pricing shows |
| craudiovizai.com/apps/javari-books | App loads |
| craudiovizai.com/api/health | "healthy": true |

**✅ Checkpoint:** All pages load without errors

---

## STEP 5: Flip the Switch (2 minutes)

### You're Live! Now:
1. **Tweet:** Use content from SOCIAL_MEDIA_POSTS.md
2. **LinkedIn:** Post company announcement
3. **Email list:** Send launch email

### Optional Same Day:
- Post in relevant communities
- Tell friends and family
- Monitor for issues

---

## 🚨 IF SOMETHING BREAKS

### Payment Fails
1. Check Stripe dashboard for error
2. Verify webhook is receiving events
3. Check Vercel logs: https://vercel.com/roy-hendersons-projects-1d3d5e94/crav-website/logs

### Email Doesn't Send
1. Check Resend dashboard: https://resend.com/emails
2. Verify domain is verified
3. Check API key is correct

### Page Won't Load
1. Check Vercel deployment status
2. Look for build errors
3. Redeploy if needed

### Emergency Contact
- Stripe Support: https://support.stripe.com
- Resend Support: https://resend.com/support
- Vercel Support: https://vercel.com/support

---

## 📊 POST-LAUNCH MONITORING (First 24 Hours)

### Check Every Hour:
- [ ] Stripe dashboard for new payments
- [ ] Vercel analytics for traffic
- [ ] Email for support requests

### Check Every 4 Hours:
- [ ] Social media for mentions
- [ ] Site health (load key pages)
- [ ] Error logs in Vercel

### End of Day:
- [ ] Total signups
- [ ] Total revenue
- [ ] Any critical issues?

---

## 🎉 SUCCESS METRICS (Day 1)

| Metric | Good | Great | Amazing |
|--------|------|-------|---------|
| Signups | 10 | 50 | 100+ |
| Paid | 1 | 5 | 10+ |
| Revenue | $19 | $100 | $500+ |
| Issues | <5 | 0 | 0 |

---

## QUICK REFERENCE

### Key URLs
- **Site:** https://craudiovizai.com
- **Stripe:** https://dashboard.stripe.com
- **Vercel:** https://vercel.com/roy-hendersons-projects-1d3d5e94
- **Resend:** https://resend.com
- **Supabase:** https://supabase.com/dashboard

### Key Files (in GitHub)
- `/marketing/SOCIAL_MEDIA_POSTS.md`
- `/marketing/LAUNCH_EMAIL.md`
- `/marketing/PRESS_RELEASE.md`
- `/PHASE4_LAUNCH_CHECKLIST.md`

---

**Total Time:** 15 minutes  
**Result:** LIVE and accepting payments

---

*"The best time to launch was yesterday. The second best time is in 15 minutes."*
