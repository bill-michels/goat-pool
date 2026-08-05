import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import TournamentSetupClient from "./TournamentSetupClient";

export default async function TournamentSetupPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: userData } = await adminClient
    .from("users")
    .select("username, role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") redirect("/player/dash");

  let tournament = null;
  let rounds: any[] = [];
  let athletes: any[] = [];

  if (searchParams.id) {
    const [{ data: t }, { data: r }, { data: a }] = await Promise.all([
      adminClient.from("tournaments").select("*").eq("id", searchParams.id).single(),
      adminClient.from("rounds").select("*").eq("tournament_id", searchParams.id).order("round_number"),
      adminClient.from("athletes").select("*").eq("tournament_id", searchParams.id).neq("status", "inactive").order("seed"),
    ]);
    tournament = t;
    rounds = r ?? [];
    athletes = a ?? [];
  }

  return (
    <TournamentSetupClient
      userId={user.id}
      username={userData?.username ?? "A"}
      initialTournament={tournament}
      initialRounds={rounds}
      initialAthletes={athletes}
    />
  );
}
