import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import AdminNav from "../AdminNav";

const c = {
  green: "#4A7C59", greenMuted: "#E8F0EA", cream: "#F5F3EF",
  white: "#FFFFFF", charcoal: "#2D2D2D", gray: "#6B7280",
  grayLight: "#E5E7EB", grayLighter: "#F3F4F6",
  amber: "#D97706", amberMuted: "#FEF3C7",
};

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ backgroundColor: c.white, borderRadius: "14px", padding: "24px", border: `1px solid ${c.grayLight}`, flex: 1 }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: c.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 800, color: accent ?? c.charcoal, margin: "0 0 4px", letterSpacing: "-1px" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default async function MetricsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: userData },
    { count: totalUsers },
    { count: totalPools },
    { count: totalPicks },
    { data: tournaments },
    { data: payments },
    { data: payouts },
  ] = await Promise.all([
    admin.from("users").select("username, role").eq("id", user.id).single(),
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("pools").select("*", { count: "exact", head: true }),
    admin.from("picks").select("*", { count: "exact", head: true }),
    admin.from("tournaments")
      .select("id, name, status, num_rounds, created_at")
      .order("created_at", { ascending: false }),
    admin.from("payments").select("amount, status"),
    admin.from("payouts").select("platform_amount, commissioner_amount, status"),
  ]);

  if (userData?.role !== "admin") redirect("/player");

  const completedPayments = (payments ?? []).filter((p: any) => p.status === "completed");
  const totalFees = completedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const completedPayouts = (payouts ?? []).filter((p: any) => p.status === "completed");
  const platformRevenue = completedPayouts.reduce((sum: number, p: any) => sum + p.platform_amount, 0);
  const commissionerPayouts = completedPayouts.reduce((sum: number, p: any) => sum + p.commissioner_amount, 0);

  const tournamentIds = (tournaments ?? []).map((t: any) => t.id);
  const { data: poolsByTournament } = await admin
    .from("pools")
    .select("id, name, tournament_id, status, pool_players(count), payments(amount, status)")
    .in("tournament_id", tournamentIds.length ? tournamentIds : ["none"]);

  const tournamentStats = (tournaments ?? []).map((t: any) => {
    const tPools = (poolsByTournament ?? []).filter((p: any) => p.tournament_id === t.id);
    const playerCount = tPools.reduce((sum: number, p: any) => sum + (p.pool_players?.[0]?.count ?? 0), 0);
    const fees = tPools.reduce((sum: number, p: any) => {
      return sum + (p.payments ?? [])
        .filter((pay: any) => pay.status === "completed")
        .reduce((s: number, pay: any) => s + pay.amount, 0);
    }, 0);
    return { ...t, poolCount: tPools.length, playerCount, fees };
  });

  const statusColor = (s: string) =>
    s === "active" ? c.green : s === "upcoming" ? c.amber : c.gray;
  const statusBg = (s: string) =>
    s === "active" ? c.greenMuted : s === "upcoming" ? c.amberMuted : c.grayLighter;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      <AdminNav username={userData?.username ?? "A"} />

      <div style={{ maxWidth: "1040px", margin: "0 auto", padding: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          <Link href="/admin" style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>Admin</Link>
          <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
          <span style={{ fontSize: "14px", color: c.charcoal, fontWeight: 600 }}>Metrics</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Platform Metrics</h1>
        <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 32px" }}>All-time stats across all tournaments and pools.</p>

        {/* Top stats */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "14px" }}>
          <StatCard label="Total Users" value={String(totalUsers ?? 0)} sub="Registered accounts" />
          <StatCard label="Total Pools" value={String(totalPools ?? 0)} sub="Across all tournaments" />
          <StatCard label="Total Picks" value={String(totalPicks ?? 0)} sub="Including auto-assigned" />
        </div>
        <div style={{ display: "flex", gap: "14px", marginBottom: "32px" }}>
          <StatCard label="Fees Collected" value={totalFees > 0 ? `$${(totalFees / 100).toFixed(2)}` : "$0"} sub="All completed payments" />
          <StatCard label="Platform Revenue" value={platformRevenue > 0 ? `$${(platformRevenue / 100).toFixed(2)}` : "$0"} sub="After commissioner cuts" accent={c.green} />
          <StatCard label="Commissioner Payouts" value={commissionerPayouts > 0 ? `$${(commissionerPayouts / 100).toFixed(2)}` : "$0"} sub="Paid out to commissioners" />
        </div>

        {/* Tournaments breakdown */}
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: "0 0 16px" }}>Tournaments</h2>
        <div style={{ backgroundColor: c.white, borderRadius: "14px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
          {tournamentStats.length === 0 ? (
            <p style={{ fontSize: "14px", color: c.gray, padding: "24px", margin: 0 }}>No tournaments yet.</p>
          ) : (
            <>
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding: "12px 20px", backgroundColor: c.grayLighter,
                fontSize: "12px", fontWeight: 600, color: c.gray,
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                <span>Tournament</span>
                <span>Status</span>
                <span>Pools</span>
                <span>Players</span>
                <span>Fees</span>
              </div>
              {tournamentStats.map((t: any, i: number) => (
                <div key={t.id} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "16px 20px", fontSize: "14px", alignItems: "center",
                  borderTop: i > 0 ? `1px solid ${c.grayLight}` : "none",
                }}>
                  <div>
                    <p style={{ fontWeight: 700, color: c.charcoal, margin: "0 0 2px" }}>{t.name}</p>
                    <p style={{ fontSize: "12px", color: c.gray, margin: 0 }}>{t.num_rounds} rounds</p>
                  </div>
                  <span style={{
                    display: "inline-block", fontSize: "12px", fontWeight: 600,
                    padding: "3px 8px", borderRadius: "6px",
                    backgroundColor: statusBg(t.status), color: statusColor(t.status),
                    width: "fit-content",
                  }}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                  <span style={{ fontWeight: 600 }}>{t.poolCount}</span>
                  <span style={{ fontWeight: 600 }}>{t.playerCount}</span>
                  <span style={{ fontWeight: 600 }}>{t.fees > 0 ? `$${(t.fees / 100).toFixed(0)}` : "$0"}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
