"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resend, FROM, appUrl } from "@/lib/resend";
import { roundResultEmail, pickReminderEmail } from "@/lib/emails";
import { findAthlete } from "@/lib/nameMatch";

const db = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function getAdminUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function activateNextRoundIfNeeded(
  admin: ReturnType<typeof db>,
  tournamentId: string,
  roundId: string,
  roundNumber: number
): Promise<void> {
  const { data: nextRound } = await admin
    .from("rounds")
    .select("id, status")
    .eq("tournament_id", tournamentId)
    .eq("round_number", roundNumber + 1)
    .maybeSingle();
  if (!nextRound || nextRound.status !== "upcoming") return;
  const { count } = await admin
    .from("athlete_results")
    .select("id", { count: "exact", head: true })
    .eq("round_id", roundId)
    .eq("result", "win");
  if ((count ?? 0) > 0) {
    await admin.from("rounds").update({ status: "active" }).eq("id", nextRound.id);
  }
}

function roundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "SF";
  if (fromEnd === 2) return "QF";
  return `Round ${roundNumber}`;
}

export async function autoAssignMissedPicksForRound(
  roundId: string,
  roundNumber: number,
  tournamentId: string
): Promise<{ assigned: number; error?: string }> {
  const admin = db();

  const { data: pools } = await admin
    .from("pools")
    .select("id, missed_pick_rule")
    .eq("tournament_id", tournamentId)
    .eq("status", "active");

  if (!pools?.length) return { assigned: 0 };

  const { data: allAthletes } = await admin
    .from("athletes")
    .select("id, seed, has_bye")
    .eq("tournament_id", tournamentId)
    .eq("status", "active")
    .order("seed", { nullsFirst: false })
    .order("name");

  if (!allAthletes?.length) return { assigned: 0 };

  let assigned = 0;

  for (const pool of pools) {
    const { data: alivePlayers } = await admin
      .from("pool_players")
      .select("user_id")
      .eq("pool_id", pool.id)
      .eq("status", "alive");

    if (!alivePlayers?.length) continue;

    const { data: existingPicks } = await admin
      .from("picks")
      .select("user_id, athlete_id")
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

      const available = (allAthletes ?? []).filter((a: any) => {
        if (previousAthleteIds.has(a.id)) return false;
        if (roundNumber === 1 && a.has_bye) return false;
        return true;
      });

      if (!available.length) continue;

      const selected =
        pool.missed_pick_rule === "top_seed"
          ? available[0]
          : available[Math.floor(Math.random() * available.length)];

      const { error } = await admin.from("picks").insert({
        pool_id: pool.id,
        round_id: roundId,
        user_id: player.user_id,
        athlete_id: selected.id,
        is_auto_assigned: true,
      });

      if (!error) assigned++;
    }
  }

  return { assigned };
}

export async function processAthleteResult(
  athleteId: string,
  roundId: string,
  result: "win" | "loss",
  activeRoundNumber: number
): Promise<{ error?: string }> {
  const admin = db();

  const recordedBy = await getAdminUserId();
  if (!recordedBy) return { error: "Not authenticated." };

  // 1. Save athlete_result
  const { error: resErr } = await admin.from("athlete_results").upsert(
    { round_id: roundId, athlete_id: athleteId, result, recorded_by: recordedBy },
    { onConflict: "round_id,athlete_id" }
  );
  if (resErr) return { error: resErr.message };

  // Auto-open the next round for picks
  const { data: round } = await admin.from("rounds").select("tournament_id, round_number").eq("id", roundId).single();
  if (round) {
    await admin
      .from("rounds")
      .update({ status: "active" })
      .eq("tournament_id", round.tournament_id)
      .eq("round_number", round.round_number + 1)
      .eq("status", "upcoming");
  }

  // 2. Mark athlete eliminated if loss
  if (result === "loss") {
    await admin.from("athletes")
      .update({ status: "eliminated", eliminated_in_round: activeRoundNumber })
      .eq("id", athleteId);
  } else {
    // Undo elimination if result was corrected back to win
    await admin.from("athletes")
      .update({ status: "active", eliminated_in_round: null })
      .eq("id", athleteId);
  }

  // 3. Find all picks for this athlete/round across all pools
  const { data: affectedPicks } = await admin
    .from("picks")
    .select("id, pool_id, user_id, result")
    .eq("athlete_id", athleteId)
    .eq("round_id", roundId);

  if (!affectedPicks?.length) return {};

  // 4. Update pick results
  await admin.from("picks")
    .update({ result })
    .eq("athlete_id", athleteId)
    .eq("round_id", roundId);

  if (result === "loss") {
    // 5. For each affected pick, decrement lives and possibly eliminate the pool player
    for (const pick of affectedPicks) {
      const { data: pp } = await admin
        .from("pool_players")
        .select("id, lives_remaining, status")
        .eq("pool_id", pick.pool_id)
        .eq("user_id", pick.user_id)
        .single();

      if (!pp || pp.status === "eliminated" || pp.status === "winner") continue;

      const newLives = Math.max(0, (pp.lives_remaining ?? 1) - 1);
      const newStatus = newLives === 0 ? "eliminated" : pp.status;

      await admin.from("pool_players")
        .update({ lives_remaining: newLives, status: newStatus })
        .eq("id", pp.id);
    }
  } else {
    // Result corrected to win — restore life if it was previously a loss
    for (const pick of affectedPicks) {
      if (pick.result !== "loss") continue; // wasn't previously a loss, skip

      const { data: pp } = await admin
        .from("pool_players")
        .select("id, lives_remaining, lives_purchased, status")
        .eq("pool_id", pick.pool_id)
        .eq("user_id", pick.user_id)
        .single();

      if (!pp) continue;

      const newLives = Math.min(pp.lives_purchased, (pp.lives_remaining ?? 0) + 1);
      const newStatus = pp.status === "eliminated" && newLives > 0 ? "alive" : pp.status;

      await admin.from("pool_players")
        .update({ lives_remaining: newLives, status: newStatus })
        .eq("id", pp.id);
    }
  }

  return {};
}

export async function undoAthleteResult(
  athleteId: string,
  roundId: string
): Promise<{ error?: string }> {
  const admin = db();

  // Find picks for this athlete/round and check if any were losses
  const { data: affectedPicks } = await admin
    .from("picks")
    .select("id, pool_id, user_id, result")
    .eq("athlete_id", athleteId)
    .eq("round_id", roundId);

  // Restore lives for players whose pick was a loss
  for (const pick of (affectedPicks ?? [])) {
    if (pick.result !== "loss") continue;

    const { data: pp } = await admin
      .from("pool_players")
      .select("id, lives_remaining, lives_purchased, status")
      .eq("pool_id", pick.pool_id)
      .eq("user_id", pick.user_id)
      .single();

    if (!pp) continue;

    const newLives = Math.min(pp.lives_purchased, (pp.lives_remaining ?? 0) + 1);
    const newStatus = pp.status === "eliminated" && newLives > 0 ? "alive" : pp.status;

    await admin.from("pool_players")
      .update({ lives_remaining: newLives, status: newStatus })
      .eq("id", pp.id);
  }

  // Clear pick results
  await admin.from("picks")
    .update({ result: null })
    .eq("athlete_id", athleteId)
    .eq("round_id", roundId);

  // Restore athlete to active
  await admin.from("athletes")
    .update({ status: "active", eliminated_in_round: null })
    .eq("id", athleteId);

  // Delete the athlete_result record
  const { error } = await admin.from("athlete_results")
    .delete()
    .eq("athlete_id", athleteId)
    .eq("round_id", roundId);

  if (error) return { error: error.message };
  return {};
}

export async function concludeTournamentPools(
  tournamentId: string
): Promise<void> {
  const admin = db();
  await admin
    .from("pools")
    .update({ status: "concluded" })
    .eq("tournament_id", tournamentId)
    .in("status", ["active", "open"]);
}

export async function concludeTournament(
  tournamentId: string
): Promise<{ error?: string }> {
  const userId = await getAdminUserId();
  if (!userId) return { error: "Not authenticated." };

  const admin = db();

  // Mark any still-active rounds as completed
  await admin
    .from("rounds")
    .update({ status: "completed" })
    .eq("tournament_id", tournamentId)
    .eq("status", "active");

  // Mark tournament as concluded
  const { error } = await admin
    .from("tournaments")
    .update({ status: "concluded" })
    .eq("id", tournamentId);

  if (error) return { error: error.message };

  // Conclude all associated pools
  await concludeTournamentPools(tournamentId);

  // Mark any still-alive players as winners
  const { data: concludedPools } = await admin
    .from("pools")
    .select("id")
    .eq("tournament_id", tournamentId);

  if (concludedPools?.length) {
    for (const pool of concludedPools) {
      await admin
        .from("pool_players")
        .update({ status: "winner" })
        .eq("pool_id", pool.id)
        .eq("status", "alive");
    }
  }

  return {};
}

export async function deleteTournament(
  tournamentId: string
): Promise<{ error?: string }> {
  const admin = db();

  const { count } = await admin
    .from("pools")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if (count && count > 0) {
    return { error: "Cannot delete a tournament that has pools. Delete the pools first." };
  }

  const { error } = await admin
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (error) return { error: error.message };
  return {};
}

export async function notifyRoundResults(
  tournamentId: string,
  roundId: string,
  roundNumber: number
): Promise<{ notified: number; error?: string }> {
  const admin = db();
  const base = appUrl();

  const { data: rounds } = await admin
    .from("rounds")
    .select("round_number")
    .eq("tournament_id", tournamentId);
  const totalRounds = rounds?.length ?? 0;
  const label = roundLabel(roundNumber, totalRounds);

  const { data: pools } = await admin
    .from("pools")
    .select("id, name, slug")
    .eq("tournament_id", tournamentId)
    .in("status", ["active", "concluded"]);

  if (!pools?.length) return { notified: 0 };

  // Notification type is round-scoped so each round notifies independently
  const notifType = `round_notified_${roundId}`;

  let notified = 0;

  for (const pool of pools) {
    // Get all picks with results for this round
    const { data: picks } = await admin
      .from("picks")
      .select("user_id, athlete_id, result, athletes(name), pool_players(status, lives_remaining, lives_purchased, users(username, email))")
      .eq("pool_id", pool.id)
      .eq("round_id", roundId)
      .not("result", "is", null);

    if (!picks?.length) continue;

    // Who's already been notified for this round in this pool
    const { data: existing } = await admin
      .from("notifications")
      .select("user_id")
      .eq("pool_id", pool.id)
      .eq("type", notifType);

    const alreadyNotified = new Set((existing ?? []).map((n: any) => n.user_id as string));

    await Promise.allSettled(
      (picks ?? []).map(async (pick: any) => {
        if (alreadyNotified.has(pick.user_id)) return;
        const playerInfo = pick.pool_players as any;
        const userInfo = playerInfo?.users as any;
        if (!userInfo?.email) return;

        const athleteName = (pick.athletes as any)?.name ?? "your pick";
        const result = pick.result as "win" | "loss";
        const isEliminated = playerInfo?.status === "eliminated";

        await resend.emails.send({
          from: FROM,
          to: userInfo.email,
          subject: `${label} update — ${pool.name}`,
          html: roundResultEmail({
            username: userInfo.username ?? "there",
            poolName: pool.name,
            roundLabel: label,
            pickAthleteName: athleteName,
            result,
            livesRemaining: playerInfo?.lives_remaining ?? 0,
            livesPurchased: playerInfo?.lives_purchased ?? 1,
            isEliminated,
            poolUrl: `${base}/player/${pool.slug}`,
          }),
        });

        await admin.from("notifications").insert({
          user_id: pick.user_id,
          pool_id: pool.id,
          type: notifType,
          title: `${label} result`,
          body: `${athleteName} ${result === "win" ? "won" : "lost"} in ${pool.name}.`,
        });

        notified++;
      })
    );
  }

  return { notified };
}

export async function notifyEliminatedPlayers(
  tournamentId: string
): Promise<{ notified: number; error?: string }> {
  const admin = db();
  const base = appUrl();

  const { data: rounds } = await admin
    .from("rounds")
    .select("round_number")
    .eq("tournament_id", tournamentId);

  const totalRounds = rounds?.length ?? 0;

  const { data: pools } = await admin
    .from("pools")
    .select("id, name, slug")
    .eq("tournament_id", tournamentId)
    .in("status", ["active", "concluded"]);

  if (!pools?.length) return { notified: 0 };

  let notified = 0;

  for (const pool of pools) {
    const { data: eliminatedPlayers } = await admin
      .from("pool_players")
      .select("id, user_id, lives_purchased, users(username, email)")
      .eq("pool_id", pool.id)
      .eq("status", "eliminated");

    if (!eliminatedPlayers?.length) continue;

    const { data: existingNotifs } = await admin
      .from("notifications")
      .select("user_id")
      .eq("pool_id", pool.id)
      .eq("type", "elimination");

    const alreadyNotified = new Set((existingNotifs ?? []).map((n: any) => n.user_id as string));
    const toNotify = eliminatedPlayers.filter((p: any) => !alreadyNotified.has(p.user_id));
    if (!toNotify.length) continue;

    // Find the most recent loss pick for each player (to show which athlete/round caused elimination)
    const { data: lossPicks } = await admin
      .from("picks")
      .select("user_id, athlete_id, result, athletes(name), rounds(round_number)")
      .eq("pool_id", pool.id)
      .eq("result", "loss")
      .in("user_id", toNotify.map((p: any) => p.user_id));

    const lastLossMap = new Map<string, any>();
    for (const pick of lossPicks ?? []) {
      const rn = (pick.rounds as any)?.round_number ?? 0;
      const cur = lastLossMap.get(pick.user_id);
      if (!cur || (cur.rounds as any)?.round_number < rn) lastLossMap.set(pick.user_id, pick);
    }

    await Promise.allSettled(
      toNotify.map(async (player: any) => {
        const userInfo = player.users as any;
        if (!userInfo?.email) return;

        const lastLoss = lastLossMap.get(player.user_id);
        const athleteName = (lastLoss?.athletes as any)?.name ?? "your pick";
        const lossRoundNum = (lastLoss?.rounds as any)?.round_number ?? 1;

        await resend.emails.send({
          from: FROM,
          to: userInfo.email,
          subject: `You've been eliminated from ${pool.name}`,
          html: roundResultEmail({
            username: userInfo.username ?? "there",
            poolName: pool.name,
            roundLabel: roundLabel(lossRoundNum, totalRounds),
            pickAthleteName: athleteName,
            result: "loss",
            livesRemaining: 0,
            livesPurchased: player.lives_purchased ?? 1,
            isEliminated: true,
            poolUrl: `${base}/player/${pool.slug}`,
          }),
        });

        await admin.from("notifications").insert({
          user_id: player.user_id,
          pool_id: pool.id,
          type: "elimination",
          title: "You've been eliminated",
          body: `You've been eliminated from ${pool.name}.`,
        });

        notified++;
      })
    );
  }

  return { notified };
}

export async function notifyRoundComplete(roundId: string) {
  const admin = db();
  const base = appUrl();

  const { data: round } = await admin
    .from("rounds")
    .select("id, round_number, tournament_id, tournaments(num_rounds)")
    .eq("id", roundId)
    .single();

  if (!round) return;

  const totalRounds = (round.tournaments as any)?.num_rounds ?? 0;
  const label = roundLabel(round.round_number, totalRounds);

  const { data: pools } = await admin
    .from("pools")
    .select("id, name, slug")
    .eq("tournament_id", round.tournament_id);

  if (!pools?.length) return;

  const { data: athleteResults } = await admin
    .from("athlete_results")
    .select("athlete_id, result")
    .eq("round_id", roundId);

  const resultMap = new Map(
    (athleteResults ?? []).map((r: any) => [r.athlete_id, r.result])
  );

  for (const pool of pools) {
    const { data: picks } = await admin
      .from("picks")
      .select("user_id, athlete_id, athletes(name), pool_players(status, lives_remaining, lives_purchased, users(username, email))")
      .eq("pool_id", pool.id)
      .eq("round_id", roundId);

    await Promise.allSettled(
      (picks ?? []).map(async (pick: any) => {
        const playerInfo = pick.pool_players as any;
        const userInfo = playerInfo?.users as any;
        if (!userInfo?.email) return;

        const athleteName = (pick.athletes as any)?.name ?? "?";
        const result = resultMap.get(pick.athlete_id) as "win" | "loss" | undefined;
        if (!result) return;

        const livesRemaining = playerInfo?.lives_remaining ?? 0;
        const livesPurchased = playerInfo?.lives_purchased ?? 1;
        const isEliminated = playerInfo?.status === "eliminated";

        await resend.emails.send({
          from: FROM,
          to: userInfo.email,
          subject: `${label} results — ${pool.name}`,
          html: roundResultEmail({
            username: userInfo.username ?? "there",
            poolName: pool.name,
            roundLabel: label,
            pickAthleteName: athleteName,
            result,
            livesRemaining,
            livesPurchased,
            isEliminated,
            poolUrl: `${base}/player/${pool.slug}`,
          }),
        });
      })
    );
  }
}

export async function notifyPickReminder(roundId: string) {
  const admin = db();
  const base = appUrl();

  const { data: round } = await admin
    .from("rounds")
    .select("id, round_number, lock_deadline, tournament_id, tournaments(num_rounds)")
    .eq("id", roundId)
    .single();

  if (!round?.lock_deadline) return;

  const totalRounds = (round.tournaments as any)?.num_rounds ?? 0;
  const label = roundLabel(round.round_number, totalRounds);
  const deadline = new Date(round.lock_deadline).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
    timeZoneName: "short",
  });

  const { data: pools } = await admin
    .from("pools")
    .select("id, name, slug")
    .eq("tournament_id", round.tournament_id)
    .eq("status", "active");

  if (!pools?.length) return;

  for (const pool of pools) {
    const { data: poolPlayers } = await admin
      .from("pool_players")
      .select("user_id, users(username, email)")
      .eq("pool_id", pool.id)
      .eq("status", "alive");

    const { data: existingPicks } = await admin
      .from("picks")
      .select("user_id")
      .eq("pool_id", pool.id)
      .eq("round_id", roundId);

    const pickedUserIds = new Set((existingPicks ?? []).map((p: any) => p.user_id));

    const needsReminder = (poolPlayers ?? []).filter(
      (pp: any) => !pickedUserIds.has(pp.user_id)
    );

    await Promise.allSettled(
      needsReminder.map(async (pp: any) => {
        const user = pp.users as any;
        if (!user?.email) return;
        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: `Reminder: place your pick for ${label} — ${pool.name}`,
          html: pickReminderEmail({
            username: user.username ?? "there",
            poolName: pool.name,
            roundLabel: label,
            lockDeadline: deadline,
            pickUrl: `${base}/player/${pool.slug}/placepick`,
          }),
        });
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Sofascore search + connection
// ---------------------------------------------------------------------------

export async function searchSofascoreTournaments(
  query: string
): Promise<{ results: Array<{ id: number; name: string; category: string }>; error?: string }> {
  try {
    const res = await fetch(
      `https://api.sofascore.com/api/v1/search/all?q=${encodeURIComponent(query)}&page=0`,
      { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
    );
    if (!res.ok) return { results: [], error: `Sofascore returned ${res.status}` };
    const json = await res.json();
    const results = (json.results ?? [])
      .filter((r: any) => r.type === "uniqueTournament")
      .map((r: any) => ({
        id: r.entity.id as number,
        name: r.entity.name as string,
        category: (r.entity.category?.name ?? "") as string,
      }))
      .slice(0, 8);
    return { results };
  } catch (e: any) {
    return { results: [], error: String(e.message ?? e) };
  }
}

export async function fetchSofascoreSeasonsForTournament(
  tournamentId: string
): Promise<{ seasons: Array<{ id: number; name: string }>; error?: string }> {
  try {
    const res = await fetch(
      `https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/seasons`,
      { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
    );
    if (!res.ok) return { seasons: [], error: `Sofascore returned ${res.status}` };
    const json = await res.json();
    const seasons = (json.seasons ?? [])
      .map((s: any) => ({ id: s.id as number, name: s.name as string }))
      .slice(0, 10);
    return { seasons };
  } catch (e: any) {
    return { seasons: [], error: String(e.message ?? e) };
  }
}

export async function saveOddsApiSportKey(
  tournamentId: string,
  sportKey: string | null
): Promise<{ error?: string }> {
  const userId = await getAdminUserId();
  if (!userId) return { error: "Not authenticated." };
  const admin = db();
  const { error } = await admin
    .from("tournaments")
    .update({ odds_api_sport_key: sportKey })
    .eq("id", tournamentId);
  return error ? { error: error.message } : {};
}

export async function saveSofascoreConnection(
  tournamentId: string,
  sofascoreTId: string,
  sofascoreSeasonId: string
): Promise<{ error?: string }> {
  const userId = await getAdminUserId();
  if (!userId) return { error: "Not authenticated." };
  const admin = db();
  const { error } = await admin
    .from("tournaments")
    .update({ sofascore_tournament_id: sofascoreTId, sofascore_season_id: sofascoreSeasonId })
    .eq("id", tournamentId);
  return error ? { error: error.message } : {};
}

export async function importAthletesFromSofascore(
  tournamentId: string,
  sofascoreTId: string,
  sofascoreSeasonId: string
): Promise<{ imported: number; error?: string }> {
  const userId = await getAdminUserId();
  if (!userId) return { imported: 0, error: "Not authenticated." };
  const admin = db();

  try {
    // Fetch enough pages to cover the whole draw
    const events = await fetchSofascorePages(sofascoreTId, sofascoreSeasonId, 6);

    // Collect unique players with seeds. Prefer the seed from the lowest-numbered round
    // (earliest round = the round they were seeded into).
    const playerMap = new Map<string, { name: string; seed: number }>();

    for (const e of events) {
      for (const [nameKey, seedKey] of [
        ["homeTeam", "homeTeamSeed"],
        ["awayTeam", "awayTeamSeed"],
      ] as const) {
        const name: string | undefined = e[nameKey]?.name;
        if (!name) continue;
        const sfSeed: string | undefined = e[seedKey];
        const seed = sfSeed && /^\d+$/.test(sfSeed) ? parseInt(sfSeed) : 999;
        if (!playerMap.has(name) || seed < playerMap.get(name)!.seed) {
          playerMap.set(name, { name, seed });
        }
      }
    }

    if (playerMap.size === 0) {
      return { imported: 0, error: "No players found. Check tournament/season IDs." };
    }

    const payload = Array.from(playerMap.values()).map(p => ({
      tournament_id: tournamentId,
      name: p.name,
      seed: p.seed,
      has_bye: false,
      status: "active",
    }));

    const { error } = await admin
      .from("athletes")
      .upsert(payload, { onConflict: "tournament_id,name" });

    return error ? { imported: 0, error: error.message } : { imported: payload.length };
  } catch (e: any) {
    return { imported: 0, error: String(e.message ?? e) };
  }
}

// ---------------------------------------------------------------------------
// Sofascore sync
// ---------------------------------------------------------------------------

const SF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://www.sofascore.com/",
};

async function fetchSofascorePages(tId: string, seasonId: string, pages = 8): Promise<any[]> {
  const results = await Promise.allSettled(
    Array.from({ length: pages }, (_, i) =>
      fetch(
        `https://api.sofascore.com/api/v1/unique-tournament/${tId}/season/${seasonId}/events/last/${i}`,
        { headers: SF_HEADERS }
      ).then(r => r.ok ? r.json() : null)
    )
  );
  return results
    .filter(r => r.status === "fulfilled" && Array.isArray((r as any).value?.events))
    .flatMap(r => (r as any).value.events as any[]);
}

export async function fetchSofascoreRounds(
  sofascoreTId: string,
  sofascoreSeasonId: string
): Promise<{ rounds: Array<{ name: string; count: number }>; total: number; statuses: string[]; error?: string }> {
  try {
    const events = await fetchSofascorePages(sofascoreTId, sofascoreSeasonId);
    // Use winnerCode as the "match decided" signal — more reliable than status.type across all match endings
    const decided = events.filter(e => e.winnerCode === 1 || e.winnerCode === 2);
    const statuses = Array.from(new Set(events.map(e => e.status?.type ?? "unknown")));
    const counts = new Map<string, number>();
    for (const e of decided) {
      const name = e.roundInfo?.name ?? "Unknown";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const rounds = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return { rounds, total: events.length, statuses };
  } catch (e: any) {
    return { rounds: [], total: 0, statuses: [], error: String(e.message ?? e) };
  }
}

export async function syncRoundResultsFromSofascore(
  roundId: string,
  roundNumber: number,
  tournamentId: string,
  sofascoreTId: string,
  sofascoreSeasonId: string,
  sofascoreRoundName: string
): Promise<{ synced: number; unmatched: string[]; skipped: number; error?: string }> {
  const userId = await getAdminUserId();
  if (!userId) return { synced: 0, unmatched: [], skipped: 0, error: "Not authenticated." };

  const admin = db();

  try {
    const events = await fetchSofascorePages(sofascoreTId, sofascoreSeasonId);
    const targetEvents = events.filter(
      e => (e.winnerCode === 1 || e.winnerCode === 2) && e.roundInfo?.name === sofascoreRoundName
    );

    if (targetEvents.length === 0) {
      return { synced: 0, unmatched: [], skipped: 0, error: `No decided matches found for "${sofascoreRoundName}".` };
    }

    const { data: athletes } = await admin
      .from("athletes")
      .select("id, name")
      .eq("tournament_id", tournamentId);

    const { data: existingResults } = await admin
      .from("athlete_results")
      .select("athlete_id")
      .eq("round_id", roundId);
    const existingAthleteIds = new Set((existingResults ?? []).map((r: any) => r.athlete_id as string));

    // For rounds beyond the first, only process athletes who advanced from the previous round.
    let eligibleAthleteIds: Set<string> | null = null;
    if (roundNumber > 1) {
      const { data: prevRound } = await admin
        .from("rounds")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("round_number", roundNumber - 1)
        .maybeSingle();
      const [{ data: prevWinners }, { data: byeAthletes }] = await Promise.all([
        prevRound
          ? admin.from("athlete_results").select("athlete_id").eq("round_id", prevRound.id).eq("result", "win")
          : Promise.resolve({ data: [] as any[] }),
        roundNumber === 2
          ? admin.from("athletes").select("id").eq("tournament_id", tournamentId).eq("has_bye", true)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      eligibleAthleteIds = new Set([
        ...(prevWinners ?? []).map((r: any) => r.athlete_id as string),
        ...(byeAthletes ?? []).map((a: any) => a.id as string),
      ]);
    }

    let synced = 0;
    let skipped = 0;
    const unmatched: string[] = [];

    const athleteList = athletes ?? [];
    for (const event of targetEvents) {
      const winnerName: string = event.winnerCode === 1 ? event.homeTeam?.name : event.awayTeam?.name;
      const loserName: string = event.winnerCode === 1 ? event.awayTeam?.name : event.homeTeam?.name;
      if (!winnerName || !loserName) continue;

      const winnerAthlete = findAthlete(winnerName, athleteList);
      const loserAthlete = findAthlete(loserName, athleteList);

      if (!winnerAthlete) { unmatched.push(winnerName); continue; }
      if (eligibleAthleteIds) {
        if (!loserAthlete || !eligibleAthleteIds.has(winnerAthlete.id) || !eligibleAthleteIds.has(loserAthlete.id)) continue;
      }

      const sfPairs: [string, typeof winnerAthlete | undefined, "win" | "loss"][] = [
        [winnerName, winnerAthlete, "win"],
        [loserName, loserAthlete, "loss"],
      ];
      for (const [sfName, athlete, result] of sfPairs) {
        if (!athlete) { if (result === "win") unmatched.push(sfName); continue; }
        if (existingAthleteIds.has(athlete.id)) { skipped++; continue; }
        const { error } = await processAthleteResult(athlete.id, roundId, result, roundNumber);
        if (!error) { existingAthleteIds.add(athlete.id); synced++; }
      }
    }

    await activateNextRoundIfNeeded(admin, tournamentId, roundId, roundNumber);
    return { synced, unmatched: Array.from(new Set(unmatched)), skipped };
  } catch (e: any) {
    return { synced: 0, unmatched: [], skipped: 0, error: String(e.message ?? e) };
  }
}

export async function syncRoundAuto(
  roundId: string,
  roundNumber: number,
  tournamentId: string,
  sofascoreTId: string,
  sofascoreSeasonId: string
): Promise<{ synced: number; unmatched: string[]; skipped: number; sofascoreRoundName?: string; error?: string }> {
  const { rounds, total, statuses, error: fetchErr } = await fetchSofascoreRounds(sofascoreTId, sofascoreSeasonId);
  if (fetchErr) return { synced: 0, unmatched: [], skipped: 0, error: fetchErr };
  if (!rounds.length) {
    const detail = total === 0
      ? "Sofascore returned 0 events — the request may be blocked or the IDs are wrong."
      : `Fetched ${total} events but none had a winner yet (statuses seen: ${statuses.join(", ")}).`;
    return { synced: 0, unmatched: [], skipped: 0, error: detail };
  }

  // Rounds sorted by match count desc = earliest round first (64 → 32 → 16 → …)
  const sorted = [...rounds].sort((a, b) => b.count - a.count);
  const target = sorted[roundNumber - 1];
  if (!target) {
    return { synced: 0, unmatched: [], skipped: 0, error: `Round ${roundNumber} results not yet available on Sofascore.` };
  }

  const res = await syncRoundResultsFromSofascore(
    roundId, roundNumber, tournamentId, sofascoreTId, sofascoreSeasonId, target.name
  );
  return { ...res, sofascoreRoundName: target.name };
}

// Takes events already fetched client-side (avoids server IP blocking by Sofascore)
export async function processSofascoreEvents(
  roundId: string,
  roundNumber: number,
  tournamentId: string,
  rawEvents: any[]
): Promise<{ synced: number; unmatched: string[]; skipped: number; sofascoreRoundName?: string; error?: string }> {
  const userId = await getAdminUserId();
  if (!userId) return { synced: 0, unmatched: [], skipped: 0, error: "Not authenticated." };

  const admin = db();

  const decided = rawEvents.filter(e => e.winnerCode === 1 || e.winnerCode === 2);
  if (!decided.length) {
    return { synced: 0, unmatched: [], skipped: 0, error: `No decided matches in the ${rawEvents.length} events received.` };
  }

  // Pick the right round by position: sort rounds by match count desc (most = earliest)
  const counts = new Map<string, number>();
  for (const e of decided) {
    const name = e.roundInfo?.name ?? "Unknown";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const sorted = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const target = sorted[roundNumber - 1];
  if (!target) {
    const available = sorted.map(r => `${r.name} (${r.count})`).join(", ");
    return { synced: 0, unmatched: [], skipped: 0, error: `Round ${roundNumber} not found. Available: ${available}` };
  }

  const targetEvents = decided.filter(e => e.roundInfo?.name === target.name);

  const { data: athletes } = await admin.from("athletes").select("id, name").eq("tournament_id", tournamentId);
  const { data: existingResults } = await admin.from("athlete_results").select("athlete_id").eq("round_id", roundId);
  const existingAthleteIds = new Set((existingResults ?? []).map((r: any) => r.athlete_id as string));

  // For rounds beyond the first, only process athletes who advanced from the previous round.
  let eligibleAthleteIds: Set<string> | null = null;
  if (roundNumber > 1) {
    const { data: prevRound } = await admin
      .from("rounds")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("round_number", roundNumber - 1)
      .maybeSingle();
    const [{ data: prevWinners }, { data: byeAthletes }] = await Promise.all([
      prevRound
        ? admin.from("athlete_results").select("athlete_id").eq("round_id", prevRound.id).eq("result", "win")
        : Promise.resolve({ data: [] as any[] }),
      roundNumber === 2
        ? admin.from("athletes").select("id").eq("tournament_id", tournamentId).eq("has_bye", true)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    eligibleAthleteIds = new Set([
      ...(prevWinners ?? []).map((r: any) => r.athlete_id as string),
      ...(byeAthletes ?? []).map((a: any) => a.id as string),
    ]);
  }

  const athleteList = athletes ?? [];
  let synced = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const event of targetEvents) {
    const winnerName: string = event.winnerCode === 1 ? event.homeTeam?.name : event.awayTeam?.name;
    const loserName: string = event.winnerCode === 1 ? event.awayTeam?.name : event.homeTeam?.name;
    if (!winnerName || !loserName) continue;

    const winnerAthlete = findAthlete(winnerName, athleteList);
    const loserAthlete = findAthlete(loserName, athleteList);

    if (!winnerAthlete) { unmatched.push(winnerName); continue; }
    if (eligibleAthleteIds) {
      if (!loserAthlete || !eligibleAthleteIds.has(winnerAthlete.id) || !eligibleAthleteIds.has(loserAthlete.id)) continue;
    }

    const sfPairs2: [string, typeof winnerAthlete | undefined, "win" | "loss"][] = [
      [winnerName, winnerAthlete, "win"],
      [loserName, loserAthlete, "loss"],
    ];
    for (const [sfName, athlete, result] of sfPairs2) {
      if (!athlete) { if (result === "win") unmatched.push(sfName); continue; }
      if (existingAthleteIds.has(athlete.id)) { skipped++; continue; }
      const { error } = await processAthleteResult(athlete.id, roundId, result, roundNumber);
      if (!error) { existingAthleteIds.add(athlete.id); synced++; }
    }
  }

  await activateNextRoundIfNeeded(admin, tournamentId, roundId, roundNumber);
  return { synced, unmatched: Array.from(new Set(unmatched)), skipped, sofascoreRoundName: target.name };
}

export async function syncRoundFromOddsApi(
  roundId: string,
  roundNumber: number,
  tournamentId: string,
  sportKey: string
): Promise<{ synced: number; unmatched: string[]; skipped: number; needsManual: string[]; blockedByEligibility: string[]; error?: string }> {
  const userId = await getAdminUserId();
  if (!userId) return { synced: 0, unmatched: [], skipped: 0, needsManual: [], blockedByEligibility: [], error: "Not authenticated." };

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return { synced: 0, unmatched: [], skipped: 0, needsManual: [], blockedByEligibility: [], error: "ODDS_API_KEY not configured." };

  const res = await fetch(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=3`
  );
  if (!res.ok) {
    return { synced: 0, unmatched: [], skipped: 0, needsManual: [], blockedByEligibility: [], error: `Odds API returned ${res.status}` };
  }

  const events: any[] = await res.json();
  const completed = events.filter(e => e.completed === true);

  if (!completed.length) {
    const inProgress = events.filter(e => e.completed === false).length;
    const detail = events.length === 0
      ? "Odds API returned 0 events — sport key may be wrong or tournament not yet listed."
      : `Odds API returned ${events.length} events (${inProgress} in progress, 0 completed) — scores may not be finalised yet.`;
    return { synced: 0, unmatched: [], skipped: 0, needsManual: [], blockedByEligibility: [], error: detail };
  }

  const admin = db();

  const { data: athletes } = await admin.from("athletes").select("id, name").eq("tournament_id", tournamentId).neq("status", "inactive");
  const { data: existingResults } = await admin.from("athlete_results").select("athlete_id").eq("round_id", roundId);
  const existingAthleteIds = new Set((existingResults ?? []).map((r: any) => r.athlete_id as string));

  // For rounds beyond the first, only record results for athletes who actually advanced.
  // This prevents Round 1 events (still in the daysFrom window) from being applied to Round 2.
  let eligibleAthleteIds: Set<string> | null = null;
  if (roundNumber > 1) {
    const { data: prevRound } = await admin
      .from("rounds")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("round_number", roundNumber - 1)
      .maybeSingle();

    const [{ data: prevWinners }, { data: byeAthletes }] = await Promise.all([
      prevRound
        ? admin.from("athlete_results").select("athlete_id").eq("round_id", prevRound.id).eq("result", "win")
        : Promise.resolve({ data: [] as any[] }),
      roundNumber === 2
        ? admin.from("athletes").select("id").eq("tournament_id", tournamentId).eq("has_bye", true)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    eligibleAthleteIds = new Set([
      ...(prevWinners ?? []).map((r: any) => r.athlete_id as string),
      ...(byeAthletes ?? []).map((a: any) => a.id as string),
    ]);
  }

  const athleteList = athletes ?? [];
  let synced = 0;
  let skipped = 0;
  const unmatched: string[] = [];
  const needsManual: string[] = [];
  const blockedByEligibility: string[] = [];

  for (const event of completed) {
    const scores: Array<{ name: string; score: string }> = event.scores ?? [];
    if (scores.length !== 2) continue;
    const [a, b] = scores;

    // Null/missing scores mean the API has no score data for this match — skip silently
    if (a.score == null || b.score == null) continue;

    const aScore = parseFloat(a.score);
    const bScore = parseFloat(b.score);

    // NaN scores (malformed data) — skip silently
    if (isNaN(aScore) || isNaN(bScore)) continue;

    // Equal scores = likely walkover or retirement (can't determine winner automatically).
    // Show the actual API scores so the cause is visible.
    if (aScore === bScore) {
      const athA = findAthlete(a.name, athleteList);
      const athB = findAthlete(b.name, athleteList);
      const bothKnown = athA && athB;
      const neitherRecorded = !existingAthleteIds.has(athA?.id ?? "") && !existingAthleteIds.has(athB?.id ?? "");
      if (bothKnown && neitherRecorded) needsManual.push(`${a.name} vs ${b.name} (API scores: ${a.score}-${b.score})`);
      continue;
    }

    const winnerName = aScore > bScore ? a.name : b.name;
    const loserName = aScore > bScore ? b.name : a.name;

    const winnerAthlete = findAthlete(winnerName, athleteList);
    const loserAthlete = findAthlete(loserName, athleteList);

    if (!winnerAthlete) { unmatched.push(winnerName); continue; }
    if (eligibleAthleteIds) {
      if (!loserAthlete || !eligibleAthleteIds.has(winnerAthlete.id) || !eligibleAthleteIds.has(loserAthlete.id)) {
        if (winnerAthlete && loserAthlete) blockedByEligibility.push(`${winnerName} def. ${loserName}`);
        continue;
      }
    }

    const odsPairs: [string, typeof winnerAthlete | undefined, "win" | "loss"][] = [
      [winnerName, winnerAthlete, "win"],
      [loserName, loserAthlete, "loss"],
    ];
    for (const [sfName, athlete, result] of odsPairs) {
      if (!athlete) { if (result === "win") unmatched.push(sfName); continue; }
      if (existingAthleteIds.has(athlete.id)) { skipped++; continue; }
      const { error } = await processAthleteResult(athlete.id, roundId, result, roundNumber);
      if (!error) { existingAthleteIds.add(athlete.id); synced++; }
    }
  }

  await activateNextRoundIfNeeded(admin, tournamentId, roundId, roundNumber);
  return { synced, unmatched: Array.from(new Set(unmatched)), skipped, needsManual: Array.from(new Set(needsManual)), blockedByEligibility: Array.from(new Set(blockedByEligibility)) };
}
