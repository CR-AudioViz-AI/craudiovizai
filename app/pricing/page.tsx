// app/pricing/page.tsx
// Production pricing page — 3-tier plans with Stripe checkout.
// Dark industrial theme. Client component for fetch + redirect.
// Thursday, March 19, 2026
"use client"

import { useState } from "react"

const PLANS = [
  {
    id:          "starter",
    name:        "STARTER",
    price:       "$9.99",
    period:      "/month",
    credits:     "150",
    description: "Get started with AI creation",
    features:    ["150 credits / month", "Javari Chat", "Javari Forge", "Basic access"],
    priceId:     "price_1SdaKx7YeQ1dZTUvCeaYqKXh",
    popular:     false,
    accent:      "#6366f1",
  },
  {
    id:          "pro",
    name:        "PRO",
    price:       "$29.99",
    period:      "/month",
    credits:     "500",
    description: "For serious creators and builders",
    features:    ["500 credits / month", "Javari Chat + Team", "Javari Forge", "Full access", "Priority queue"],
    priceId:     "price_1Sk8AZ7YeQ1dZTUvwpubHpWW",
    popular:     true,
    accent:      "#f59e0b",
  },
  {
    id:          "premium",
    name:        "PREMIUM",
    price:       "$99.99",
    period:      "/month",
    credits:     "∞",
    description: "Unlimited power for the dedicated",
    features:    ["Unlimited credits", "All Javari features", "Full system access", "Priority support", "Early access"],
    priceId:     "price_premium_monthly",
    popular:     false,
    accent:      "#10b981",
  },
]

const CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap");
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .pr{min-height:100vh;background:#080810;color:#e8e8f0;font-family:"Syne",sans-serif;padding:80px 24px;position:relative;overflow:hidden}
  .pr::before{content:"";position:fixed;top:-40%;left:50%;transform:translateX(-50%);width:800px;height:800px;background:radial-gradient(ellipse,rgba(99,102,241,.12) 0%,transparent 70%);pointer-events:none}
  .pr::after{content:"";position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:60px 60px;pointer-events:none}
  .hdr{text-align:center;margin-bottom:72px;position:relative;z-index:1}
  .ey{font-family:"Space Mono",monospace;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#6366f1;margin-bottom:16px}
  .ttl{font-size:clamp(36px,6vw,64px);font-weight:800;letter-spacing:-.03em;line-height:1;color:#fff;margin-bottom:16px}
  .ttl span{background:linear-gradient(135deg,#6366f1,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .sub{font-size:17px;color:#6b6b80;max-width:440px;margin:0 auto;line-height:1.6}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1020px;margin:0 auto;position:relative;z-index:1}
  .card{background:#0e0e1a;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:36px 28px;display:flex;flex-direction:column;gap:24px;transition:border-color .2s,transform .2s;position:relative;overflow:hidden}
  .card:hover{transform:translateY(-4px)}
  .pop{border-color:rgba(245,158,11,.4)!important;background:#0f0f1c!important}
  .card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:var(--acc);opacity:.7}
  .badge{position:absolute;top:16px;right:16px;font-family:"Space Mono",monospace;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#f59e0b;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);border-radius:4px;padding:4px 8px}
  .pname{font-family:"Space Mono",monospace;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--acc)}
  .pr-row{display:flex;align-items:baseline;gap:4px}
  .price{font-size:48px;font-weight:800;letter-spacing:-.04em;color:#fff;line-height:1}
  .per{font-size:14px;color:#4a4a60;font-family:"Space Mono",monospace}
  .ctag{display:inline-flex;align-items:center;gap:6px;font-family:"Space Mono",monospace;font-size:13px;color:var(--acc);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:6px;padding:6px 12px;width:fit-content}
  .cnum{font-size:18px;font-weight:700}
  .feats{list-style:none;display:flex;flex-direction:column;gap:10px;flex:1}
  .feats li{display:flex;align-items:center;gap:10px;font-size:14px;color:#9494a8;line-height:1.4}
  .feats li::before{content:"--";color:var(--acc);font-family:"Space Mono",monospace;flex-shrink:0}
  .btn{width:100%;padding:15px 0;border-radius:10px;font-family:"Space Mono",monospace;font-size:13px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;cursor:pointer;border:none;transition:opacity .15s,transform .15s;background:var(--acc);color:#080810}
  .btn:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
  .btn:disabled{opacity:.5;cursor:not-allowed}
  .btn.out{background:transparent;color:var(--acc);border:1px solid var(--acc)}
  .btn.out:hover:not(:disabled){background:rgba(255,255,255,.04)}
  .ftn{text-align:center;margin-top:48px;font-family:"Space Mono",monospace;font-size:11px;color:#3a3a50;letter-spacing:.08em;position:relative;z-index:1}
  @media(max-width:640px){.pr{padding:48px 16px}.grid{grid-template-columns:1fr;max-width:400px}}
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
      <div className="pr">
        <div className="hdr">
          <div className="ey">CR AudioViz AI</div>
          <h1 className="ttl">Choose Your <span>Plan</span></h1>
          <p className="sub">Power your AI with credits. Upgrade anytime.</p>
        </div>
        <div className="grid">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={"card" + (plan.popular ? " pop" : "")}
              style={{ "--acc": plan.accent } as React.CSSProperties}
            >
              {plan.popular && <div className="badge">Most Popular</div>}
              <div className="pname">{plan.name}</div>
              <div className="pr-row">
                <div className="price">{plan.price}</div>
                <div className="per">{plan.period}</div>
              </div>
              <div className="ctag">
                <span className="cnum">{plan.credits}</span>
                <span>credits / mo</span>
              </div>
              <ul className="feats">
                {plan.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <button
                className={"btn" + (plan.popular ? "" : " out")}
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? "Redirecting..." : "Get " + plan.name}
              </button>
            </div>
          ))}
        </div>
        <div className="ftn">
          Secure checkout via Stripe &middot; Cancel anytime &middot; Credits never expire on paid plans
        </div>
      </div>
    </>
  )
}
