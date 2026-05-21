"use client";

import Link from "next/link";

const c = {
  green: "#4A7C59",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
};

function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill={c.green} />
      <circle cx="20" cy="20" r="11" stroke={c.cream} strokeWidth="1.8" fill="none" />
      <path d="M11.5 9.5 Q20 18, 11.5 30.5" stroke={c.cream} strokeWidth="1.8" fill="none" />
      <path d="M28.5 9.5 Q20 18, 28.5 30.5" stroke={c.cream} strokeWidth="1.8" fill="none" />
    </svg>
  );
}

export default function CommissionerNav({
  username,
  isAdmin = false,
}: {
  username: string;
  isAdmin?: boolean;
}) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 40px",
      backgroundColor: c.white,
      borderBottom: `1px solid ${c.grayLight}`,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/commissioner" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <LogoIcon size={36} />
        <span style={{ fontSize: "22px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.5px" }}>
          Goat Pool
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Link href="/commissioner" style={{
          padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
          background: c.greenMuted, color: c.green, fontSize: "15px", fontWeight: 500,
        }}>
          My Pools
        </Link>
        <Link href="/player/dash" style={{
          padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
          background: "transparent", color: c.gray, fontSize: "15px", fontWeight: 500,
        }}>
          As Player
        </Link>
        {isAdmin && (
          <Link href="/admin" style={{
            padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
            background: "transparent", color: c.gray, fontSize: "15px", fontWeight: 500,
          }}>
            Admin
          </Link>
        )}

        <div style={{ width: "1px", height: "24px", backgroundColor: c.grayLight, margin: "0 8px" }} />

        <Link
          href="/profile"
          title="Profile"
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: c.greenMuted, textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700, color: c.green, cursor: "pointer",
          }}
        >
          {initials}
        </Link>
      </div>
    </nav>
  );
}
