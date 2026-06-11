# Upkept — home maintenance on autopilot (SaaS with Stripe + Firebase)

**The problem:** ~65% of homeowners defer routine maintenance, and every $1
of skipped prevention turns into roughly $4 of repairs. Nobody remembers to
flush the water heater or clean the dryer vent — until the bill arrives.
Upkept turns it all into a simple recurring schedule with due-date
countdowns and a single "home health" score.

**The market angle:** high interest (every homeowner has this problem and
knows it), low saturation (no dominant consumer brand), and existing
competitors are underdeveloped — HomeZada is bloated and dated, Oply/Dwellin
are thin, and UpKeep pivoted to enterprise CMMS.

Built with **Next.js (App Router)**, **Firebase** (Auth + Firestore), and
**Stripe** (subscriptions).

## What's included

- **Animated landing page** and **pricing page** with Free / Pro tiers
- **Auth**: email + password and Google sign-in via Firebase Auth
- **The product**:
  - Recurring maintenance tasks (monthly / quarterly / 6-month / yearly)
    with live due-date countdowns, overdue flags, and one-tap **✓ Done**
    that automatically reschedules the next occurrence
  - **One-click presets** for the tasks everyone forgets (HVAC filter,
    gutters, sump pump, dryer vent…), each with the right cadence built in
  - **Home health score** — % of tasks not overdue, animated count-up
- **Monetization**:
  - Free plan capped at 7 tasks; a full home needs 20+ → Pro ($7/mo) is
    unlimited
  - Stripe Checkout for subscribing, Customer Portal for managing/cancelling
  - Stripe webhook keeps each user's plan in sync in Firestore (UI flips to
    Pro in real time after payment)
- **Animations**: entrance/stagger animations, hover lifts, animated gradient
  text, floating hero cards, count-up stats — all CSS/rAF, no extra deps,
  with `prefers-reduced-motion` respected
- **Security**: API routes verify Firebase ID tokens; Firestore rules
  restrict every user to their own data; billing fields are server-write-only

## Project structure

```
app/
  page.tsx                    # Animated landing page
  pricing/page.tsx            # Pricing + upgrade CTA
  login/ signup/              # Auth pages
  dashboard/page.tsx          # The product: health score, presets, schedule
  account/page.tsx            # Profile + billing portal
  api/checkout/route.ts       # Creates Stripe Checkout session
  api/portal/route.ts         # Creates Stripe Customer Portal session
  api/webhooks/stripe/route.ts# Syncs subscription state → Firestore
components/                   # AuthProvider, Navbar, AuthForm, UpgradeButton, useCountUp
lib/
  maintenance.ts              # Categories, frequencies, presets, scheduling
  firebase/client.ts          # Browser SDK (baked public config + overrides)
  firebase/admin.ts           # Admin SDK + ID-token verification
  stripe.ts                   # Stripe server client
  plans.ts                    # Plan definitions & limits
firestore.rules               # Firestore security rules
```

## Setup

The production Firebase web config is baked in (it's public by design), so
the app deploys with **zero env vars**. Two console steps are required:

1. **Firebase → Authentication → Settings → Authorized domains**: add your
   deployed domain (e.g. `mythos-test.vercel.app`).
2. **Firebase → Firestore Database**: create the database, then paste
   `firestore.rules` into the Rules tab and publish.

### Enabling Stripe billing (later)

1. Stripe dashboard → **Products** → add "Upkept Pro" with a recurring
   $7/month price → copy the `price_...` ID.
2. **Developers → Webhooks** → add endpoint
   `https://your-domain.com/api/webhooks/stripe` with events
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`.
3. Firebase → Project settings → **Service accounts** → generate a private
   key.
4. Set these in Vercel (Settings → Environment Variables, then redeploy):
   `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

Until those are set, the app runs fine and the upgrade button shows
"Payments aren't enabled yet".

### Local development

```bash
npm install
npm run dev
```

Test the payment flow with Stripe's test card `4242 4242 4242 4242` and
`stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## How billing sync works

1. The client calls `POST /api/checkout` with a Firebase ID token.
2. The server verifies the token, finds/creates a Stripe customer
   (tagged with the user's `firebaseUid`), and returns a Checkout URL.
3. After payment, Stripe calls the webhook; the handler maps the customer
   back to the Firebase user and writes `plan: "pro"` to `users/{uid}`.
4. The client listens to `users/{uid}` in real time, so the UI flips to
   Pro within a second of payment. Cancellations flow back the same way.
