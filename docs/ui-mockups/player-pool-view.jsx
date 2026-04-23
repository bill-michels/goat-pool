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
  red: "#EF4444",
  redMuted: "#FEF2F2",
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
        <span style={{ fontSize: "22px", fontWeight: 700, color: colors.charcoal, letterSpacing: "-0.5px" }}>Goat Pool</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {["My Pools", "Manage Pools", "Profile"].map((tab, i) => (
          <button key={tab} style={{
            padding: "8px 16px", borderRadius: "8px", border: "none",
            background: i === 0 ? colors.greenMuted : "transparent",
            color: i === 0 ? colors.green : colors.gray,
            fontSize: "15px", fontWeight: 500, cursor: "pointer",
          }}>{tab}</button>
        ))}
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
      backgroundColor: colors.white, borderRadius: "14px", padding: "20px",
      border: `1px solid ${colors.grayLight}`, flex: 1, textAlign: "center",
    }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: colors.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ fontSize: "28px", fontWeight: 800, color: color || colors.charcoal, margin: 0, letterSpacing: "-1px" }}>{value}</p>
    </div>
  );
}

export default function PlayerPoolView() {
  const [selectedRound, setSelectedRound] = useState(null);

  const rounds = [
    { num: 1, label: "Round 1", status: "completed" },
    { num: 2, label: "Round 2", status: "completed" },
    { num: 3, label: "Round 3", status: "active" },
    { num: 4, label: "Round 4", status: "upcoming" },
    { num: 5, label: "QF", status: "upcoming" },
    { num: 6, label: "SF", status: "upcoming" },
    { num: 7, label: "Final", status: "upcoming" },
  ];

  const players = [
    { name: "Sarah M.", status: "alive", lives: 2, previousPicks: ["Sinner", "Alcaraz"], isYou: false },
    { name: "Jake T.", status: "alive", lives: 2, previousPicks: ["Alcaraz", "Sinner"], isYou: false },
    { name: "You", status: "alive", lives: 1, previousPicks: ["Djokovic", "Rune"], isYou: true },
    { name: "Emma L.", status: "alive", lives: 1, previousPicks: ["Medvedev", "Fritz"], isYou: false },
    { name: "Mike R.", status: "eliminated", lives: 0, previousPicks: ["Rublev"], isYou: false },
    { name: "Dan K.", status: "eliminated", lives: 0, previousPicks: ["Fritz"], isYou: false },
  ];

  const roundResults = {
    1: [
      { athlete: "Sinner", seed: 1, result: "win" },
      { athlete: "Alcaraz", seed: 2, result: "win" },
      { athlete: "Djokovic", seed: 3, result: "win" },
      { athlete: "Medvedev", seed: 5, result: "win" },
      { athlete: "Rublev", seed: 6, result: "loss" },
      { athlete: "Fritz", seed: 7, result: "loss" },
      { athlete: "Rune", seed: 9, result: "win" },
    ],
    2: [
      { athlete: "Sinner", seed: 1, result: "win" },
      { athlete: "Alcaraz", seed: 2, result: "win" },
      { athlete: "Djokovic", seed: 3, result: "win" },
      { athlete: "Medvedev", seed: 5, result: "win" },
      { athlete: "Rune", seed: 9, result: "loss" },
      { athlete: "Fritz", seed: 7, result: "loss" },
    ],
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }}>My Pools</span>
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
              <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, backgroundColor: colors.greenMuted, color: colors.green }}>
                Live
              </span>
            </div>
            <p style={{ fontSize: "15px", color: colors.gray, margin: 0 }}>Wimbledon 2026 — Commissioner: Roger F.</p>
          </div>
          <button style={{
            padding: "12px 24px", borderRadius: "10px", border: "none",
            background: colors.green, color: colors.white, fontSize: "15px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(74, 124, 89, 0.3)",
          }}>
            Place Pick
          </button>
        </div>

        {/* Your Status */}
        <div style={{
          padding: "20px 24px", borderRadius: "14px",
          backgroundColor: colors.white, border: `1px solid ${colors.grayLight}`,
          marginBottom: "20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Status</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.green }} />
                <span style={{ fontSize: "16px", fontWeight: 700, color: colors.green }}>Alive</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lives Remaining</p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: colors.amber, margin: 0 }}>1 of 2</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Round</p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>Round 3</p>
            </div>
          </div>
          <div style={{ padding: "10px 16px", borderRadius: "10px", backgroundColor: colors.amberMuted }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: colors.amber, margin: 0 }}>
              Pick due: Jul 4 at 2:00 PM
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
          <StatCard label="Players" value="6" />
          <StatCard label="Alive" value="4" color={colors.green} />
          <StatCard label="Eliminated" value="2" color={colors.red} />
        </div>

        {/* Round Progress — clickable for completed rounds */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
          {rounds.map((r) => (
            <button
              key={r.num}
              onClick={() => {
                if (r.status === "completed") {
                  setSelectedRound(selectedRound === r.num ? null : r.num);
                }
              }}
              style={{
                flex: 1, padding: "10px 4px", borderRadius: "8px", textAlign: "center",
                fontSize: "12px", fontWeight: 700, border: "none",
                cursor: r.status === "completed" ? "pointer" : "default",
                backgroundColor:
                  selectedRound === r.num ? colors.charcoal :
                  r.status === "active" ? colors.green :
                  r.status === "completed" ? colors.greenMuted :
                  colors.grayLighter,
                color:
                  selectedRound === r.num ? colors.white :
                  r.status === "active" ? colors.white :
                  r.status === "completed" ? colors.green :
                  colors.gray,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Round Results (shown when a completed round is clicked) */}
        {selectedRound && roundResults[selectedRound] && (
          <div style={{
            backgroundColor: colors.white, borderRadius: "14px",
            overflow: "hidden", border: `1px solid ${colors.grayLight}`,
            marginBottom: "28px",
          }}>
            <div style={{
              padding: "14px 20px",
              backgroundColor: colors.grayLighter,
              fontSize: "14px", fontWeight: 700, color: colors.charcoal,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>{rounds.find((r) => r.num === selectedRound)?.label} Results</span>
              <button onClick={() => setSelectedRound(null)} style={{
                background: "none", border: "none", fontSize: "13px", color: colors.gray,
                cursor: "pointer", fontWeight: 600,
              }}>
                Close
              </button>
            </div>
            {roundResults[selectedRound].map((a) => (
              <div key={a.athlete} style={{
                display: "grid", gridTemplateColumns: "0.5fr 2fr 1fr",
                padding: "12px 20px", fontSize: "14px",
                borderTop: `1px solid ${colors.grayLight}`,
                alignItems: "center",
                backgroundColor: a.result === "loss" ? "#FEFAFA" : "transparent",
              }}>
                <span style={{ fontWeight: 700, color: colors.green }}>{a.seed}</span>
                <span style={{
                  fontWeight: 600,
                  color: a.result === "loss" ? colors.gray : colors.charcoal,
                  textDecoration: a.result === "loss" ? "line-through" : "none",
                }}>
                  {a.athlete}
                </span>
                <span style={{
                  fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px",
                  backgroundColor: a.result === "win" ? colors.greenMuted : colors.redMuted,
                  color: a.result === "win" ? colors.green : colors.red,
                  display: "inline-block", width: "fit-content",
                }}>
                  {a.result === "win" ? "Won" : "Lost"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Player Table */}
        <div style={{
          backgroundColor: colors.white, borderRadius: "14px",
          overflow: "hidden", border: `1px solid ${colors.grayLight}`,
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 0.8fr 0.7fr 3fr",
            padding: "12px 20px",
            backgroundColor: colors.grayLighter,
            fontSize: "12px", fontWeight: 600, color: colors.gray,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <span>Player</span>
            <span>Status</span>
            <span>Lives</span>
            <span>Previous Picks</span>
          </div>

          {players.map((p) => (
            <div key={p.name} style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 0.8fr 0.7fr 3fr",
              padding: "14px 20px",
              fontSize: "14px",
              borderTop: `1px solid ${colors.grayLight}`,
              alignItems: "center",
              backgroundColor: p.isYou ? colors.greenMuted : "transparent",
            }}>
              <span style={{ fontWeight: p.isYou ? 700 : 500, color: colors.charcoal }}>
                {p.name}
              </span>
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
              <span style={{ fontWeight: 600, color: p.lives > 0 ? colors.charcoal : colors.gray }}>
                {p.lives > 0 ? `${p.lives} left` : "\u2014"}
              </span>
              <span style={{ fontSize: "13px", color: colors.gray }}>
                {p.previousPicks.length > 0 ? p.previousPicks.join(", ") : "\u2014"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
