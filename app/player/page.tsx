import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import PlayerDashClient from "./PlayerDashClient";

export default async function PlayerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: userData }, { data: memberships }] = await Promise.all([
    adminClient.from("users").select("username, role").eq("id", user.id).single(),
    adminClient
      .from("pool_players")
      .select("id, status, lives_purchased, lives_remaining, pools(id, name, slug, status, tournament_id, tournaments(id, name, num_rounds))")
      .eq("user_id", user.id),
  ]);

  const allPoolIds = (memberships ?? []).map((m: any) => (m.pools as any)?.id).filter(Boolean) as string[];
  const tournamentIds = Array.from(
    new Set(
      (memberships ?? []).map((m: any) => (m.pools as any)?.tournaments?.id ?? (m.pools as any)?.tournament_id)
    )
  ).filter(Boolean) as string[];

  const [{ data: rounds }, { data: picks }] = await Promise.all([
    tournamentIds.length > 0
      ? adminClient.from("rounds").select("id, round_number, status, lock_deadline, tournament_id").in("tournament_id", tournamentIds)
      : Promise.resolve({ data: [] as any[] }),
    allPoolIds.length > 0
      ? adminClient.from("picks").select("id, pool_id, round_id").eq("user_id", user.id).in("pool_id", allPoolIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const poolEntries = (memberships ?? []).map((m: any) => {
    const pool = m.pools as any;
    const tournament = pool?.tournaments as any;
    const tournamentId = tournament?.id ?? pool?.tournament_id;
    const totalRounds = tournament?.num_rounds ?? 0;

    const activeRound = (rounds ?? []).find(
      (r: any) => r.tournament_id === tournamentId && r.status === "active"
    );

    const hasPick = activeRound
      ? (picks ?? []).some((p: any) => p.pool_id === pool?.id && p.round_id === activeRound.id)
      : false;

    const pickCount = (picks ?? []).filter((p: any) => p.pool_id === pool?.id).length;

    return {
      poolId: pool?.id ?? "",
      poolName: pool?.name ?? "—",
      poolSlug: pool?.slug ?? "",
      poolStatus: pool?.status ?? "upcoming",
      tournamentName: tournament?.name ?? "—",
      totalRounds,
      playerStatus: m.status as string,
      livesRemaining: m.lives_remaining as number,
      livesPurchased: m.lives_purchased as number,
      pickCount,
      activeRound: activeRound
        ? {
            id: activeRound.id,
            roundNumber: activeRound.round_number,
            lockDeadline: activeRound.lock_deadline,
            hasPick,
          }
        : null,
    };
  });

  const myPoolIds = new Set(
    (memberships ?? []).map((m: any) => (m.pools as any)?.id).filter(Boolean) as string[]
  );

  const [{ count: ownedPoolCount }, { data: openPools }, { data: pendingRequests }] = await Promise.all([
    adminClient.from("pools").select("id", { count: "exact", head: true }).eq("commissioner_id", user.id),
    adminClient
      .from("pools")
      .select("id, name, slug, fee_per_life, tournaments(name), pool_players(count)")
      .eq("allow_join_requests", true)
      .eq("status", "active")
      .order("name"),
    adminClient.from("join_requests").select("pool_id").eq("user_id", user.id).eq("status", "pending"),
  ]);

  const pendingPoolIds = new Set((pendingRequests ?? []).map((r: any) => r.pool_id as string));

  const joinablePools = (openPools ?? [])
    .filter((p: any) => !myPoolIds.has(p.id) && !pendingPoolIds.has(p.id))
    .map((p: any) => ({
      id: p.id as string,
      name: p.name as string,
      slug: p.slug as string,
      feePerLife: (p.fee_per_life ?? 0) as number,
      tournamentName: ((p.tournaments as any)?.name ?? "—") as string,
      playerCount: (p.pool_players?.[0]?.count ?? 0) as number,
    }));

  return (
    <PlayerDashClient
      username={userData?.username ?? "?"}
      isCommissioner={userData?.role === "commissioner" || userData?.role === "admin" || (ownedPoolCount ?? 0) > 0}
      pools={poolEntries}
      joinablePools={joinablePools}
    />
  );
}
