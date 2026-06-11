import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, verifyRequest } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId || !process.env.STRIPE_SECRET_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    return NextResponse.json(
      { error: "Payments aren't enabled yet — check back soon!" },
      { status: 503 }
    );
  }

  const user = await verifyRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const userRef = adminDb().collection("users").doc(user.uid);
  const snapshot = await userRef.get();
  let customerId = snapshot.data()?.stripeCustomerId as string | undefined;

  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email,
      metadata: { firebaseUid: user.uid },
    });
    customerId = customer.id;
    await userRef.set({ stripeCustomerId: customerId }, { merge: true });
  }

  const session = await stripe().checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.uid,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
