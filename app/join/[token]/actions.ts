"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/resend";

const adminClient = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Used for free pools — inserts pool_player immediately and redirects
export async function joinPool(token: string, lives: number): Promise<{ error: string } | never> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = adminClient();

  const { data: invite } = await db
    .from("pool_invites")
    .select("id, pool_id, status, pools(id, name, slug)")
    .eq("invite_token", token)
    .single();

  if (!invite || invite.status !== "pending") {
    return { error: "This invite link is no longer valid." };
  }

  const pool = invite.pools as any;

  const { data: existing } = await db
    .from("pool_players")
    .select("id")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/player/${pool.slug}`);
  }

  const { error: insertError } = await db.from("pool_players").insert({
    pool_id: pool.id,
    user_id: user.id,
    status: "alive",
    lives_purchased: lives,
    lives_remaining: lives,
    payment_status: "unpaid",
  });

  if (insertError) {
    return { error: "Failed to join pool. Please try again." };
  }

  await db
    .from("pool_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  redirect(`/player/${pool.slug}`);
}

// Used for paid pools — creates Stripe Checkout session and returns redirect URL
export async function createCheckoutSession(
  token: string,
  lives: 1 | 2
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const db = adminClient();

  const { data: invite } = await db
    .from("pool_invites")
    .select("id, pool_id, status, pools(id, name, slug, fee_per_life)")
    .eq("invite_token", token)
    .single();

  if (!invite || invite.status !== "pending") {
    return { error: "This invite link is no longer valid." };
  }

  const pool = invite.pools as any;
  const feePerLife: number = pool.fee_per_life ?? 0;
  const totalAmount = feePerLife * lives;

  if (totalAmount === 0) return { error: "Use direct join for free pools." };

  // Check if already joined and paid
  const { data: existing } = await db
    .from("pool_players")
    .select("id, payment_status")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.payment_status === "paid_stripe") {
    return { error: "You have already paid and joined this pool." };
  }

  // Reserve spot (or reuse pending reservation)
  let poolPlayerId: string;
  if (existing) {
    poolPlayerId = existing.id;
    // Update lives in case they changed the selection
    await db.from("pool_players")
      .update({ lives_purchased: lives, lives_remaining: lives })
      .eq("id", existing.id);
  } else {
    const { data: pp, error: ppErr } = await db
      .from("pool_players")
      .insert({
        pool_id: pool.id,
        user_id: user.id,
        status: "alive",
        lives_purchased: lives,
        lives_remaining: lives,
        payment_status: "unpaid",
      })
      .select("id")
      .single();
    if (ppErr || !pp) return { error: "Failed to reserve spot. Please try again." };
    poolPlayerId = pp.id;
  }

  // Create payment record
  const { data: payment, error: payErr } = await db
    .from("payments")
    .insert({
      pool_id: pool.id,
      user_id: user.id,
      amount: totalAmount,
      status: "pending",
    })
    .select("id")
    .single();

  if (payErr || !payment) return { error: "Failed to initialize payment. Please try again." };

  await db.from("pool_players").update({ payment_id: payment.id }).eq("id", poolPlayerId);

  const { data: profile } = await db.from("users").select("email").eq("id", user.id).single();
  const email = profile?.email ?? user.email ?? undefined;

  const base = appUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    ...(email ? { customer_email: email } : {}),
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `${pool.name} — ${lives} ${lives === 1 ? "life" : "lives"}`,
          description: `Survivor pool entry fee`,
        },
        unit_amount: totalAmount,
      },
      quantity: 1,
    }],
    metadata: {
      pool_player_id: poolPlayerId,
      payment_id: payment.id,
      invite_id: String(invite.id),
      pool_slug: pool.slug,
    },
    success_url: `${base}/player/${pool.slug}?joined=1`,
    cancel_url: `${base}/join/${token}?cancelled=1`,
  });

  return { url: session.url! };
}
