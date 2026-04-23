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

function PoolCard({ name, tournament, status, round, lives, maxLives, deadline, picks }) {
  const isLive = status === "Live";
  const isEliminated = status === "Eliminated";
  const isWinner = status === "Winner";

  const statusColor = isLive ? colors.green : isEliminated ? colors.red : isWinner ? colors.green : colors.gray;
  const statusBg = isLive ? colors.greenMuted : isEliminated ? colors.redMuted : isWinner ? colors.greenMuted : colors.grayLighter;
  const statusLabel = isWinner ? "Winner!" : status;

  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: "14px",
      padding: "24px",
      border: `1px solid ${colors.grayLight}`,
      cursor: "pointer",
      opacity: isEliminated ? 0.7 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: "0 0 4px" }}>
            {name}
          </h3>
          <p style={{ fontSize: "14px", color: colors.gray, margin: 0 }}>{tournament}</p>
        </div>
        <span style={{
          padding: "5px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
          backgroundColor: statusBg, color: statusColor,
        }}>
          {statusLabel}
        </span>
      </div>

      {isLive && (
        <>
          <div style={{ display: "flex", gap: "24px", marginBottom: "14px" }}>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Round</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>{round}</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lives</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: lives === 1 ? colors.amber : colors.green, margin: 0 }}>
                {lives} of {maxLives}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Picks Made</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>{picks}</p>
            </div>
          </div>

          {deadline && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: colors.amberMuted,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: colors.amber }}>
                Pick due: {deadline}
              </span>
            </div>
          )}
        </>
      )}

      {isEliminated && (
        <p style={{ fontSize: "14px", color: colors.gray, margin: 0 }}>
          Eliminated in Round {round} · {picks} picks made
        </p>
      )}

      {isWinner && (
        <p style={{ fontSize: "14px", color: colors.green, fontWeight: 600, margin: 0 }}>
          Survived all {picks} rounds!
        </p>
      )}
    </div>
  );
}

export default function PlayerDashboard() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav />

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          My Pools
        </h1>
        <p style={{ fontSize: "15px", color: colors.gray, margin: "0 0 32px" }}>
          Pools you're playing in.
        </p>

        {/* Action needed */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.amber }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>
              Pick Needed
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <PoolCard
              name="Roger's Wimbledon Pool"
              tournament="Wimbledon 2026"
              status="Live"
              round="Round 3"
              lives={2}
              maxLives={2}
              deadline="Jul 4 at 2:00 PM"
              picks={2}
            />
          </div>
        </div>

        {/* Up to date */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.green }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>
              Pick Submitted
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <PoolCard
              name="Office Pool"
              tournament="Wimbledon 2026"
              status="Live"
              round="Round 3"
              lives={1}
              maxLives={2}
              picks={2}
            />
          </div>
        </div>

        {/* Concluded / Eliminated */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.charcoal, margin: "0 0 16px" }}>
            Past Pools
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <PoolCard
              name="French Open Showdown"
              tournament="Roland Garros 2026"
              status="Winner"
              round="7"
              picks={7}
            />
            <PoolCard
              name="Aussie Open Gang"
              tournament="Australian Open 2026"
              status="Eliminated"
              round="4"
              picks={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
