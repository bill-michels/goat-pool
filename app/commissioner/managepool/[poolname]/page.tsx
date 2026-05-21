import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import ManagePoolClient from "./ManagePoolClient";

export default async function ManagePoolPage({
  params,
}: {
  params: { poolname: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pool } = await adminClient
    .from("pools")
    .select(
      "id, name, slug, status, fee_per_life, missed_pick_rule, take_rate, allow_join_requests, tournament_id, tournaments(id, name)"
    )
    .eq("slug", params.poolname)
    .eq("commissioner_id", user.id)
    .single();

  if (!pool) redirect("/commissioner");

  const tournamentId = (pool.tournaments as any)?.id ?? pool.tournament_id;

  const [
    { data: rounds },
    { data: poolPlayers },
    { data: picks },
    { data: invites },
    { data: payments },
    { data: payout },
    { data: userData },
    { data: joinRequests },
  ] = await Promise.all([
    adminClient
      .from("rounds")
      .select("id, round_number, lock_deadline, status")
      .eq("tournament_id", tournamentId)
      .order("round_number"),
    adminClient
      .from("pool_players")
      .select(
        "id, user_id, status, lives_purchased, lives_remaining, payment_status, users(username, email)"
      )
      .eq("pool_id", pool.id),
    adminClient
      .from("picks")
      .select("id, user_id, result, is_auto_assigned, rounds(round_number), athletes(name)")
      .eq("pool_id", pool.id),
    adminClient
      .from("pool_invites")
      .select("id, email, status, sent_at")
      .eq("pool_id", pool.id)
      .order("sent_at", { ascending: false }),
    adminClient
      .from("payments")
      .select("amount, status")
      .eq("pool_id", pool.id)
      .eq("status", "completed"),
    adminClient
      .from("payouts")
      .select("amount, status")
      .eq("pool_id", pool.id)
      .maybeSingle(),
    adminClient.from("users").select("username, role").eq("id", user.id).single(),
    adminClient
      .from("join_requests")
      .select("id, status, created_at, users(username, email)")
      .eq("pool_id", pool.id)
      .order("created_at", { ascending: false }),
  ]);

  const totalFees = (payments ?? []).reduce(
    (sum: number, p: any) => sum + p.amount,
    0
  );
  const earnings = Math.round(totalFees * (1 - pool.take_rate / 100));

  const playersWithPicks = (poolPlayers ?? []).map((player: any) => {
    const playerPicks = (picks ?? [])
      .filter((pick: any) => pick.user_id === player.user_id)
      .sort(
        (a: any, b: any) =>
          (a.rounds?.round_number ?? 0) - (b.rounds?.round_number ?? 0)
      );
    return { ...player, picks: playerPicks };
  });

  return (
    <ManagePoolClient
      userId={user.id}
      username={userData?.username ?? "?"}
      isAdmin={userData?.role === "admin"}
      pool={{
        id: pool.id,
        name: pool.name,
        slug: pool.slug,
        status: pool.status,
        feePerLife: pool.fee_per_life,
        missedPickRule: pool.missed_pick_rule,
        takeRate: pool.take_rate,
        allowJoinRequests: pool.allow_join_requests ?? false,
        tournamentName: (pool.tournaments as any)?.name ?? "—",
      }}
      rounds={rounds ?? []}
      players={playersWithPicks}
      invites={invites ?? []}
      joinRequests={(joinRequests ?? []).map((r: any) => ({
        id: r.id,
        status: r.status,
        createdAt: r.created_at,
        username: r.users?.username ?? "—",
        email: r.users?.email ?? "—",
      }))}
      totalFees={totalFees}
      earnings={earnings}
      payout={payout ?? null}
    />
  );
}
