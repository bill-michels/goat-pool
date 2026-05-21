import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import PoolsClient from "./PoolsClient";

export default async function PoolsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pools } = await admin
    .from("pools")
    .select("id, name, slug, fee_per_life, tournaments(name), pool_players(count)")
    .eq("allow_join_requests", true)
    .eq("status", "active")
    .order("name");

  // If user is logged in, fetch their existing requests and memberships
  const myRequestPoolIds = new Set<string>();
  const myMemberPoolIds = new Set<string>();

  if (user) {
    const [{ data: requests }, { data: memberships }] = await Promise.all([
      admin.from("join_requests").select("pool_id").eq("user_id", user.id),
      admin.from("pool_players").select("pool_id").eq("user_id", user.id),
    ]);
    (requests ?? []).forEach((r: any) => myRequestPoolIds.add(r.pool_id));
    (memberships ?? []).forEach((m: any) => myMemberPoolIds.add(m.pool_id));
  }

  const poolList = (pools ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    feePerLife: p.fee_per_life ?? 0,
    tournamentName: (p.tournaments as any)?.name ?? "—",
    playerCount: p.pool_players?.[0]?.count ?? 0,
    hasRequested: myRequestPoolIds.has(p.id),
    isMember: myMemberPoolIds.has(p.id),
  }));

  return <PoolsClient pools={poolList} isLoggedIn={!!user} />;
}
