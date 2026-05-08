"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { resend, FROM, appUrl } from "@/lib/resend";
import { roundResultEmail, pickReminderEmail } from "@/lib/emails";

const db = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

function roundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "SF";
  if (fromEnd === 2) return "QF";
  return `Round ${roundNumber}`;
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
