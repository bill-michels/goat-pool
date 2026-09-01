import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { findAthlete } from "@/lib/nameMatch";

export const runtime = "nodejs";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function fetchOddsApiScores(sportKey: string, daysFrom: number = 3): Promise<any[]> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return [];
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${key}&daysFrom=${daysFrom}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data as any[]).filter(e => e.completed === true);
}

function getWinnerLoser(event: any): { winnerName: string; loserName: string } | null {
  const scores: Array<{ name: string; score: string }> = event.scores ?? [];
  if (scores.length !== 2) return null;
  const [a, b] = scores;
  const aScore = parseFloat(a.score ?? "0");
  const bScore = parseFloat(b.score ?? "0");
  if (aScore === bScore) return null;
  return aScore > bScore
    ? { winnerName: a.name, loserName: b.name }
    : { winnerName: b.name, loserName: a.name };
}

async function syncTournament(
  admin: ReturnType<typeof db>,
  tournament: { id: string; name: string; odds_api_sport_key: string },
  daysFrom: number = 3
): Promise<{ synced: number; tournamentName: string }> {
  const { data: allRounds } = await admin
    .from("rounds")
    .select("id, round_number, status")
    .eq("tournament_id", tournament.id)
    .order("round_number");

  const rounds = (allRounds ?? []).filter(r => r.status === "active");
  if (!rounds.length) return { synced: 0, tournamentName: tournament.name };

  // Lookup by round_number for eligibility checks
  const roundByNumber = new Map((allRounds ?? []).map(r => [r.round_number, r]));

  const { data: athletes } = await admin
    .from("athletes")
    .select("id, name, status")
    .eq("tournament_id", tournament.id)
    .neq("status", "inactive");

  if (!athletes?.length) return { synced: 0, tournamentName: tournament.name };

  const events = await fetchOddsApiScores(tournament.odds_api_sport_key, daysFrom);
  if (!events.length) return { synced: 0, tournamentName: tournament.name };


  let totalSynced = 0;

  for (const round of rounds) {
    const { data: existingResults } = await admin
      .from("athlete_results")
      .select("athlete_id")
      .eq("round_id", round.id);
    const existingAthleteIds = new Set((existingResults ?? []).map((r: any) => r.athlete_id as string));

    // For rounds beyond the first, only record results for athletes who advanced to this round.
    // This prevents Round 1 events from being applied to Round 2 when both players are still active.
    let eligibleAthleteIds: Set<string> | null = null;
    if (round.round_number > 1) {
      const prevRound = roundByNumber.get(round.round_number - 1);
      const [{ data: prevWinners }, { data: byeAthletes }] = await Promise.all([
        prevRound
          ? admin.from("athlete_results").select("athlete_id").eq("round_id", prevRound.id).eq("result", "win")
          : Promise.resolve({ data: [] as any[] }),
        round.round_number === 2
          ? admin.from("athletes").select("id").eq("tournament_id", tournament.id).eq("has_bye", true)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      eligibleAthleteIds = new Set([
        ...(prevWinners ?? []).map((r: any) => r.athlete_id as string),
        ...(byeAthletes ?? []).map((a: any) => a.id as string),
      ]);
    }

    for (const event of events) {
      const wl = getWinnerLoser(event);
      if (!wl) continue;

      const winnerAthlete = findAthlete(wl.winnerName, athletes);
      const loserAthlete = findAthlete(wl.loserName, athletes);
      if (!winnerAthlete || !loserAthlete) continue;
      if (eligibleAthleteIds && (!eligibleAthleteIds.has(winnerAthlete.id) || !eligibleAthleteIds.has(loserAthlete.id))) continue;
      if (existingAthleteIds.has(winnerAthlete.id) && existingAthleteIds.has(loserAthlete.id)) continue;

      for (const [athleteId, result] of [[winnerAthlete.id, "win"], [loserAthlete.id, "loss"]] as const) {
        if (existingAthleteIds.has(athleteId)) continue;

        const { error: resErr } = await admin.from("athlete_results").upsert(
          { round_id: round.id, athlete_id: athleteId, result, recorded_by: null },
          { onConflict: "round_id,athlete_id" }
        );
        if (resErr) continue;

        if (result === "loss") {
          await admin.from("athletes")
            .update({ status: "eliminated", eliminated_in_round: round.round_number })
            .eq("id", athleteId);
        }

        await admin.from("picks")
          .update({ result })
          .eq("athlete_id", athleteId)
          .eq("round_id", round.id);

        if (result === "loss") {
          const { data: affectedPicks } = await admin
            .from("picks")
            .select("pool_id, user_id")
            .eq("athlete_id", athleteId)
            .eq("round_id", round.id);

          for (const pick of affectedPicks ?? []) {
            const { data: pp } = await admin
              .from("pool_players")
              .select("id, lives_remaining, status")
              .eq("pool_id", pick.pool_id)
              .eq("user_id", pick.user_id)
              .single();
            if (!pp || pp.status === "eliminated" || pp.status === "winner") continue;
            const newLives = Math.max(0, (pp.lives_remaining ?? 1) - 1);
            await admin.from("pool_players").update({
              lives_remaining: newLives,
              status: newLives === 0 ? "eliminated" : pp.status,
            }).eq("id", pp.id);
          }
        }

        existingAthleteIds.add(athleteId);
        totalSynced++;
      }
    }
  }

  // Auto-activate Round N+1 for any active round that now has wins
  for (const round of rounds) {
    const nextRound = roundByNumber.get(round.round_number + 1);
    if (!nextRound || nextRound.status !== "upcoming") continue;
    const { count } = await admin
      .from("athlete_results")
      .select("id", { count: "exact", head: true })
      .eq("round_id", round.id)
      .eq("result", "win");
    if ((count ?? 0) > 0) {
      await admin.from("rounds").update({ status: "active" }).eq("id", nextRound.id);
    }
  }

  return { synced: totalSynced, tournamentName: tournament.name };
}

async function autoAssignExpiredRounds(admin: ReturnType<typeof db>): Promise<number> {
  const now = new Date().toISOString();
  const { data: rounds } = await admin
    .from("rounds")
    .select("id, round_number, tournament_id")
    .eq("status", "active")
    .lt("lock_deadline", now)
    .not("lock_deadline", "is", null);

  if (!rounds?.length) return 0;
  let totalAssigned = 0;

  for (const round of rounds) {
    const { data: pools } = await admin
      .from("pools")
      .select("id, missed_pick_rule")
      .eq("tournament_id", round.tournament_id)
      .eq("status", "active");
    if (!pools?.length) continue;

    const { data: allAthletes } = await admin
      .from("athletes")
      .select("id, seed, has_bye")
      .eq("tournament_id", round.tournament_id)
      .eq("status", "active")
      .order("seed", { nullsFirst: false })
      .order("name");
    if (!allAthletes?.length) continue;

    for (const pool of pools) {
      const { data: alivePlayers } = await admin
        .from("pool_players").select("user_id")
        .eq("pool_id", pool.id).eq("status", "alive");
      if (!alivePlayers?.length) continue;

      const { data: existingPicks } = await admin
        .from("picks").select("user_id, athlete_id")
        .eq("pool_id", pool.id).eq("round_id", round.id);
      const pickedUserIds = new Set((existingPicks ?? []).map((p: any) => p.user_id));
      const missingPlayers = (alivePlayers ?? []).filter((p: any) => !pickedUserIds.has(p.user_id));
      if (!missingPlayers.length) continue;

      const { data: allPicks } = await admin
        .from("picks").select("user_id, athlete_id")
        .eq("pool_id", pool.id).neq("round_id", round.id);

      for (const player of missingPlayers) {
        const prevIds = new Set(
          (allPicks ?? []).filter((p: any) => p.user_id === player.user_id).map((p: any) => p.athlete_id)
        );
        const available = (allAthletes ?? []).filter((a: any) => {
          if (prevIds.has(a.id)) return false;
          if (round.round_number === 1 && a.has_bye) return false;
          return true;
        });
        if (!available.length) continue;
        const selected = pool.missed_pick_rule === "top_seed"
          ? available[0]
          : available[Math.floor(Math.random() * available.length)];
        const { error } = await admin.from("picks").insert({
          pool_id: pool.id, round_id: round.id,
          user_id: player.user_id, athlete_id: selected.id, is_auto_assigned: true,
        });
        if (!error) totalAssigned++;
      }
    }

    // Lock the round now that the deadline has passed and auto-assigns are done
    await admin.from("rounds").update({ status: "locked" }).eq("id", round.id);
  }
  return totalAssigned;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = db();

  const { data: tournaments } = await admin
    .from("tournaments")
    .select("id, name, odds_api_sport_key")
    .eq("status", "active")
    .not("odds_api_sport_key", "is", null);

  // For each tournament, check if any pool is daily type (use daysFrom=1 to avoid cross-day bleed)
  const dailyTournamentIds = new Set<string>();
  if (tournaments?.length) {
    const { data: dailyPools } = await admin
      .from("pools")
      .select("tournament_id")
      .in("tournament_id", tournaments.map(t => t.id))
      .eq("pool_type", "daily");
    (dailyPools ?? []).forEach((p: any) => dailyTournamentIds.add(p.tournament_id));
  }

  if (!tournaments?.length) {
    return NextResponse.json({ message: "No active tournaments with Odds API sport key configured." });
  }

  const [results, autoAssigned] = await Promise.all([
    Promise.allSettled(
      tournaments.map(t => syncTournament(admin, t as any, dailyTournamentIds.has(t.id) ? 1 : 3))
    ),
    autoAssignExpiredRounds(admin),
  ]);

  const summary = results.map((r, i) =>
    r.status === "fulfilled"
      ? `${r.value.tournamentName}: ${r.value.synced} synced`
      : `Tournament ${i}: error`
  );

  return NextResponse.json({ ok: true, summary, autoAssigned });
}
