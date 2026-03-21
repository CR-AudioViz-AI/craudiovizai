// app/pricing/page.tsx
// Production pricing page — CR AudioViz AI
// Clean enterprise SaaS design. Stripe checkout integration.
// Friday, March 20, 2026
"use client"

import { useState } from "react"

const PLANS = [
  {
    id:          "starter",
    name:        "Starter",
    price:       "$9.99",
    period:      "/ month",
    credits:     "150 credits",
    description: "Get started with AI-powered creation",
    features: [
      "150 credits per month",
      "Javari Chat",
      "Javari Forge",
      "Basic platform access",
    ],
    priceId:     "price_1SdaKx7YeQ1dZTUvCeaYqKXh",
    cta:         "Get Starter",
    popular:     false,
    accentColor: "#14B8A6",
  },
  {
    id:          "pro",
    name:        "Pro",
    price:       "$29.99",
    period:      "/ month",
    credits:     "500 credits",
    description: "For serious creators and builders",
    features: [
      "500 credits per month",
      "Javari Chat + Team",
      "Javari Forge",
      "Full platform access",
      "Priority queue",
    ],
    priceId:     "price_1Sk8AZ7YeQ1dZTUvwpubHpWW",
    cta:         "Get Pro",
    popular:     true,
    accentColor: "#6366f1",
  },
  {
    id:          "premium",
    name:        "Premium",
    price:       "$99.99",
    period:      "/ month",
    credits:     "Enterprise credit allocation",
    description: "Maximum power for the dedicated",
    features: [
      "Custom high-volume credits",
      "All Javari features",
      "Full system access",
      "Priority support",
      "Early feature access",
    ],
    priceId:     "price_1SdaLG7YeQ1dZTUvCzgdjaTp",
    cta:         "Get Premium",
    popular:     false,
    accentColor: "#f59e0b",
  },
]

const CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pg {
    min-height: 100vh;
    background: #fafafa;
    color: #111;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 80px 24px 100px;
  }

  /* ── Header ─────────────────────────────────────── */
  .hdr {
    text-align: center;
    margin-bottom: 64px;
  }
  .eyebrow {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 14px;
  }
  .title {
    font-size: clamp(28px, 5vw, 44px);
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #0a0a0a;
    margin-bottom: 12px;
    line-height: 1.15;
  }
  .subtitle {
    font-size: 16px;
    color: #666;
    max-width: 380px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* ── Grid ────────────────────────────────────────── */
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    max-width: 980px;
    margin: 0 auto;
    align-items: start;
  }

  /* ── Card ────────────────────────────────────────── */
  .card {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: 14px;
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    gap: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s, border-color 0.2s;
    position: relative;
  }
  .card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
  .card.popular {
    border-color: #6366f1;
    box-shadow: 0 4px 24px rgba(99,102,241,0.12);
  }

  /* Popular badge */
  .popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #6366f1;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 20px;
    white-space: nowrap;
  }

  /* Plan label */
  .plan-name {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 20px;
  }

  /* Price row — critical: no wrapping */
  .price-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    white-space: nowrap;
    flex-wrap: nowrap;
    margin-bottom: 6px;
  }
  .price-amount {
    font-size: 44px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: #0a0a0a;
    line-height: 1;
    flex-shrink: 0;
  }
  .price-period {
    font-size: 15px;
    color: #9ca3af;
    font-weight: 500;
    flex-shrink: 0;
  }

  /* Description */
  .plan-desc {
    font-size: 13px;
    color: #9ca3af;
    margin-bottom: 24px;
    line-height: 1.5;
  }

  /* Credits badge */
  .credits-badge {
    display: inline-flex;
    align-items: center;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    padding: 6px 12px;
    margin-bottom: 28px;
    border: 1px solid #e5e7eb;
    width: fit-content;
  }
  .credits-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    margin-right: 8px;
    flex-shrink: 0;
  }

  /* Features */
  .features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
    flex: 1;
  }
  .features li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #4b5563;
    line-height: 1.4;
  }
  .check {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    opacity: 0.85;
  }
  .check::after {
    content: "";
    width: 5px;
    height: 3px;
    border-left: 1.5px solid #fff;
    border-bottom: 1.5px solid #fff;
    transform: rotate(-45deg) translateY(-1px);
    display: block;
  }

  /* CTA button */
  .cta-btn {
    width: 100%;
    padding: 14px 0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    border: 1.5px solid var(--accent);
    transition: background 0.15s, color 0.15s, opacity 0.15s;
    background: transparent;
    color: var(--accent);
    margin-top: auto;
  }
  .cta-btn.filled {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
  .cta-btn:hover:not(:disabled) {
    opacity: 0.85;
  }
  .cta-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Footer note */
  .footer-note {
    text-align: center;
    margin-top: 52px;
    font-size: 13px;
    color: #9ca3af;
    letter-spacing: 0.01em;
  }
  .footer-note span {
    margin: 0 8px;
    color: #d1d5db;
  }

  /* Responsive */
  @media (max-width: 820px) {
    .grid {
      grid-template-columns: 1fr;
      max-width: 420px;
    }
    .card {
      padding: 32px 28px;
    }
  }
`

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(plan: typeof PLANS[0]) {
    setLoading(plan.id)
    try {
      const res = await fetch("https://craudiovizai.com/api/billing/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          priceId: plan.priceId,
          userId:  "roy_test_user",
          email:   "royhenderson@craudiovizai.com",
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Checkout failed: " + (data.error ?? "Unknown error"))
        setLoading(null)
      }
    } catch {
      alert("Checkout failed. Please try again.")
      setLoading(null)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pg">

        {/* Header */}
        <div className="hdr">
          <div className="eyebrow">CR AudioViz AI</div>
          <h1 className="title">Simple, transparent pricing</h1>
          <p className="subtitle">Power your creative workflow. Upgrade or cancel anytime.</p>
        </div>

        {/* Cards */}
        <div className="grid">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`card${plan.popular ? " popular" : ""}`}
              style={{ "--accent": plan.accentColor } as React.CSSProperties}
            >
              {plan.popular && (
                <div className="popular-badge">Most Popular</div>
              )}

              {/* Plan name */}
              <div className="plan-name">{plan.name}</div>

              {/* Price — explicit nowrap prevents wrapping */}
              <div className="price-row">
                <div className="price-amount">{plan.price}</div>
                <div className="price-period">{plan.period}</div>
              </div>

              {/* Description */}
              <div className="plan-desc">{plan.description}</div>

              {/* Credits badge */}
              <div className="credits-badge">
                <div className="credits-dot" />
                {plan.credits}
              </div>

              {/* Features */}
              <ul className="features">
                {plan.features.map(f => (
                  <li key={f}>
                    <span className="check" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`cta-btn${plan.popular ? " filled" : ""}`}
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? "Redirecting…" : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="footer-note">
          Secure checkout via Stripe
          <span>·</span>
          Cancel anytime
          <span>·</span>
          Credits never expire on paid plans
        </div>

      </div>
    </>
  )
}
