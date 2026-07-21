import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function fetchOddsApiScores(sportKey: string): Promise<any[]> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return [];
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${key}&daysFrom=3`;
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
  tournament: { id: string; name: string; odds_api_sport_key: string }
): Promise<{ synced: number; tournamentName: string }> {
  const { data: rounds } = await admin
    .from("rounds")
    .select("id, round_number, status")
    .eq("tournament_id", tournament.id)
    .eq("status", "active");

  if (!rounds?.length) return { synced: 0, tournamentName: tournament.name };

  const { data: athletes } = await admin
    .from("athletes")
    .select("id, name, status")
    .eq("tournament_id", tournament.id)
    .eq("status", "active");

  if (!athletes?.length) return { synced: 0, tournamentName: tournament.name };

  const events = await fetchOddsApiScores(tournament.odds_api_sport_key);
  if (!events.length) return { synced: 0, tournamentName: tournament.name };

  const norm = (s: string) => s.toLowerCase().trim();
  const last = (s: string) => norm(s).split(" ").slice(-1)[0];
  const findAthlete = (name: string) => {
    const n = norm(name);
    const l = last(name);
    return athletes.find((a: any) => norm(a.name) === n)
      ?? athletes.find((a: any) => l.length > 3 && last(a.name) === l);
  };

  let totalSynced = 0;

  for (const round of rounds) {
    const { data: existingResults } = await admin
      .from("athlete_results")
      .select("athlete_id")
      .eq("round_id", round.id);
    const existingAthleteIds = new Set((existingResults ?? []).map((r: any) => r.athlete_id as string));

    for (const event of events) {
      const wl = getWinnerLoser(event);
      if (!wl) continue;

      const winnerAthlete = findAthlete(wl.winnerName);
      const loserAthlete = findAthlete(wl.loserName);
      if (!winnerAthlete || !loserAthlete) continue;
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

  return { synced: totalSynced, tournamentName: tournament.name };
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

  if (!tournaments?.length) {
    return NextResponse.json({ message: "No active tournaments with Odds API sport key configured." });
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
