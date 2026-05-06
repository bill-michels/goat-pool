"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const adminClient = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
