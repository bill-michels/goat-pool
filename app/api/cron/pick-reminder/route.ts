import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyPickReminder } from "@/app/admin/tournamentsetup/actions";

export const runtime = "nodejs";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function autoAssignMissedPicks(roundId: string) {
  const admin = db();

  const { data: round } = await admin
    .from("rounds")
    .select("id, round_number, tournament_id")
    .eq("id", roundId)
    .single();

  if (!round) return;

  const { data: pools } = await admin
    .from("pools")
    .select("id, missed_pick_rule")
    .eq("tournament_id", round.tournament_id)
    .eq("status", "active");

  if (!pools?.length) return;

  const { data: allAthletes } = await admin
    .from("athletes")
    .select("id, seed, has_bye")
    .eq("tournament_id", round.tournament_id)
    .eq("status", "active")
    .order("seed");

  if (!allAthletes?.length) return;

  for (const pool of pools) {
    const { data: alivePlayers } = await admin
      .from("pool_players")
      .select("user_id")
      .eq("pool_id", pool.id)
      .eq("status", "alive");

    if (!alivePlayers?.length) continue;

    const { data: existingPicks } = await admin
      .from("picks")
      .select("user_id")
      .eq("pool_id", pool.id)
      .eq("round_id", roundId);

    const pickedUserIds = new Set((existingPicks ?? []).map((p: any) => p.user_id));
    const missingPlayers = alivePlayers.filter((p: any) => !pickedUserIds.has(p.user_id));

    if (!missingPlayers.length) continue;

    const { data: allPicks } = await admin
      .from("picks")
      .select("user_id, athlete_id")
      .eq("pool_id", pool.id)
      .neq("round_id", roundId);

    for (const player of missingPlayers) {
      const previousAthleteIds = new Set(
        (allPicks ?? [])
          .filter((p: any) => p.user_id === player.user_id)
          .map((p: any) => p.athlete_id)
      );

      const available = allAthletes.filter((a: any) => {
        if (previousAthleteIds.has(a.id)) return false;
        if (round.round_number === 1 && a.has_bye) return false;
        return true;
      });

      if (!available.length) continue;

      const selected =
        pool.missed_pick_rule === "top_seed"
          ? available[0]
          : available[Math.floor(Math.random() * available.length)];

      await admin.from("picks").insert({
        pool_id: pool.id,
        round_id: roundId,
        user_id: player.user_id,
        athlete_id: selected.id,
        is_auto_assigned: true,
      });
    }
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Send reminders for rounds locking in the next 24 hours
  const { data: upcomingRounds } = await db()
    .from("rounds")
    .select("id")
    .eq("status", "active")
    .not("lock_deadline", "is", null)
    .gt("lock_deadline", now.toISOString())
    .lte("lock_deadline", in24h.toISOString());

  if (upcomingRounds?.length) {
    await Promise.allSettled(upcomingRounds.map((r) => notifyPickReminder(r.id)));
  }

  // Auto-assign missed picks for rounds past their deadline
  const { data: overdueRounds } = await db()
    .from("rounds")
    .select("id")
    .eq("status", "active")
    .not("lock_deadline", "is", null)
    .lt("lock_deadline", now.toISOString());

  if (overdueRounds?.length) {
    await Promise.allSettled(overdueRounds.map((r) => autoAssignMissedPicks(r.id)));
  }

  return NextResponse.json({
    reminders: upcomingRounds?.length ?? 0,
    autoAssigned: overdueRounds?.length ?? 0,
  });
}
