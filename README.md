# Paydar — payment radar for creator brand deals (SaaS with Stripe + Firebase)

**The problem (researched, not guessed):**

- **87% of creators** have been paid late, paid the wrong amount, or not
  paid at all, and **40%** call chasing payments one of the hardest parts
  of the job (Business Insider survey, via
  [Lumanu](https://www.lumanu.com/blog/from-promises-to-non-payments-influencers-turning-to-legal-action)).
- Net-90 payment terms are becoming the industry norm, and once an invoice
  is submitted creators have **zero visibility** into payment status.
- Brand deals are ~**70% of creator income** (Goldman Sachs), in an
  influencer-marketing market worth **$32.5B in 2025** (+35% YoY).
- Today creators manage this in spreadsheets — they literally **buy tracker
  templates on Etsy**. Competing apps are thin or brand-new (STACX, Nythor,
  Notion templates); marketplaces like Collabstr only track deals made
  through them.

**The product:** track every brand deal through a pipeline
(pitched → negotiating → signed → delivered → invoiced → paid). The moment
a deal is invoiced, Paydar starts the clock on its payment terms and flags
the exact day a brand goes late — and by how much.

Built with **Next.js (App Router)**, **Firebase** (Auth + Firestore), and
**Stripe** (subscriptions).

## What's included

- **Animated landing page** and **pricing page** with Free / Pro tiers
- **Auth**: email + password and Google sign-in via Firebase Auth
- **The product**:
  - Deal pipeline with one-click stage advancement; marking a deal
    *invoiced* stamps the invoice date automatically
  - **Payment radar**: expected pay date = invoice date + payment terms
    (net 15/30/45/60/90); overdue payments turn red with a days-late
    counter and sort to the top
  - Money summary with animated count-ups: pipeline value, awaiting
    payment, and overdue total
  - Content-deadline countdowns for deals that aren't delivered yet
- **Monetization**:
  - Free plan: 3 active deals (paid history doesn't count against it);
    Pro ($9/mo): unlimited
  - Stripe Checkout, Customer Portal, and a webhook that syncs plan state
    to Firestore in real time
- **Animations**: entrance/stagger animations, hover lifts, animated
  gradient text, floating hero cards, count-up stats — all CSS/rAF,
  `prefers-reduced-motion` respected
- **Security**: API routes verify Firebase ID tokens; Firestore rules
  restrict every user to their own data; billing fields are
  server-write-only

## Project structure

```
app/
  page.tsx                    # Animated landing page
  pricing/page.tsx            # Pricing + upgrade CTA
  login/ signup/              # Auth pages
  dashboard/page.tsx          # The product: pipeline + payment radar
  account/page.tsx            # Profile + billing portal
  api/checkout/route.ts       # Creates Stripe Checkout session
  api/portal/route.ts         # Creates Stripe Customer Portal session
  api/webhooks/stripe/route.ts# Syncs subscription state → Firestore
components/                   # AuthProvider, Navbar, AuthForm, UpgradeButton, useCountUp
lib/
  deals.ts                    # Pipeline stages, payment terms, date math
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

1. Stripe dashboard → **Products** → add "Paydar Pro" with a recurring
   $9/month price → copy the `price_...` ID.
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
