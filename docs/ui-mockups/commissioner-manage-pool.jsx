import { useState } from "react";

const colors = {
  green: "#4A7C59",
  greenLight: "#5E9E6E",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  grayLighter: "#F3F4F6",
  red: "#EF4444",
  redMuted: "#FEF2F2",
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

function Nav() {
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
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: colors.greenMuted, color: colors.green, fontSize: "15px", fontWeight: 500, cursor: "pointer" }}>
          Manage Pools
        </button>
        <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "transparent", color: colors.gray, fontSize: "15px", fontWeight: 500, cursor: "pointer" }}>
          My Pools
        </button>
        <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "transparent", color: colors.gray, fontSize: "15px", fontWeight: 500, cursor: "pointer" }}>
          Profile
        </button>
        <div style={{ width: "1px", height: "24px", backgroundColor: colors.grayLight, margin: "0 8px" }} />
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%", backgroundColor: colors.greenMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: colors.green, cursor: "pointer",
        }}>BM</div>
      </div>
    </nav>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: "14px",
      padding: "20px",
      border: `1px solid ${colors.grayLight}`,
      flex: 1,
      textAlign: "center",
    }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: colors.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ fontSize: "28px", fontWeight: 800, color: color || colors.charcoal, margin: 0, letterSpacing: "-1px" }}>
        {value}
      </p>
    </div>
  );
}

export default function ManagePool() {
  const [activeTab, setActiveTab] = useState("players");

  const players = [
    { name: "Sarah M.", email: "sarah@email.com", status: "alive", livesBought: 2, livesLeft: 2, paid: "stripe", picks: ["Sinner", "Alcaraz", "Rune"] },
    { name: "Jake T.", email: "jake@email.com", status: "alive", livesBought: 2, livesLeft: 2, paid: "stripe", picks: ["Alcaraz", "Sinner", "Medvedev"] },
    { name: "Emma L.", email: "emma@email.com", status: "alive", livesBought: 2, livesLeft: 1, paid: "stripe", picks: ["Djokovic", "Rune", "Sinner"] },
    { name: "You", email: "bill.j.michels@gmail.com", status: "alive", livesBought: 1, livesLeft: 1, paid: "stripe", picks: ["Djokovic", "Medvedev", "Alcaraz"] },
    { name: "Mike R.", email: "mike@email.com", status: "eliminated", livesBought: 1, livesLeft: 0, paid: "external", picks: ["Rublev", "Fritz", "Tiafoe"] },
    { name: "Dan K.", email: "dan@email.com", status: "eliminated", livesBought: 1, livesLeft: 0, paid: "stripe", picks: ["Fritz", "Rublev", "Paul"] },
  ];

  const invites = [
    { email: "alex@email.com", status: "pending", sent: "Apr 10, 2026" },
    { email: "jenny@email.com", status: "accepted", sent: "Apr 10, 2026" },
    { email: "chris@email.com", status: "pending", sent: "Apr 12, 2026" },
  ];

  const rounds = [
    { num: 1, label: "Round 1", status: "completed", deadline: "Jun 30, 2pm" },
    { num: 2, label: "Round 2", status: "completed", deadline: "Jul 2, 2pm" },
    { num: 3, label: "Round 3", status: "active", deadline: "Jul 4, 2pm" },
    { num: 4, label: "Round 4", status: "upcoming", deadline: "Jul 6, 2pm" },
    { num: 5, label: "QF", status: "upcoming", deadline: "Jul 8, 2pm" },
    { num: 6, label: "SF", status: "upcoming", deadline: "Jul 10, 2pm" },
    { num: 7, label: "Final", status: "upcoming", deadline: "Jul 12, 2pm" },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }}>Manage Pools</span>
          <span style={{ fontSize: "14px", color: colors.grayLight }}>/</span>
          <span style={{ fontSize: "14px", color: colors.charcoal, fontWeight: 600 }}>Roger's Wimbledon Pool</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: 0, letterSpacing: "-0.5px" }}>
                Roger's Wimbledon Pool
              </h1>
              <span style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: colors.greenMuted,
                color: colors.green,
              }}>
                Live
              </span>
            </div>
            <p style={{ fontSize: "15px", color: colors.gray, margin: 0 }}>
              Wimbledon 2026 — Round 3 of 7
            </p>
          </div>
          <button style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: `1.5px solid ${colors.grayLight}`,
            background: colors.white,
            color: colors.charcoal,
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}>
            + Invite More
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
          <StatCard label="Players" value="6" />
          <StatCard label="Alive" value="4" color={colors.green} />
          <StatCard label="Invites Sent" value="3" />
          <StatCard label="Fees Collected" value="$32" />
          <StatCard label="Your Earnings" value="$16" color={colors.green} />
        </div>

        {/* Pool Rules Summary */}
        <div style={{
          display: "flex",
          gap: "24px",
          padding: "16px 20px",
          backgroundColor: colors.white,
          borderRadius: "12px",
          border: `1px solid ${colors.grayLight}`,
          marginBottom: "28px",
          fontSize: "13px",
          color: colors.gray,
        }}>
          <span><strong style={{ color: colors.charcoal }}>Fee per Life:</strong> $4.00</span>
          <span><strong style={{ color: colors.charcoal }}>Lives:</strong> 1 or 2 (player's choice)</span>
          <span><strong style={{ color: colors.charcoal }}>Missed Pick:</strong> Top Seed Remaining</span>
        </div>

        {/* Round Progress */}
        <div style={{
          display: "flex",
          gap: "6px",
          marginBottom: "28px",
        }}>
          {rounds.map((r) => (
            <div key={r.num} style={{
              flex: 1,
              padding: "10px 4px",
              borderRadius: "8px",
              textAlign: "center",
              backgroundColor: r.status === "active" ? colors.green : r.status === "completed" ? colors.greenMuted : colors.grayLighter,
              color: r.status === "active" ? colors.white : r.status === "completed" ? colors.green : colors.gray,
            }}>
              <p style={{ fontSize: "12px", fontWeight: 700, margin: "0 0 2px" }}>{r.label}</p>
              <p style={{ fontSize: "10px", fontWeight: 500, margin: 0, opacity: 0.8 }}>{r.deadline}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
          {[
            { key: "players", label: "Players" },
            { key: "invites", label: "Invites" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === tab.key ? colors.charcoal : "transparent",
                color: activeTab === tab.key ? colors.white : colors.gray,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Players Tab */}
        {activeTab === "players" && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: "14px",
            overflow: "hidden",
            border: `1px solid ${colors.grayLight}`,
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 2fr",
              padding: "12px 20px",
              backgroundColor: colors.grayLighter,
              fontSize: "12px",
              fontWeight: 600,
              color: colors.gray,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              <span>Player</span>
              <span>Status</span>
              <span>Lives</span>
              <span>Paid</span>
              <span>Picks (R1, R2, R3)</span>
            </div>

            {players.map((p) => (
              <div key={p.name} style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 2fr",
                padding: "14px 20px",
                fontSize: "14px",
                borderTop: `1px solid ${colors.grayLight}`,
                alignItems: "center",
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: colors.charcoal }}>{p.name}</span>
                  <br />
                  <span style={{ fontSize: "12px", color: colors.gray }}>{p.email}</span>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: p.status === "alive" ? colors.green : colors.red,
                  }} />
                  <span style={{
                    fontSize: "13px", fontWeight: 500,
                    color: p.status === "alive" ? colors.green : colors.red,
                  }}>
                    {p.status === "alive" ? "Alive" : "Out"}
                  </span>
                </span>
                <span style={{ fontWeight: 600, color: p.livesLeft > 0 ? colors.charcoal : colors.gray }}>
                  {p.livesLeft > 0 ? `${p.livesLeft} of ${p.livesBought}` : "\u2014"}
                </span>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: p.paid === "stripe" ? colors.greenMuted : colors.grayLighter,
                  color: p.paid === "stripe" ? colors.green : colors.gray,
                  display: "inline-block",
                  width: "fit-content",
                }}>
                  {p.paid === "stripe" ? "Stripe" : "External"}
                </span>
                <span style={{ fontSize: "13px", color: colors.gray }}>
                  {p.picks.join(" → ")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Invites Tab */}
        {activeTab === "invites" && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: "14px",
            overflow: "hidden",
            border: `1px solid ${colors.grayLight}`,
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              padding: "12px 20px",
              backgroundColor: colors.grayLighter,
              fontSize: "12px",
              fontWeight: 600,
              color: colors.gray,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              <span>Email</span>
              <span>Status</span>
              <span>Sent</span>
            </div>

            {invites.map((inv) => (
              <div key={inv.email} style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                padding: "14px 20px",
                fontSize: "14px",
                borderTop: `1px solid ${colors.grayLight}`,
                alignItems: "center",
              }}>
                <span style={{ color: colors.charcoal, fontWeight: 500 }}>{inv.email}</span>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: inv.status === "accepted" ? colors.greenMuted : colors.grayLighter,
                  color: inv.status === "accepted" ? colors.green : colors.gray,
                  display: "inline-block",
                  width: "fit-content",
                }}>
                  {inv.status === "accepted" ? "Accepted" : "Pending"}
                </span>
                <span style={{ fontSize: "13px", color: colors.gray }}>{inv.sent}</span>
              </div>
            ))}
          </div>
        )}

        {/* Payout Info */}
        <div style={{
          marginTop: "28px",
          padding: "20px",
          borderRadius: "14px",
          backgroundColor: colors.greenMuted,
          border: `1px solid ${colors.grayLight}`,
        }}>
          <p style={{ fontSize: "14px", color: colors.green, margin: 0, fontWeight: 600 }}>
            Your payout of $16.00 will be transferred to your connected Stripe account when this pool concludes.
          </p>
        </div>
      </div>
    </div>
  );
}
