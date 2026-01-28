# CRAIverse API Documentation

## Base URL
```
https://craudiovizai.com/api
```

## Authentication

All authenticated endpoints require a Bearer token:
```
Authorization: Bearer <your_api_key>
```

Get your API key from: https://craudiovizai.com/dashboard/api-keys

---

## Credits API

### Get Credit Balance
```http
GET /credits/balance?user_id={user_id}
```

**Response:**
```json
{
  "user_id": "uuid",
  "balance": 850,
  "lifetime_earned": 1000,
  "lifetime_spent": 150
}
```

### Add Credits
```http
POST /credits/add
Content-Type: application/json

{
  "user_id": "uuid",
  "amount": 100,
  "source": "purchase",
  "source_reference": "ch_xxx"
}
```

### Deduct Credits
```http
POST /credits/deduct
Content-Type: application/json

{
  "user_id": "uuid",
  "amount": 5,
  "source_app": "market-oracle",
  "source_action": "ai_prediction"
}
```

---

## User API

### Get User Profile
```http
GET /user/profile?user_id={user_id}
```

### Update Profile
```http
PATCH /user/profile
Content-Type: application/json

{
  "user_id": "uuid",
  "display_name": "John Doe",
  "avatar_url": "https://..."
}
```

---

## Customer Portal API

### Get Dashboard Data
```http
GET /customer/dashboard?user_id={user_id}
```

**Response:**
```json
{
  "user": { "display_name": "...", "plan": "pro" },
  "credits": { "balance": 850 },
  "subscription": { "status": "active", "current_period_end": "..." },
  "recent_activity": [...],
  "stats": { "apps_used": 5, "credits_used_this_month": 150 }
}
```

---

## Billing API

### Create Checkout Session
```http
POST /billing/create-checkout
Content-Type: application/json

{
  "user_id": "uuid",
  "price_id": "price_xxx",
  "success_url": "https://...",
  "cancel_url": "https://..."
}
```

### Get Billing Portal URL
```http
POST /billing/portal
Content-Type: application/json

{
  "user_id": "uuid",
  "return_url": "https://..."
}
```

---

## Javari AI API

### Send Message
```http
POST /javari/chat
Content-Type: application/json

{
  "message": "How do credits work?",
  "conversation_id": "uuid (optional)",
  "user_id": "uuid (optional)",
  "context": {
    "source_app": "widget",
    "source_url": "https://..."
  }
}
```

**Response:**
```json
{
  "response": "Credits are the currency...",
  "conversation_id": "uuid",
  "should_create_ticket": false,
  "provider": "anthropic"
}
```

### Search Knowledge Base
```http
GET /javari/knowledge?q={query}&category={category}&limit={limit}
```

---

## Support Tickets API

### Create Ticket
```http
POST /customer/tickets
Content-Type: application/json

{
  "user_id": "uuid",
  "subject": "Issue with payment",
  "description": "...",
  "priority": "high",
  "category": "billing"
}
```

### Get User Tickets
```http
GET /customer/tickets?user_id={user_id}
```

---

## Marketplace API

### Process Transaction
```http
POST /marketplace/transaction
Content-Type: application/json

{
  "seller_id": "uuid",
  "buyer_id": "uuid",
  "amount_cents": 5000,
  "platform": "barrelverse",
  "item_id": "uuid",
  "item_name": "Buffalo Trace",
  "item_type": "bourbon"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "gross_amount": 50.00,
  "commission": 5.00,
  "seller_receives": 45.00,
  "transfer_id": "tr_xxx"
}
```

---

## Affiliate API

### Track Click
```http
POST /affiliate/track
Content-Type: application/json

{
  "affiliate_network": "disney",
  "deal_id": "deal_123",
  "deal_name": "4-Day Park Hopper",
  "session_id": "sess_xxx"
}
```

### Get Stats
```http
GET /affiliate/track?range=30d
```

**Response:**
```json
{
  "range": "30d",
  "summary": {
    "total_clicks": 1500,
    "total_conversions": 45,
    "conversion_rate": "3.00",
    "total_commission": 1250.00
  },
  "by_network": {
    "disney": { "clicks": 500, "conversions": 15, "commission": 450 }
  }
}
```

---

## Email API

### Send Transactional Email
```http
POST /email/send
Content-Type: application/json

{
  "template": "welcome",
  "user_id": "uuid",
  "data": {
    "name": "John"
  }
}
```

**Available Templates:**
- `welcome` - New user onboarding
- `subscription_confirmed` - Payment success
- `payment_failed` - Payment issue
- `low_credits` - Credit warning
- `renewal_reminder` - Subscription renewal
- `ticket_created` - Support ticket confirmation

---

## Webhooks

### Stripe Webhooks
```
POST /webhooks/stripe
```

### PayPal Webhooks
```
POST /webhooks/paypal
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limits

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Read operations | 1000/hour |
| Write operations | 100/hour |
| AI operations | 60/hour |

---

## SDKs (Coming Soon)

- JavaScript/TypeScript
- Python
- Go

---

*Last Updated: December 27, 2025*

