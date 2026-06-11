import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, verifyRequest } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  const user = await verifyRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 500 });
  }

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
