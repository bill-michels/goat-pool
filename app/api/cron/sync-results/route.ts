import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

const SF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://www.sofascore.com/",
};

async function fetchSofascoreEvents(tId: string, seasonId: string): Promise<any[]> {
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, (_, i) =>
      fetch(
        `https://api.sofascore.com/api/v1/unique-tournament/${tId}/season/${seasonId}/events/last/${i}`,
        { headers: SF_HEADERS }
      ).then(r => r.ok ? r.json() : null)
    )
  );
  return results
    .filter(r => r.status === "fulfilled" && Array.isArray((r as any).value?.events))
    .flatMap(r => (r as any).value.events as any[])
    .filter(e => e.winnerCode === 1 || e.winnerCode === 2);
}

async function syncTournament(
  admin: ReturnType<typeof db>,
  tournament: { id: string; sofascore_tournament_id: string; sofascore_season_id: string }
): Promise<{ synced: number; tournamentName: string }> {
  // Find the active round
  const { data: rounds } = await admin
    .from("rounds")
    .select("id, round_number, status")
    .eq("tournament_id", tournament.id)
    .eq("status", "active");

  if (!rounds?.length) return { synced: 0, tournamentName: tournament.id };

  const { data: tournamentData } = await admin
    .from("tournaments")
    .select("name")
    .eq("id", tournament.id)
    .single();

  // Get all athletes for this tournament that are still active (not yet eliminated)
  const { data: athletes } = await admin
    .from("athletes")
    .select("id, name, status")
    .eq("tournament_id", tournament.id)
    .eq("status", "active");

  if (!athletes?.length) return { synced: 0, tournamentName: tournamentData?.name ?? tournament.id };

  // For each active round, find athletes with no result yet
  const norm = (s: string) => s.toLowerCase().trim();
  const last = (s: string) => norm(s).split(" ").slice(-1)[0];

  const findAthlete = (sfName: string) => {
    const n = norm(sfName);
    const l = last(sfName);
    return athletes.find((a: any) => norm(a.name) === n)
      ?? athletes.find((a: any) => l.length > 3 && last(a.name) === l);
  };

  // Fetch Sofascore completed matches
  const events = await fetchSofascoreEvents(
    tournament.sofascore_tournament_id,
    tournament.sofascore_season_id
  );

  let totalSynced = 0;

  for (const round of rounds) {
    // Get athletes who already have a result for this round
    const { data: existingResults } = await admin
      .from("athlete_results")
      .select("athlete_id")
      .eq("round_id", round.id);
    const existingAthleteIds = new Set((existingResults ?? []).map((r: any) => r.athlete_id as string));

    // Find Sofascore matches where BOTH players are in our active athletes
    // and neither has a result yet for this round
    for (const event of events) {
      const homeName: string = event.homeTeam?.name;
      const awayName: string = event.awayTeam?.name;
      if (!homeName || !awayName || !event.winnerCode) continue;

      const homeAthlete = findAthlete(homeName);
      const awayAthlete = findAthlete(awayName);

      // Only process if both athletes are recognized and at least one lacks a result
      if (!homeAthlete || !awayAthlete) continue;
      if (existingAthleteIds.has(homeAthlete.id) && existingAthleteIds.has(awayAthlete.id)) continue;

      const winnerId = event.winnerCode === 1 ? homeAthlete.id : awayAthlete.id;
      const loserId = event.winnerCode === 1 ? awayAthlete.id : homeAthlete.id;

      for (const [athleteId, result] of [[winnerId, "win"], [loserId, "loss"]] as const) {
        if (existingAthleteIds.has(athleteId)) continue;

        // Upsert the athlete_result
        const { error: resErr } = await admin.from("athlete_results").upsert(
          { round_id: round.id, athlete_id: athleteId, result, recorded_by: null },
          { onConflict: "round_id,athlete_id" }
        );
        if (resErr) continue;

        // Update athlete status
        if (result === "loss") {
          await admin.from("athletes")
            .update({ status: "eliminated", eliminated_in_round: round.round_number })
            .eq("id", athleteId);
        }

        // Update picks for this athlete/round
        await admin.from("picks")
          .update({ result })
          .eq("athlete_id", athleteId)
          .eq("round_id", round.id);

        // If loss, decrement lives and possibly eliminate pool players
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

  return { synced: totalSynced, tournamentName: tournamentData?.name ?? tournament.id };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = db();

  // Find active tournaments with Sofascore IDs configured
  const { data: tournaments } = await admin
    .from("tournaments")
    .select("id, sofascore_tournament_id, sofascore_season_id")
    .eq("status", "active")
    .not("sofascore_tournament_id", "is", null)
    .not("sofascore_season_id", "is", null);

  if (!tournaments?.length) {
    return NextResponse.json({ message: "No active tournaments with Sofascore IDs configured." });
  }

  const results = await Promise.allSettled(
    tournaments.map(t => syncTournament(admin, t as any))
  );

  const summary = results.map((r, i) =>
    r.status === "fulfilled"
      ? `${r.value.tournamentName}: ${r.value.synced} synced`
      : `Tournament ${i}: error`
  );

  return NextResponse.json({ ok: true, summary });
}
