import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import AdminNav from "./AdminNav";

const c = {
  green: "#4A7C59",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  grayLighter: "#F3F4F6",
  amber: "#D97706",
  amberMuted: "#FEF3C7",
  red: "#EF4444",
};

function StatBox({
  label,
  items,
}: {
  label: string;
  items: { value: string | number; sub: string; accent?: string }[];
}) {
  return (
    <div style={{
      backgroundColor: c.white, borderRadius: "14px", padding: "20px 24px",
      border: `1px solid ${c.grayLight}`, flex: 1,
    }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: c.gray, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {label}
      </p>
      <div style={{ display: "flex", gap: "24px" }}>
        {items.map((item) => (
          <div key={item.sub}>
            <p style={{ fontSize: "28px", fontWeight: 800, color: item.accent ?? c.charcoal, margin: "0 0 2px", letterSpacing: "-0.8px", lineHeight: 1 }}>
              {item.value}
            </p>
            <p style={{ fontSize: "12px", color: c.gray, margin: 0 }}>{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: "0 0 16px" }}>
      {title}
    </h2>
  );
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === "active";
  const isOpen = status === "open";
  const isConcluded = status === "concluded";
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
      display: "inline-block",
      backgroundColor: isActive || isOpen ? c.greenMuted : isConcluded ? c.grayLighter : c.amberMuted,
      color: isActive || isOpen ? c.green : isConcluded ? c.gray : c.amber,
    }}>
      {isActive ? "Active" : isOpen ? "Open" : isConcluded ? "Concluded" : "Upcoming"}
    </span>
  );
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: userData },
    { count: totalUsers },
    { data: liveTournaments },
    { data: concludedTournaments },
    { data: livePools },
    { data: concludedPools },
    { data: paymentsData },
    { data: payoutsData },
  ] = await Promise.all([
    admin.from("users").select("username, role").eq("id", user.id).single(),
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("tournaments")
      .select("id, name, num_rounds, status")
      .in("status", ["upcoming", "active"])
      .order("created_at", { ascending: false }),
    admin.from("tournaments")
      .select("id, name, status")
      .eq("status", "concluded")
      .order("created_at", { ascending: false }),
    admin.from("pools")
      .select("id, name, slug, status, tournament_id, tournaments(name), users!pools_commissioner_id_fkey(username), pool_players(count), payments(amount)")
      .in("status", ["active", "open"])
      .order("created_at", { ascending: false }),
    admin.from("pools")
      .select("id, name, slug, status, tournament_id, tournaments(name), users!pools_commissioner_id_fkey(username), pool_players(count), payments(amount)")
      .eq("status", "concluded")
      .order("created_at", { ascending: false }),
    admin.from("payments").select("amount").eq("status", "completed"),
    admin.from("payouts").select("platform_amount").eq("status", "completed"),
  ]);

  if (userData?.role !== "admin") redirect("/player/dash");

  const totalFees = (paymentsData ?? []).reduce((sum, p) => sum + p.amount, 0);
  const platformRevenue = (payoutsData ?? []).reduce((sum, p) => sum + p.platform_amount, 0);

  const liveTournamentCount = liveTournaments?.length ?? 0;
  const concludedTournamentCount = concludedTournaments?.length ?? 0;
  const livePoolCount = livePools?.length ?? 0;
  const concludedPoolCount = concludedPools?.length ?? 0;

  const usersInActivePools = (livePools ?? []).reduce(
    (sum, pool: any) => sum + (pool.pool_players?.[0]?.count ?? 0),
    0
  );

  // Fetch pool lists for live tournaments
  const liveTournamentIds = (liveTournaments ?? []).map((t) => t.id);
  let tournamentPoolMap: Record<string, any[]> = {};
  if (liveTournamentIds.length > 0) {
    const { data: tPools } = await admin
      .from("pools")
      .select("id, name, tournament_id, users!pools_commissioner_id_fkey(username), pool_players(count), payments(amount), status")
      .in("tournament_id", liveTournamentIds);
    for (const pool of tPools ?? []) {
      if (!tournamentPoolMap[pool.tournament_id]) tournamentPoolMap[pool.tournament_id] = [];
      tournamentPoolMap[pool.tournament_id].push(pool);
    }
  }

  const poolFees = (pool: any) =>
    ((pool.payments ?? []) as any[]).reduce((s: number, p: any) => s + p.amount, 0);
  const poolPlayers = (pool: any) => pool.pool_players?.[0]?.count ?? 0;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      <AdminNav username={userData?.username ?? "A"} />

      <div style={{ maxWidth: "1040px", margin: "0 auto", padding: "40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: "15px", color: c.gray, margin: 0 }}>Platform overview and management.</p>
          </div>
          <Link href="/admin/tournamentsetup" style={{
            padding: "10px 20px", borderRadius: "10px", border: "none",
            background: c.green, color: c.white, fontSize: "14px", fontWeight: 600,
            cursor: "pointer", textDecoration: "none",
          }}>
            + New Tournament
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          <StatBox
            label="Users"
            items={[
              { value: totalUsers ?? 0, sub: "Total" },
              { value: usersInActivePools, sub: "In active pools", accent: c.green },
            ]}
          />
          <StatBox
            label="Tournaments"
            items={[
              { value: liveTournamentCount, sub: "Live / Upcoming", accent: liveTournamentCount > 0 ? c.green : c.charcoal },
              { value: concludedTournamentCount, sub: "Concluded" },
            ]}
          />
          <StatBox
            label="Pools"
            items={[
              { value: livePoolCount, sub: "Live", accent: livePoolCount > 0 ? c.green : c.charcoal },
              { value: concludedPoolCount, sub: "Concluded" },
            ]}
          />
          <StatBox
            label="Total Fees Collected"
            items={[
              { value: totalFees > 0 ? `$${(totalFees / 100).toFixed(0)}` : "$0", sub: "All time" },
            ]}
          />
          <StatBox
            label="Platform Revenue"
            items={[
              { value: platformRevenue > 0 ? `$${(platformRevenue / 100).toFixed(0)}` : "$0", sub: "After commissioner cuts", accent: c.green },
            ]}
          />
        </div>

        {/* Live / Upcoming Tournaments */}
        <div style={{ marginBottom: "40px" }}>
          <SectionHeader title="Live or Upcoming Tournaments" />
          {liveTournaments && liveTournaments.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {liveTournaments.map((t) => {
                const pools = tournamentPoolMap[t.id] ?? [];
                return (
                  <div key={t.id} style={{ backgroundColor: c.white, borderRadius: "14px", padding: "24px", border: `1px solid ${c.grayLight}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: pools.length > 0 ? "20px" : "0" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <h3 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: 0 }}>{t.name}</h3>
                          <StatusPill status={t.status} />
                        </div>
                        <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>{t.num_rounds} rounds</p>
                      </div>
                      <Link href={`/admin/tournamentsetup?id=${t.id}`} style={{
                        padding: "7px 14px", borderRadius: "8px",
                        border: `1.5px solid ${c.grayLight}`, background: c.white,
                        color: c.charcoal, fontSize: "13px", fontWeight: 600, textDecoration: "none",
                      }}>
                        Manage
                      </Link>
                    </div>
                    {pools.length > 0 ? (
                      <div style={{ borderRadius: "10px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
                        <div style={{
                          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                          padding: "9px 16px", fontSize: "11px", fontWeight: 700,
                          color: c.gray, textTransform: "uppercase", letterSpacing: "0.5px",
                          backgroundColor: c.grayLighter,
                        }}>
                          <span>Pool</span><span>Commissioner</span><span>Players</span><span>Fees</span><span>Status</span>
                        </div>
                        {pools.map((pool: any) => (
                          <div key={pool.id} style={{
                            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                            padding: "11px 16px", fontSize: "14px",
                            borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
                          }}>
                            <span style={{ fontWeight: 600, color: c.charcoal }}>{pool.name}</span>
                            <span style={{ color: c.gray }}>{pool.users?.username ?? "—"}</span>
                            <span>{poolPlayers(pool)}</span>
                            <span>{poolFees(pool) > 0 ? `$${(poolFees(pool) / 100).toFixed(0)}` : "$0"}</span>
                            <StatusPill status={pool.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>No pools yet for this tournament.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ backgroundColor: c.white, borderRadius: "14px", padding: "32px", border: `1px solid ${c.grayLight}`, textAlign: "center" }}>
              <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 16px" }}>No active or upcoming tournaments.</p>
              <Link href="/admin/tournamentsetup" style={{
                padding: "10px 20px", borderRadius: "10px",
                background: c.green, color: c.white, fontSize: "14px", fontWeight: 600, textDecoration: "none",
              }}>
                Create a Tournament
              </Link>
            </div>
          )}
        </div>

        {/* Concluded Tournaments */}
        <div style={{ marginBottom: "40px" }}>
          <SectionHeader title="Concluded Tournaments" />
          <div style={{ backgroundColor: c.white, borderRadius: "14px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
            {concludedTournaments && concludedTournaments.length > 0 ? (
              concludedTournaments.map((t, i) => (
                <div key={t.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px 24px", borderTop: i > 0 ? `1px solid ${c.grayLight}` : "none",
                }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: c.charcoal }}>{t.name}</span>
                  <StatusPill status="concluded" />
                </div>
              ))
            ) : (
              <p style={{ fontSize: "14px", color: c.gray, padding: "24px", margin: 0 }}>No concluded tournaments yet.</p>
            )}
          </div>
        </div>

        {/* Live Pools */}
        <div style={{ marginBottom: "40px" }}>
          <SectionHeader title="Live Pools" />
          <div style={{ backgroundColor: c.white, borderRadius: "14px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
            {livePools && livePools.length > 0 ? (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
                  padding: "9px 20px", fontSize: "11px", fontWeight: 700,
                  color: c.gray, textTransform: "uppercase", letterSpacing: "0.5px",
                  backgroundColor: c.grayLighter,
                }}>
                  <span>Pool</span><span>Tournament</span><span>Commissioner</span><span>Players</span><span>Fees</span><span>Status</span>
                </div>
                {(livePools as any[]).map((pool, i) => (
                  <div key={pool.id} style={{
                    display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
                    padding: "13px 20px", fontSize: "14px",
                    borderTop: i > 0 ? `1px solid ${c.grayLight}` : "none", alignItems: "center",
                  }}>
                    <Link href={`/commissioner/managepool/${pool.slug}`} style={{ fontWeight: 600, color: c.green, textDecoration: "none" }}>
                      {pool.name}
                    </Link>
                    <span style={{ color: c.gray, fontSize: "13px" }}>{(pool.tournaments as any)?.name ?? "—"}</span>
                    <span style={{ color: c.gray }}>{(pool.users as any)?.username ?? "—"}</span>
                    <span>{poolPlayers(pool)}</span>
                    <span>{poolFees(pool) > 0 ? `$${(poolFees(pool) / 100).toFixed(0)}` : "$0"}</span>
                    <StatusPill status={pool.status} />
                  </div>
                ))}
              </>
            ) : (
              <p style={{ fontSize: "14px", color: c.gray, padding: "24px", margin: 0 }}>No live pools.</p>
            )}
          </div>
        </div>

        {/* Concluded Pools */}
        <div>
          <SectionHeader title="Concluded Pools" />
          <div style={{ backgroundColor: c.white, borderRadius: "14px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
            {concludedPools && concludedPools.length > 0 ? (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
                  padding: "9px 20px", fontSize: "11px", fontWeight: 700,
                  color: c.gray, textTransform: "uppercase", letterSpacing: "0.5px",
                  backgroundColor: c.grayLighter,
                }}>
                  <span>Pool</span><span>Tournament</span><span>Commissioner</span><span>Players</span><span>Fees</span><span>Status</span>
                </div>
                {(concludedPools as any[]).map((pool, i) => (
                  <div key={pool.id} style={{
                    display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
                    padding: "13px 20px", fontSize: "14px",
                    borderTop: i > 0 ? `1px solid ${c.grayLight}` : "none", alignItems: "center",
                  }}>
                    <span style={{ fontWeight: 600, color: c.charcoal }}>{pool.name}</span>
                    <span style={{ color: c.gray, fontSize: "13px" }}>{(pool.tournaments as any)?.name ?? "—"}</span>
                    <span style={{ color: c.gray }}>{(pool.users as any)?.username ?? "—"}</span>
                    <span>{poolPlayers(pool)}</span>
                    <span>{poolFees(pool) > 0 ? `$${(poolFees(pool) / 100).toFixed(0)}` : "$0"}</span>
                    <StatusPill status="concluded" />
                  </div>
                ))}
              </>
            ) : (
              <p style={{ fontSize: "14px", color: c.gray, padding: "24px", margin: 0 }}>No concluded pools yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
