import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const db = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature error: ${err}` }, { status: 400 });
  }

  const admin = db();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { pool_player_id, payment_id, invite_id } = session.metadata ?? {};

      if (!pool_player_id || !payment_id) break;

      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;

      await Promise.all([
        admin.from("payments").update({
          status: "completed",
          stripe_payment_intent_id: paymentIntentId,
          stripe_checkout_session_id: session.id,
        }).eq("id", payment_id),

        admin.from("pool_players").update({
          payment_status: "paid_stripe",
        }).eq("id", pool_player_id),

        invite_id
          ? admin.from("pool_invites").update({
              status: "accepted",
              accepted_at: new Date().toISOString(),
            }).eq("id", invite_id)
          : Promise.resolve(),
      ]);

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { payment_id } = session.metadata ?? {};
      if (payment_id) {
        await admin.from("payments").update({ status: "failed" }).eq("id", payment_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
