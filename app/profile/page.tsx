import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import ProfileClient from "./ProfileClient";

const db = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export default async function ProfilePage() {
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
    admin.from("users").select("username, email, created_at").eq("id", user.id).single(),
    admin.from("pool_players").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("pool_players").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "winner"),
    admin.from("pools").select("*", { count: "exact", head: true }).eq("created_by", user.id),
  ]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <ProfileClient
      username={profile?.username ?? ""}
      email={profile?.email ?? user.email ?? ""}
      memberSince={memberSince}
      poolsPlayed={poolsPlayed ?? 0}
      poolsWon={poolsWon ?? 0}
      poolsCommissioned={poolsCommissioned ?? 0}
    />
  );
}
