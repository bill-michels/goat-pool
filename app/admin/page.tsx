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
};

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ backgroundColor: c.white, borderRadius: "14px", padding: "24px", border: `1px solid ${c.grayLight}`, flex: 1 }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: c.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 800, color: accent || c.charcoal, margin: "0 0 4px", letterSpacing: "-1px" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: userData },
    { count: userCount },
    { data: activeTournament },
    { data: concludedTournaments },
    { data: activePoolsData },
    { data: paymentsData },
    { data: payoutsData },
  ] = await Promise.all([
    adminClient.from("users").select("username, role").eq("id", user.id).single(),
    adminClient.from("users").select("*", { count: "exact", head: true }),
    adminClient.from("tournaments").select("id, name, num_rounds, status").eq("status", "active").maybeSingle(),
    adminClient.from("tournaments").select("id, name, status").eq("status", "concluded").order("created_at", { ascending: false }),
    adminClient.from("pools").select("id, name, commissioner_id, status, pool_players(count)").eq("status", "active"),
    adminClient.from("payments").select("amount").eq("status", "completed"),
    adminClient.from("payouts").select("platform_amount").eq("status", "completed"),
  ]);

  if (userData?.role !== "admin") redirect("/player/dash");

  const totalFees = paymentsData?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const platformRevenue = payoutsData?.reduce((sum, p) => sum + p.platform_amount, 0) ?? 0;
  const activePoolCount = activePoolsData?.length ?? 0;

  let activeTournamentPools: { name: string; commissioner: string; players: number; fees: string; status: string }[] = [];
  if (activeTournament) {
    const { data: poolsWithDetails } = await adminClient
      .from("pools")
      .select("id, name, commissioner_id, users!pools_commissioner_id_fkey(username), pool_players(count), payments(amount)")
      .eq("tournament_id", activeTournament.id);

    activeTournamentPools = (poolsWithDetails ?? []).map((pool: any) => {
      const fees = (pool.payments ?? []).reduce((sum: number, p: any) => sum + p.amount, 0);
      return {
        name: pool.name,
        commissioner: pool.users?.username ?? "—",
        players: pool.pool_players?.[0]?.count ?? 0,
        fees: fees > 0 ? `$${(fees / 100).toFixed(0)}` : "$0",
        status: pool.status,
      };
    });
  }

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
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={{
              padding: "10px 20px", borderRadius: "10px",
              border: `1.5px solid ${c.grayLight}`, background: c.white,
              color: c.charcoal, fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}>
              Platform Settings
            </button>
            <Link href="/admin/tournamentsetup" style={{
              padding: "10px 20px", borderRadius: "10px",
              border: "none", background: c.green,
              color: c.white, fontSize: "14px", fontWeight: 600,
              cursor: "pointer", textDecoration: "none",
            }}>
              + New Tournament
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "32px" }}>
          <StatCard label="Total Users" value={String(userCount ?? 0)} />
          <StatCard label="Active Pools" value={String(activePoolCount)} sub={activeTournament ? `In ${activeTournament.name}` : "No active tournament"} />
          <StatCard label="Total Fees Collected" value={totalFees > 0 ? `$${(totalFees / 100).toFixed(0)}` : "$0"} sub="All time" />
          <StatCard label="Platform Revenue" value={platformRevenue > 0 ? `$${(platformRevenue / 100).toFixed(0)}` : "$0"} sub="After commissioner cuts" accent={c.green} />
        </div>

        {/* Live Tournament */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: activeTournament ? c.green : c.gray }} />
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: 0 }}>
              Live Tournament
            </h2>
          </div>

          {activeTournament ? (
            <div style={{ backgroundColor: c.white, borderRadius: "14px", padding: "24px", border: `1px solid ${c.grayLight}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, color: c.charcoal, margin: "0 0 4px" }}>
                    {activeTournament.name}
                  </h3>
                  <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>
                    {activeTournament.num_rounds} rounds total
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link href={`/admin/tournamentsetup?id=${activeTournament.id}`} style={{
                    padding: "8px 16px", borderRadius: "8px",
                    border: `1.5px solid ${c.grayLight}`, background: c.white,
                    color: c.charcoal, fontSize: "13px", fontWeight: 600, textDecoration: "none",
                  }}>
                    Manage
                  </Link>
                </div>
              </div>

              {activeTournamentPools.length > 0 ? (
                <div style={{ backgroundColor: c.grayLighter, borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    padding: "10px 16px", fontSize: "12px", fontWeight: 600,
                    color: c.gray, textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>
                    <span>Pool</span><span>Commissioner</span><span>Players</span><span>Fees</span><span>Status</span>
                  </div>
                  {activeTournamentPools.map((pool) => (
                    <div key={pool.name} style={{
                      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                      padding: "12px 16px", fontSize: "14px",
                      backgroundColor: c.white, borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
                    }}>
                      <span style={{ fontWeight: 600, color: c.charcoal }}>{pool.name}</span>
                      <span style={{ color: c.gray }}>{pool.commissioner}</span>
                      <span style={{ fontWeight: 600 }}>{pool.players}</span>
                      <span style={{ fontWeight: 600 }}>{pool.fees}</span>
                      <span style={{
                        fontSize: "12px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px",
                        backgroundColor: c.greenMuted, color: c.green, display: "inline-block", width: "fit-content",
                      }}>
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>No pools created yet for this tournament.</p>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: c.white, borderRadius: "14px", padding: "32px", border: `1px solid ${c.grayLight}`, textAlign: "center" }}>
              <p style={{ fontSize: "16px", color: c.gray, margin: "0 0 16px" }}>No active tournament.</p>
              <Link href="/admin/tournamentsetup" style={{
                padding: "10px 20px", borderRadius: "10px",
                background: c.green, color: c.white,
                fontSize: "14px", fontWeight: 600, textDecoration: "none",
              }}>
                Create a Tournament
              </Link>
            </div>
          )}
        </div>

        {/* Concluded Tournaments */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: "0 0 16px" }}>
            Concluded Tournaments
          </h2>
          <div style={{ backgroundColor: c.white, borderRadius: "14px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
            {concludedTournaments && concludedTournaments.length > 0 ? (
              concludedTournaments.map((t, i) => (
                <div key={t.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "18px 24px", borderTop: i > 0 ? `1px solid ${c.grayLight}` : "none", cursor: "pointer",
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: c.charcoal, margin: 0 }}>{t.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px", backgroundColor: c.grayLighter, color: c.gray }}>
                      Concluded
                    </span>
                    <span style={{ fontSize: "18px", color: c.grayLight }}>›</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "14px", color: c.gray, padding: "24px", margin: 0 }}>No concluded tournaments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
