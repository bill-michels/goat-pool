import type { Metadata } from "next";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Goat Pool — Tennis Survivor Pools",
  description:
    "Run a tennis survivor pool with your friends. Pick an athlete each round — lose a life if they lose. Last one standing wins.",
  openGraph: {
    title: "Goat Pool — Tennis Survivor Pools",
    description:
      "Run a tennis survivor pool with your friends. Pick an athlete each round — lose a life if they lose. Last one standing wins.",
    url: "https://goat-pool.com",
    siteName: "Goat Pool",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goat Pool — Tennis Survivor Pools",
    description:
      "Run a tennis survivor pool with your friends. Pick an athlete each round — lose a life if they lose. Last one standing wins.",
  },
};

export default async function HomePage() {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: pools }, { data: tournaments }] = await Promise.all([
    admin
      .from("pools")
      .select("id, name, slug, fee_per_life, tournaments(name), pool_players(count)")
      .eq("allow_join_requests", true)
      .eq("status", "active")
      .order("name"),
    admin
      .from("tournaments")
      .select("id, name, num_rounds, status, pools(count)")
      .in("status", ["upcoming", "active"])
      .order("name"),
  ]);

  const openPools = (pools ?? []).map((p: any) => ({
    id: p.id as string,
    name: p.name as string,
    slug: p.slug as string,
    feePerLife: (p.fee_per_life ?? 0) as number,
    tournamentName: ((p.tournaments as any)?.name ?? "—") as string,
    playerCount: (p.pool_players?.[0]?.count ?? 0) as number,
  }));

  const activeTournaments = (tournaments ?? []).map((t: any) => ({
    id: t.id as string,
    name: t.name as string,
    numRounds: (t.num_rounds ?? 0) as number,
    status: t.status as string,
    poolCount: (t.pools?.[0]?.count ?? 0) as number,
  }));

  return <HomeClient openPools={openPools} activeTournaments={activeTournaments} />;
}
