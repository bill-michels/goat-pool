import { useState } from "react";

const colors = {
  green: "#4A7C59",
  greenLight: "#5E9E6E",
  greenDark: "#3A6147",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  grayLighter: "#F3F4F6",
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
        {["Manage Pools", "My Pools", "Profile"].map((tab, i) => (
          <button key={tab} style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: i === 0 ? colors.greenMuted : "transparent",
            color: i === 0 ? colors.green : colors.gray,
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
          }}>
            {tab}
          </button>
        ))}
        <div style={{ width: "1px", height: "24px", backgroundColor: colors.grayLight, margin: "0 8px" }} />
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: colors.greenMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: 700,
          color: colors.green,
          cursor: "pointer",
        }}>
          BM
        </div>
      </div>
    </nav>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: "14px",
      padding: "24px",
      border: `1px solid ${colors.grayLight}`,
      flex: 1,
    }}>
      <p style={{ fontSize: "13px", fontWeight: 600, color: colors.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ fontSize: "32px", fontWeight: 800, color: colors.charcoal, margin: "0 0 4px", letterSpacing: "-1px" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "13px", color: colors.gray, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function PoolCard({ name, tournament, status, players, fees, earnings, alive }) {
  const isLive = status === "Live";
  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: "14px",
      padding: "24px",
      border: `1px solid ${colors.grayLight}`,
      cursor: "pointer",
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: "0 0 4px" }}>
            {name}
          </h3>
          <p style={{ fontSize: "14px", color: colors.gray, margin: 0 }}>{tournament}</p>
        </div>
        <span style={{
          padding: "5px 10px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: isLive ? colors.greenMuted : colors.grayLighter,
          color: isLive ? colors.green : colors.gray,
        }}>
          {status}
        </span>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        <div>
          <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Players</p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>{players}</p>
        </div>
        {alive !== undefined && (
          <div>
            <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Alive</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: colors.green, margin: 0 }}>{alive}</p>
          </div>
        )}
        <div>
          <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fees</p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>{fees}</p>
        </div>
        <div>
          <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Earnings</p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: colors.green, margin: 0 }}>{earnings}</p>
        </div>
      </div>
    </div>
  );
}

export default function CommissionerDashboard() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
              My Pools
            </h1>
            <p style={{ fontSize: "15px", color: colors.gray, margin: 0 }}>Manage the pools you're running.</p>
          </div>
          <button style={{
            padding: "12px 24px",
            borderRadius: "10px",
            border: "none",
            background: colors.green,
            color: colors.white,
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ fontSize: "18px" }}>+</span> Start a Pool
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
          <StatCard label="Active Pools" value="2" sub="1 tournament in progress" />
          <StatCard label="Total Players" value="18" sub="Across all pools" />
          <StatCard label="Total Earnings" value="$36" sub="After platform cut" />
        </div>

        {/* Live Pools */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: colors.green,
            }} />
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: 0 }}>
              Live Pools
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <PoolCard
              name="Roger's Wimbledon Pool"
              tournament="Wimbledon 2026"
              status="Live"
              players={12}
              alive={8}
              fees="$48"
              earnings="$24"
            />
            <PoolCard
              name="Office Pool"
              tournament="Wimbledon 2026"
              status="Live"
              players={6}
              alive={5}
              fees="$24"
              earnings="$12"
            />
          </div>
        </div>

        {/* Concluded Pools */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: colors.charcoal, margin: "0 0 16px" }}>
            Concluded Pools
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <PoolCard
              name="French Open Showdown"
              tournament="Roland Garros 2026"
              status="Concluded"
              players={10}
              fees="$40"
              earnings="$20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
