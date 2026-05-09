"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const c = {
  green: "#4A7C59",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  amber: "#D97706",
  amberMuted: "#FEF3C7",
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

const NAV_LINKS = [
  { label: "Overview", href: "/admin" },
  { label: "Tournaments", href: "/admin/tournamentsetup" },
  { label: "Metrics", href: "/admin/metrics" },
] as const;

export default function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();

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
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <LogoIcon size={36} />
          <span style={{ fontSize: "22px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.5px" }}>
            Goat Pool
          </span>
        </Link>
        <span style={{
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700,
          backgroundColor: c.amberMuted,
          color: c.amber,
          marginLeft: "4px",
        }}>
          ADMIN
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          const isDisabled = false;
          return isDisabled ? (
            <span key={label} style={{
              padding: "8px 16px", borderRadius: "8px",
              color: c.grayLight, fontSize: "15px", fontWeight: 500, cursor: "default",
            }}>
              {label}
            </span>
          ) : (
            <Link key={label} href={href} style={{
              padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
              background: isActive ? c.greenMuted : "transparent",
              color: isActive ? c.green : c.gray,
              fontSize: "15px", fontWeight: 500,
            }}>
              {label}
            </Link>
          );
        })}

        <div style={{ width: "1px", height: "24px", backgroundColor: c.grayLight, margin: "0 8px" }} />

        <Link
          href="/profile"
          title="Profile"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: c.amberMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 700,
            color: c.amber,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          {username.charAt(0).toUpperCase()}
        </Link>
      </div>
    </nav>
  );
}
