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

      // Auto-assign pick if player joined mid-tournament and round is already locked
      const { data: pp } = await admin
        .from("pool_players")
        .select("pool_id, user_id")
        .eq("id", pool_player_id)
        .single();

      if (pp) {
        const { data: pool } = await admin
          .from("pools")
          .select("tournament_id, missed_pick_rule")
          .eq("id", pp.pool_id)
          .single();

        if (pool) {
          const { data: round } = await admin
            .from("rounds")
            .select("id, round_number, lock_deadline")
            .eq("tournament_id", pool.tournament_id)
            .eq("status", "active")
            .maybeSingle();

          if (round?.lock_deadline && round.lock_deadline < new Date().toISOString()) {
            const { data: existingPick } = await admin
              .from("picks")
              .select("id")
              .eq("pool_id", pp.pool_id)
              .eq("round_id", round.id)
              .eq("user_id", pp.user_id)
              .maybeSingle();

            if (!existingPick) {
              const { data: previousPicks } = await admin
                .from("picks")
                .select("athlete_id")
                .eq("pool_id", pp.pool_id)
                .eq("user_id", pp.user_id);

              const usedIds = new Set((previousPicks ?? []).map((p: any) => p.athlete_id));

              const { data: athletes } = await admin
                .from("athletes")
                .select("id, seed, has_bye")
                .eq("tournament_id", pool.tournament_id)
                .eq("status", "active")
                .order("seed", { nullsFirst: false })
                .order("name");

              const available = (athletes ?? []).filter((a: any) => {
                if (usedIds.has(a.id)) return false;
                if (round.round_number === 1 && a.has_bye) return false;
                return true;
              });

              if (available.length) {
                const selected = pool.missed_pick_rule === "top_seed"
                  ? available[0]
                  : available[Math.floor(Math.random() * available.length)];

                await admin.from("picks").insert({
                  pool_id: pp.pool_id,
                  round_id: round.id,
                  user_id: pp.user_id,
                  athlete_id: selected.id,
                  is_auto_assigned: true,
                });
              }
            }
          }
        }
      }

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
