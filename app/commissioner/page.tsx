import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import CommissionerNav from "./CommissionerNav";

const c = {
  green: "#4A7C59",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  grayLighter: "#F3F4F6",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: c.white, borderRadius: "14px", padding: "24px", border: `1px solid ${c.grayLight}`, flex: 1 }}>
      <p style={{ fontSize: "13px", fontWeight: 600, color: c.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 800, color: c.charcoal, margin: "0 0 4px", letterSpacing: "-1px" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function PoolCard({ pool }: { pool: any }) {
  const isLive = pool.status === "active" || pool.status === "open";
  const statusLabel = pool.status === "active" ? "Live" : pool.status === "open" ? "Open" : "Concluded";
  const fees = pool.totalFees > 0 ? `$${(pool.totalFees / 100).toFixed(0)}` : "$0";
  const earnings = pool.earnings > 0 ? `$${(pool.earnings / 100).toFixed(0)}` : "$0";

  return (
    <Link href={`/commissioner/managepool/${pool.slug}`} style={{ textDecoration: "none" }}>
      <div style={{
        backgroundColor: c.white, borderRadius: "14px", padding: "24px",
        border: `1px solid ${c.grayLight}`, cursor: "pointer",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: "0 0 4px" }}>{pool.name}</h3>
            <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>{pool.tournamentName}</p>
          </div>
          <span style={{
            padding: "5px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
            backgroundColor: isLive ? c.greenMuted : c.grayLighter,
            color: isLive ? c.green : c.gray,
          }}>
            {statusLabel}
          </span>
        </div>

        <div style={{ display: "flex", gap: "24px" }}>
          <div>
            <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Players</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: 0 }}>{pool.playerCount}</p>
          </div>
          {isLive && (
            <div>
              <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Alive</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: c.green, margin: 0 }}>{pool.aliveCount}</p>
            </div>
          )}
          <div>
            <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fees</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: 0 }}>{fees}</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Cut</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: c.green, margin: 0 }}>{earnings}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function CommissionerDashboard() {
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

  const { data: pools } = await adminClient
    .from("pools")
    .select(`
      id, name, slug, status, take_rate,
      tournaments(name),
      pool_players(id, status, lives_purchased),
      payments(amount, status)
    `)
    .eq("commissioner_id", user.id)
    .order("created_at", { ascending: false });

  const role = userData?.role ?? "player";
  if (role === "player" && !pools?.length) redirect("/player");

  const enrichedPools = (pools ?? []).map((pool: any) => {
    const players = pool.pool_players ?? [];
    const payments = pool.payments ?? [];
    const totalFees = payments
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    const earnings = Math.round(totalFees * (1 - pool.take_rate / 100));
    return {
      ...pool,
      tournamentName: pool.tournaments?.name ?? "—",
      playerCount: players.length,
      aliveCount: players.filter((p: any) => p.status === "alive").length,
      totalFees,
      earnings,
    };
  });

  const livePools = enrichedPools.filter((p) => p.status === "active" || p.status === "open");
  const concludedPools = enrichedPools.filter((p) => p.status === "concluded");

  const totalPlayers = enrichedPools.reduce((sum, p) => sum + p.playerCount, 0);
  const totalEarnings = enrichedPools.reduce((sum, p) => sum + p.earnings, 0);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      <CommissionerNav username={userData?.username ?? "?"} isAdmin={userData?.role === "admin"} />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
              My Pools
            </h1>
            <p style={{ fontSize: "15px", color: c.gray, margin: 0 }}>Manage the pools you&apos;re running.</p>
          </div>
          <Link href="/commissioner/startpool" style={{
            padding: "12px 24px", borderRadius: "10px", border: "none",
            background: c.green, color: c.white, fontSize: "15px", fontWeight: 600,
            cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px",
          }}>
            + Start a Pool
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
          <StatCard label="Active Pools" value={String(livePools.length)} sub={livePools.length > 0 ? "In progress" : "None yet"} />
          <StatCard label="Total Players" value={String(totalPlayers)} sub="Across all pools" />
          <StatCard label="Total Earnings" value={totalEarnings > 0 ? `$${(totalEarnings / 100).toFixed(0)}` : "$0"} sub="After platform cut" />
        </div>

        {/* Live Pools */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: livePools.length > 0 ? c.green : c.gray }} />
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: 0 }}>Live Pools</h2>
          </div>

          {livePools.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {livePools.map((pool) => <PoolCard key={pool.id} pool={pool} />)}
            </div>
          ) : (
            <div style={{ backgroundColor: c.white, borderRadius: "14px", padding: "32px", border: `1px solid ${c.grayLight}`, textAlign: "center" }}>
              <p style={{ fontSize: "16px", color: c.gray, margin: "0 0 16px" }}>No active pools yet.</p>
              <Link href="/commissioner/startpool" style={{
                padding: "10px 20px", borderRadius: "10px", background: c.green,
                color: c.white, fontSize: "14px", fontWeight: 600, textDecoration: "none",
              }}>
                Start Your First Pool
              </Link>
            </div>
          )}
        </div>

        {/* Concluded Pools */}
        {concludedPools.length > 0 && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: "0 0 16px" }}>Concluded Pools</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {concludedPools.map((pool) => <PoolCard key={pool.id} pool={pool} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
