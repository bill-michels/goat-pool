import { useState } from "react";

const colors = {
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

function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill={colors.green} />
      <circle cx="20" cy="20" r="11" stroke={colors.cream} strokeWidth="1.8" fill="none" />
      <path d="M11.5 9.5 Q20 18, 11.5 30.5" stroke={colors.cream} strokeWidth="1.8" fill="none" />
      <path d="M28.5 9.5 Q20 18, 28.5 30.5" stroke={colors.cream} strokeWidth="1.8" fill="none" />
    </svg>
  );
}

function Nav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 40px",
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.grayLight}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <LogoIcon size={36} />
        <span style={{ fontSize: "22px", fontWeight: 700, color: colors.charcoal, letterSpacing: "-0.5px" }}>
          Goat Pool
        </span>
        <span style={{
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700,
          backgroundColor: colors.amberMuted,
          color: colors.amber,
          marginLeft: "4px",
        }}>
          ADMIN
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {["Overview", "Tournaments", "Metrics"].map((tab) => (
          <button key={tab} onClick={() => onTabChange(tab)} style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === tab ? colors.greenMuted : "transparent",
            color: activeTab === tab ? colors.green : colors.gray,
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
          }}>
            {tab}
          </button>
        ))}
        <div style={{ width: "1px", height: "24px", backgroundColor: colors.grayLight, margin: "0 8px" }} />
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%", backgroundColor: colors.amberMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: colors.amber, cursor: "pointer",
        }}>A</div>
      </div>
    </nav>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: "14px",
      padding: "24px",
      border: `1px solid ${colors.grayLight}`,
      flex: 1,
    }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: colors.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 800, color: accent || colors.charcoal, margin: "0 0 4px", letterSpacing: "-1px" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "13px", color: colors.gray, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{ maxWidth: "1040px", margin: "0 auto", padding: "40px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: "15px", color: colors.gray, margin: 0 }}>Platform overview and management.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={{
              padding: "10px 20px", borderRadius: "10px",
              border: `1.5px solid ${colors.grayLight}`, background: colors.white,
              color: colors.charcoal, fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}>
              Platform Settings
            </button>
            <button style={{
              padding: "10px 20px", borderRadius: "10px",
              border: "none", background: colors.green,
              color: colors.white, fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}>
              + New Tournament
            </button>
          </div>
        </div>

        {/* Platform Metrics */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "32px" }}>
          <StatCard label="Total Users" value="142" sub="12 new this week" />
          <StatCard label="Active Pools" value="8" sub="Across 1 tournament" />
          <StatCard label="Total Fees Collected" value="$1,248" sub="All time" />
          <StatCard label="Platform Revenue" value="$624" sub="After commissioner cuts" accent={colors.green} />
        </div>

        {/* Stripe Account */}
        <div style={{
          padding: "20px 24px",
          borderRadius: "14px",
          backgroundColor: colors.white,
          border: `1px solid ${colors.grayLight}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: colors.charcoal, margin: "0 0 4px" }}>Stripe Account</p>
            <p style={{ fontSize: "13px", color: colors.gray, margin: 0 }}>Connected as individual — bill.j.michels@gmail.com</p>
          </div>
          <span style={{
            padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
            backgroundColor: colors.greenMuted, color: colors.green,
          }}>
            Connected
          </span>
        </div>

        {/* Live Tournament */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.green }} />
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>
              Live Tournament
            </h2>
          </div>

          <div style={{
            backgroundColor: colors.white,
            borderRadius: "14px",
            padding: "24px",
            border: `1px solid ${colors.grayLight}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: colors.charcoal, margin: "0 0 4px" }}>
                  Wimbledon 2026
                </h3>
                <p style={{ fontSize: "14px", color: colors.gray, margin: 0 }}>Round 3 of 7 — 128 athletes</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={{
                  padding: "8px 16px", borderRadius: "8px",
                  border: `1.5px solid ${colors.grayLight}`, background: colors.white,
                  color: colors.charcoal, fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}>
                  Manage
                </button>
                <button style={{
                  padding: "8px 16px", borderRadius: "8px",
                  border: `1.5px solid #FCA5A5`, background: "#FEF2F2",
                  color: "#EF4444", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}>
                  Cancel Tournament
                </button>
              </div>
            </div>

            {/* Pools in this tournament */}
            <div style={{
              backgroundColor: colors.grayLighter,
              borderRadius: "10px",
              overflow: "hidden",
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding: "10px 16px",
                fontSize: "12px",
                fontWeight: 600,
                color: colors.gray,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                <span>Pool</span>
                <span>Commissioner</span>
                <span>Players</span>
                <span>Fees</span>
                <span>Status</span>
              </div>

              {[
                { name: "Roger's Wimbledon Pool", commissioner: "Bill M.", players: 12, fees: "$48", status: "Active" },
                { name: "Office Pool", commissioner: "Bill M.", players: 6, fees: "$24", status: "Active" },
                { name: "Tennis Club", commissioner: "Sarah M.", players: 15, fees: "$75", status: "Active" },
                { name: "College Crew", commissioner: "Jake T.", players: 20, fees: "$80", status: "Active" },
              ].map((pool) => (
                <div key={pool.name} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "12px 16px",
                  fontSize: "14px",
                  backgroundColor: colors.white,
                  borderTop: `1px solid ${colors.grayLight}`,
                  alignItems: "center",
                }}>
                  <span style={{ fontWeight: 600, color: colors.charcoal }}>{pool.name}</span>
                  <span style={{ color: colors.gray }}>{pool.commissioner}</span>
                  <span style={{ fontWeight: 600 }}>{pool.players}</span>
                  <span style={{ fontWeight: 600 }}>{pool.fees}</span>
                  <span style={{
                    fontSize: "12px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px",
                    backgroundColor: colors.greenMuted, color: colors.green,
                    display: "inline-block", width: "fit-content",
                  }}>
                    {pool.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Concluded Tournaments */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: "0 0 16px" }}>
            Concluded Tournaments
          </h2>

          <div style={{
            backgroundColor: colors.white,
            borderRadius: "14px",
            overflow: "hidden",
            border: `1px solid ${colors.grayLight}`,
          }}>
            {[
              { name: "Roland Garros 2026", pools: 5, players: 48, fees: "$192", revenue: "$96", status: "Paid out" },
              { name: "Australian Open 2026", pools: 3, players: 30, fees: "$120", revenue: "$60", status: "Paid out" },
            ].map((t, i) => (
              <div key={t.name} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 24px",
                borderTop: i > 0 ? `1px solid ${colors.grayLight}` : "none",
                cursor: "pointer",
              }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: colors.charcoal, margin: "0 0 4px" }}>
                    {t.name}
                  </h3>
                  <p style={{ fontSize: "13px", color: colors.gray, margin: 0 }}>
                    {t.pools} pools · {t.players} players · {t.fees} fees · {t.revenue} platform revenue
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px",
                    backgroundColor: colors.grayLighter, color: colors.gray,
                  }}>
                    {t.status}
                  </span>
                  <span style={{ fontSize: "18px", color: colors.grayLight }}>›</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
