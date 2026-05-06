"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const c = {
  green: "#4A7C59", greenMuted: "#E8F0EA", white: "#FFFFFF",
  charcoal: "#2D2D2D", gray: "#6B7280", grayLight: "#E5E7EB",
};

function LogoIcon() {
  return (
    <svg width={36} height={36} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#4A7C59" />
      <circle cx="20" cy="20" r="11" stroke="#F5F3EF" strokeWidth="1.8" fill="none" />
      <path d="M11.5 9.5 Q20 18, 11.5 30.5" stroke="#F5F3EF" strokeWidth="1.8" fill="none" />
      <path d="M28.5 9.5 Q20 18, 28.5 30.5" stroke="#F5F3EF" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

export default function PlayerNav({ username, isCommissioner }: { username: string; isCommissioner: boolean }) {
  const pathname = usePathname();
  const onMyPools = pathname === "/player" || pathname.startsWith("/player/");
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 40px", backgroundColor: c.white, borderBottom: `1px solid ${c.grayLight}`,
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <Link href="/player" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <LogoIcon />
        <span style={{ fontSize: "22px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.5px" }}>Goat Pool</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Link href="/player" style={{
          padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
          background: onMyPools ? c.greenMuted : "transparent",
          color: onMyPools ? c.green : c.gray,
          fontSize: "15px", fontWeight: 500,
        }}>My Pools</Link>

        {isCommissioner && (
          <Link href="/commissioner" style={{
            padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
            background: "transparent", color: c.gray, fontSize: "15px", fontWeight: 500,
          }}>Manage Pools</Link>
        )}

        <div style={{ width: "1px", height: "24px", backgroundColor: c.grayLight, margin: "0 8px" }} />
        <Link href="/profile" style={{
          width: "36px", height: "36px", borderRadius: "50%", backgroundColor: c.greenMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: c.green, textDecoration: "none",
          cursor: "pointer",
        }}>{initials}</Link>
      </div>
    </nav>
  );
}
