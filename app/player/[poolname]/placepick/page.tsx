import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import PlacePickClient from "./PlacePickClient";

const c = { cream: "#F5F3EF", white: "#FFFFFF", charcoal: "#2D2D2D", gray: "#6B7280", grayLight: "#E5E7EB" };

export default async function PlacePickPage({ params }: { params: { poolname: string } }) {
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
      .select("id, name, slug, status, tournament_id, tournaments(id, name, num_rounds)")
      .eq("slug", params.poolname)
      .single(),
  ]);

  if (!pool) redirect("/player");

  const tournament = pool.tournaments as any;
  const tournamentId = tournament?.id ?? pool.tournament_id;
  const totalRounds = tournament?.num_rounds ?? 0;

  const { data: membership } = await adminClient
    .from("pool_players")
    .select("id, status, lives_purchased, lives_remaining")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.status !== "alive") redirect(`/player/${pool.slug}`);

  const { data: activeRound } = await adminClient
    .from("rounds")
    .select("id, round_number, status, lock_deadline")
    .eq("tournament_id", tournamentId)
    .eq("status", "active")
    .maybeSingle();

  if (!activeRound) {
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: c.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ backgroundColor: c.white, borderRadius: "20px", padding: "40px", border: `1px solid ${c.grayLight}`, textAlign: "center", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: c.charcoal, margin: "0 0 8px" }}>No Active Round</h1>
          <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 20px" }}>Picks aren&apos;t open yet. Check back when the next round starts.</p>
          <a href={`/player/${pool.slug}`} style={{ display: "inline-block", padding: "10px 20px", borderRadius: "10px", background: "#4A7C59", color: c.white, fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
            Back to Pool
          </a>
        </div>
      </div>
    );
  }

  const [{ data: userPicks }, { data: athletes }] = await Promise.all([
    adminClient.from("picks").select("id, round_id, athlete_id").eq("pool_id", pool.id).eq("user_id", user.id),
    adminClient
      .from("athletes")
      .select("id, name, seed, has_bye")
      .eq("tournament_id", tournamentId)
      .eq("status", "active")
      .order("seed"),
  ]);

  const previousPickAthleteIds = new Set(
    (userPicks ?? [])
      .filter(p => p.round_id !== activeRound.id)
      .map(p => p.athlete_id)
  );

  const existingPickForRound = (userPicks ?? []).find(p => p.round_id === activeRound.id) ?? null;

  const availableAthletes = (athletes ?? []).filter((a: any) => {
    if (previousPickAthleteIds.has(a.id)) return false;
    if (activeRound.round_number === 1 && a.has_bye) return false;
    return true;
  });

  const previousPickNames = (userPicks ?? [])
    .filter(p => p.round_id !== activeRound.id)
    .map(p => {
      const a = (athletes ?? []).find((a: any) => a.id === p.athlete_id);
      return (a as any)?.name ?? "?";
    });

  return (
    <PlacePickClient
      username={userData?.username ?? "?"}
      isCommissioner={userData?.role === "commissioner" || userData?.role === "admin"}
      pool={{ id: pool.id, name: pool.name, slug: pool.slug }}
      activeRound={{
        id: activeRound.id,
        roundNumber: activeRound.round_number,
        lockDeadline: activeRound.lock_deadline,
        totalRounds,
      }}
      membership={{
        livesRemaining: membership.lives_remaining,
        livesPurchased: membership.lives_purchased,
      }}
      athletes={availableAthletes.map((a: any) => ({ id: a.id, name: a.name, seed: a.seed }))}
      previousPickNames={previousPickNames}
      existingPickId={existingPickForRound?.id ?? null}
      existingPickAthleteId={existingPickForRound?.athlete_id ?? null}
    />
  );
}
