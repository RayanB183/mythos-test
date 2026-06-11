import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Stripe webhook handler. Configure the endpoint in the Stripe dashboard
 * pointing at {APP_URL}/api/webhooks/stripe with these events enabled:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const uid = session.client_reference_id;
        if (uid && session.subscription) {
          const subscription = await stripe().subscriptions.retrieve(
            session.subscription as string
          );
          await syncSubscription(uid, subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const uid = await uidForCustomer(subscription.customer as string);
        if (uid) await syncSubscription(uid, subscription);
        break;
      }
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function uidForCustomer(customerId: string): Promise<string | null> {
  const customer = await stripe().customers.retrieve(customerId);
  if (customer.deleted) return null;
  const uid = customer.metadata.firebaseUid;
  if (uid) return uid;

  // Fallback: look up by stored customer id.
  const match = await adminDb()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  return match.empty ? null : match.docs[0].id;
}

async function syncSubscription(uid: string, subscription: Stripe.Subscription) {
  const active =
    subscription.status === "active" || subscription.status === "trialing";
  const item = subscription.items.data[0];

  await adminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        stripeCustomerId: subscription.customer as string,
        plan: active ? "pro" : "free",
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        priceId: item?.price.id ?? null,
        currentPeriodEnd: item?.current_period_end ?? null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      { merge: true }
    );
}
