"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resend, FROM, appUrl } from "@/lib/resend";
import { roundResultEmail, pickReminderEmail } from "@/lib/emails";

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
