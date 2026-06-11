import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, verifyRequest } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
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

  const snapshot = await adminDb().collection("users").doc(user.uid).get();
  const customerId = snapshot.data()?.stripeCustomerId as string | undefined;
  if (!customerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/account`,
  });

  return NextResponse.json({ url: session.url });
}
