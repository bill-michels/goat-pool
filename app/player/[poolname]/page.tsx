import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import PoolViewClient from "./PoolViewClient";

export default async function PlayerPoolViewPage({ params }: { params: { poolname: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: userData }, { data: pool }] = await Promise.all([
    adminClient.from("users").select("username, role").eq("id", user.id).single(),
    adminClient
      .from("pools")
      .select("id, name, slug, status, pool_type, tournament_id, tournaments(id, name, num_rounds), users!pools_commissioner_id_fkey(username)")
      .eq("slug", params.poolname)
      .single(),
  ]);

  if (!pool) redirect("/player");

  const tournament = (pool.tournaments as any);
  const tournamentId = tournament?.id ?? pool.tournament_id;
  const totalRounds = tournament?.num_rounds ?? 0;
  const commissionerUsername = (pool.users as any)?.username ?? "—";

  const { data: membership } = await adminClient
    .from("pool_players")
    .select("id, status, lives_purchased, lives_remaining")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const [{ data: rounds }, { data: poolPlayers }, { data: allPicks }] = await Promise.all([
    adminClient
      .from("rounds")
      .select("id, round_number, status, lock_deadline")
      .eq("tournament_id", tournamentId)
      .order("round_number"),
    adminClient
      .from("pool_players")
      .select("id, user_id, status, lives_purchased, lives_remaining, users(username)")
      .eq("pool_id", pool.id),
    adminClient
      .from("picks")
      .select("id, user_id, round_id, athlete_id, result, athletes(name, seed), rounds(round_number, status)")
      .eq("pool_id", pool.id),
  ]);

  const now = new Date().toISOString();
  const pickedRoundIds = new Set(
    (allPicks ?? []).filter((p: any) => p.user_id === user.id).map((p: any) => p.round_id)
  );
  const activeRounds = (rounds ?? []).filter((r: any) => r.status === "active");
  const activeRound =
    activeRounds.find(r => !pickedRoundIds.has(r.id) && (!r.lock_deadline || r.lock_deadline > now))
    ?? [...activeRounds].reverse().find(r => !r.lock_deadline || r.lock_deadline > now)
    ?? activeRounds[activeRounds.length - 1]
    ?? null;
  const completedRoundIds = new Set(
    (rounds ?? []).filter((r: any) => r.status === "locked" || r.status === "completed").map((r: any) => r.id)
  );

  const userPickForActiveRound = activeRound
    ? (allPicks ?? []).find((p: any) => p.user_id === user.id && p.round_id === activeRound.id)
    : null;

  const userPicksByRoundId: Record<string, { athleteName: string; result: string | null }> = {};
  for (const p of (allPicks ?? [])) {
    if ((p as any).user_id === user.id) {
      userPicksByRoundId[(p as any).round_id] = {
        athleteName: ((p as any).athletes as any)?.name ?? "?",
        result: (p as any).result ?? null,
      };
    }
  }

  const players = (poolPlayers ?? []).map((pp: any) => {
    const completedPicks = (allPicks ?? [])
      .filter((p: any) => p.user_id === pp.user_id && completedRoundIds.has(p.round_id))
      .sort((a: any, b: any) => (a.rounds?.round_number ?? 0) - (b.rounds?.round_number ?? 0))
      .map((p: any) => (p.athletes as any)?.name ?? "?");

    return {
      userId: pp.user_id as string,
      username: (pp.users as any)?.username ?? "?",
      isYou: pp.user_id === user.id,
      status: pp.status as string,
      livesRemaining: pp.lives_remaining as number,
      livesPurchased: pp.lives_purchased as number,
      completedPicks,
    };
  }).sort((a: any, b: any) => {
    if (a.isYou) return -1;
    if (b.isYou) return 1;
    if (a.status === "alive" && b.status !== "alive") return -1;
    if (b.status === "alive" && a.status !== "alive") return 1;
    return b.livesRemaining - a.livesRemaining;
  });

  const aliveCount = players.filter(p => p.status === "alive").length;
  const eliminatedCount = players.filter(p => p.status === "eliminated").length;

  const roundsForView = (rounds ?? []).map((r: any) => ({
    id: r.id as string,
    roundNumber: r.round_number as number,
    status: r.status as string,
    lockDeadline: r.lock_deadline as string | null,
  }));

  return (
    <PoolViewClient
      userId={user.id}
      username={userData?.username ?? "?"}
      isCommissioner={userData?.role === "commissioner" || userData?.role === "admin"}
      pool={{
        id: pool.id,
        name: pool.name,
        slug: pool.slug,
        status: pool.status,
        poolType: (pool as any).pool_type ?? "rounds",
        tournamentName: tournament?.name ?? "—",
        commissionerUsername,
        totalRounds,
      }}
      membership={membership ? {
        status: membership.status,
        livesRemaining: membership.lives_remaining,
        livesPurchased: membership.lives_purchased,
      } : null}
      rounds={roundsForView}
      players={players}
      userPicksByRoundId={userPicksByRoundId}
      activeRound={activeRound ? {
        id: activeRound.id,
        roundNumber: activeRound.round_number,
        lockDeadline: activeRound.lock_deadline,
        hasPick: !!userPickForActiveRound,
        pickAthleteName: userPickForActiveRound ? (userPickForActiveRound.athletes as any)?.name ?? null : null,
      } : null}
      totalPlayers={players.length}
      aliveCount={aliveCount}
      eliminatedCount={eliminatedCount}
    />
  );
}
