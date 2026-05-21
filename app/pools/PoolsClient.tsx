"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestToJoin } from "./actions";

const c = {
  green: "#4A7C59", greenMuted: "#E8F0EA", cream: "#F5F3EF",
  white: "#FFFFFF", charcoal: "#2D2D2D", gray: "#6B7280",
  grayLight: "#E5E7EB", grayLighter: "#F3F4F6",
  amber: "#D97706", amberMuted: "#FEF3C7",
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

type Pool = {
  id: string;
  name: string;
  slug: string;
  feePerLife: number;
  tournamentName: string;
  playerCount: number;
  hasRequested: boolean;
  isMember: boolean;
};

export default function PoolsClient({ pools, isLoggedIn }: { pools: Pool[]; isLoggedIn: boolean }) {
  const router = useRouter();
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(() => {
    const s = new Set<string>();
    pools.filter(p => p.hasRequested).forEach(p => s.add(p.id));
    return s;
  });
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async (poolId: string) => {
    if (!isLoggedIn) {
      router.push(`/login?next=/pools`);
      return;
    }
    setRequesting(poolId);
    setError(null);
    const result = await requestToJoin(poolId);
    if (result.error) {
      setError(result.error);
    } else {
      setRequested(prev => { const s = new Set(prev); s.add(poolId); return s; });
    }
    setRequesting(null);
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", backgroundColor: c.white, borderBottom: `1px solid ${c.grayLight}` }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <LogoIcon size={36} />
          <span style={{ fontSize: "22px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.5px" }}>Goat Pool</span>
        </Link>
        <div style={{ display: "flex", gap: "12px" }}>
          {isLoggedIn ? (
            <Link href="/player" style={{ padding: "8px 16px", borderRadius: "8px", background: c.green, color: c.white, fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
              My Pools
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${c.grayLight}`, color: c.charcoal, fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                Sign In
              </Link>
              <Link href="/login?mode=signup" style={{ padding: "8px 16px", borderRadius: "8px", background: c.green, color: c.white, fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 40px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: c.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Open Pools</h1>
        <p style={{ fontSize: "16px", color: c.gray, margin: "0 0 32px" }}>
          These pools are accepting join requests. Request to join and the commissioner will send you an invite.
        </p>

        {error && (
          <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444", fontSize: "14px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {pools.length === 0 ? (
          <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "48px", border: `1px solid ${c.grayLight}`, textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: c.gray, margin: 0 }}>No pools are currently accepting join requests.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {pools.map((pool) => {
              const isReq = requested.has(pool.id);
              const isLoading = requesting === pool.id;
              return (
                <div key={pool.id} style={{ backgroundColor: c.white, borderRadius: "16px", padding: "24px", border: `1px solid ${c.grayLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <div>
                    <p style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: "0 0 4px" }}>{pool.name}</p>
                    <p style={{ fontSize: "14px", color: c.gray, margin: "0 0 8px" }}>{pool.tournamentName}</p>
                    <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: c.gray }}>
                      <span><strong style={{ color: c.charcoal }}>{pool.playerCount}</strong> players</span>
                      <span><strong style={{ color: c.charcoal }}>{pool.feePerLife > 0 ? `$${(pool.feePerLife / 100).toFixed(2)}` : "Free"}</strong>{pool.feePerLife > 0 ? " per life" : ""}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {pool.isMember ? (
                      <Link href={`/player/${pool.slug}`} style={{ display: "inline-block", padding: "10px 20px", borderRadius: "10px", background: c.green, color: c.white, fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                        View Pool
                      </Link>
                    ) : isReq ? (
                      <span style={{ padding: "10px 20px", borderRadius: "10px", backgroundColor: c.greenMuted, color: c.green, fontSize: "14px", fontWeight: 600 }}>
                        Requested ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequest(pool.id)}
                        disabled={isLoading}
                        style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: isLoading ? "#9CA3AF" : c.green, color: c.white, fontSize: "14px", fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer" }}
                      >
                        {isLoading ? "Requesting..." : isLoggedIn ? "Request to Join" : "Sign In to Request"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
