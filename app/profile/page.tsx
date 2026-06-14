import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import ProfileClient from "./ProfileClient";

const db = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { stripe_return?: string; stripe_refresh?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = db();

  const [
    { data: profile },
    { count: poolsPlayed },
    { count: poolsWon },
    { count: poolsCommissioned },
  ] = await Promise.all([
    admin.from("users").select("username, email, created_at, stripe_connect_account_id, stripe_connect_onboarded").eq("id", user.id).single(),
    admin.from("pool_players").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("pool_players").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "winner"),
    admin.from("pools").select("*", { count: "exact", head: true }).eq("created_by", user.id),
  ]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  let stripeConnected = profile?.stripe_connect_onboarded ?? false;
  const stripeAccountId = (profile?.stripe_connect_account_id as string | null) ?? null;

  // If returning from Stripe onboarding, check if they completed it
  if (searchParams.stripe_return && stripeAccountId && !stripeConnected) {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      if (account.details_submitted) {
        await admin.from("users").update({ stripe_connect_onboarded: true }).eq("id", user.id);
        stripeConnected = true;
      }
    } catch {
      // Stripe error — ignore, user can retry
    }
  }

  return (
    <ProfileClient
      username={profile?.username ?? ""}
      email={profile?.email ?? user.email ?? ""}
      memberSince={memberSince}
      poolsPlayed={poolsPlayed ?? 0}
      poolsWon={poolsWon ?? 0}
      poolsCommissioned={poolsCommissioned ?? 0}
      stripeConnected={stripeConnected}
      stripeAccountId={stripeAccountId}
    />
  );
}
