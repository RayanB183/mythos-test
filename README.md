# Renewly — subscription-spend tracker (SaaS starter with Stripe + Firebase)

**The problem:** the average household holds 12+ subscriptions and wastes
~$133/month on services they forgot they were paying for. Renewly puts every
recurring charge in one dashboard, shows your true monthly/yearly spend, and
counts down to each renewal so you can cancel *before* you're billed.

Built with **Next.js (App Router)**, **Firebase** (Auth + Firestore), and
**Stripe** (subscriptions).

## What's included

- **Animated landing page** and **pricing page** with Free / Pro tiers
- **Auth**: email + password and Google sign-in via Firebase Auth
- **Database**: real-time subscription list per user in Firestore
- **The product**: monthly/yearly spend totals with count-up animations,
  renewal countdowns, and warnings for anything renewing within 7 days
- **Monetization**:
  - Free plan capped at 5 tracked subscriptions; Pro ($5/mo) is unlimited
  - Stripe Checkout for subscribing
  - Stripe Customer Portal for managing/cancelling
  - Stripe webhook keeps each user's plan in sync in Firestore
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
  dashboard/page.tsx          # The product: spend stats + renewal tracking
  account/page.tsx            # Profile + billing portal
  api/checkout/route.ts       # Creates Stripe Checkout session
  api/portal/route.ts         # Creates Stripe Customer Portal session
  api/webhooks/stripe/route.ts# Syncs subscription state → Firestore
components/                   # AuthProvider, Navbar, AuthForm, UpgradeButton, useCountUp
lib/
  firebase/client.ts          # Browser SDK (Auth + Firestore)
  firebase/admin.ts           # Admin SDK + ID-token verification
  stripe.ts                   # Stripe server client
  plans.ts                    # Plan definitions & limits
firestore.rules               # Firestore security rules
```

## Setup

### 1. Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
3. **Firestore Database** → Create database (production mode).
4. Deploy the security rules: copy `firestore.rules` into the Rules tab
   (or `firebase deploy --only firestore:rules` with the Firebase CLI).
5. Project settings → **General** → add a Web app → copy the config values
   into the `NEXT_PUBLIC_FIREBASE_*` vars.
6. Project settings → **Service accounts** → Generate new private key →
   copy `client_email` and `private_key` into `FIREBASE_CLIENT_EMAIL` /
   `FIREBASE_PRIVATE_KEY`.

### 2. Stripe

1. Create an account at [dashboard.stripe.com](https://dashboard.stripe.com) (test mode is fine).
2. **Products** → Add product "Renewly Pro" with a **recurring** $5/month
   price → copy the `price_...` ID into `STRIPE_PRO_PRICE_ID`.
3. **Developers → API keys** → copy the secret key into `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks** → Add endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

   For local development use the Stripe CLI instead:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   and use the `whsec_...` it prints.

### 3. Run it

```bash
cp .env.example .env.local   # then fill in every value
npm install
npm run dev
```

Open http://localhost:3000, sign up, add a few subscriptions, and hit
**Upgrade to Pro** — use Stripe's test card `4242 4242 4242 4242`
(any future expiry, any CVC).

## How billing sync works

1. The client calls `POST /api/checkout` with a Firebase ID token.
2. The server verifies the token, finds/creates a Stripe customer
   (tagged with the user's `firebaseUid`), and returns a Checkout URL.
3. After payment, Stripe calls the webhook; the handler maps the customer
   back to the Firebase user and writes `plan: "pro"` (plus subscription
   details) to `users/{uid}` with the Admin SDK.
4. The client listens to `users/{uid}` in real time, so the UI flips to
   Pro within a second of payment — no refresh needed. Cancellations flow
   back the same way via `customer.subscription.updated/deleted`.

## Deploying

Works out of the box on [Vercel](https://vercel.com): import the repo, set
all the env vars from `.env.example` (set `NEXT_PUBLIC_APP_URL` to your
production URL), then point your Stripe webhook at the deployed domain.
