"use client";
import { useState, useTransition } from "react";
import { joinPool } from "./actions";

const c = {
  green: "#4A7C59", greenMuted: "#E8F0EA", cream: "#F5F3EF",
  white: "#FFFFFF", charcoal: "#2D2D2D", gray: "#6B7280",
  grayLight: "#E5E7EB", grayLighter: "#F3F4F6",
  amber: "#D97706", amberMuted: "#FEF3C7",
};

type Props = {
  token: string;
  poolName: string;
  tournamentName: string;
  feePerLife: number;
};

export default function JoinPoolClient({ token, poolName, tournamentName, feePerLife }: Props) {
  const [lives, setLives] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCents = feePerLife * lives;
  const totalDisplay = totalCents > 0 ? `$${(totalCents / 100).toFixed(2)}` : "Free";

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinPool(token, lives);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: "440px", width: "100%", padding: "40px" }}>
        <div style={{ backgroundColor: c.white, borderRadius: "20px", padding: "40px", border: `1px solid ${c.grayLight}` }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <svg width={48} height={48} viewBox="0 0 40 40" fill="none" style={{ marginBottom: "16px" }}>
              <circle cx="20" cy="20" r="18" fill={c.green} />
              <circle cx="20" cy="20" r="11" stroke="#F5F3EF" strokeWidth="1.8" fill="none" />
              <path d="M11.5 9.5 Q20 18, 11.5 30.5" stroke="#F5F3EF" strokeWidth="1.8" fill="none" />
              <path d="M28.5 9.5 Q20 18, 28.5 30.5" stroke="#F5F3EF" strokeWidth="1.8" fill="none" />
            </svg>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: c.charcoal, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              You&apos;re invited!
            </h1>
            <p style={{ fontSize: "15px", color: c.gray, margin: 0 }}>Join <strong style={{ color: c.charcoal }}>{poolName}</strong></p>
            <p style={{ fontSize: "14px", color: c.gray, margin: "4px 0 0" }}>{tournamentName}</p>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: c.gray, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>
              How many lives?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              {([1, 2] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setLives(n)}
                  style={{
                    flex: 1, padding: "16px", borderRadius: "12px",
                    border: lives === n ? `2px solid ${c.green}` : `2px solid ${c.grayLight}`,
                    background: lives === n ? c.greenMuted : c.white,
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "22px", fontWeight: 800, color: lives === n ? c.green : c.charcoal, margin: "0 0 2px" }}>{n}</p>
                  <p style={{ fontSize: "12px", color: c.gray, margin: 0 }}>{n === 1 ? "life" : "lives"}</p>
                  {feePerLife > 0 && (
                    <p style={{ fontSize: "13px", fontWeight: 700, color: lives === n ? c.green : c.charcoal, margin: "6px 0 0" }}>
                      ${(feePerLife * n / 100).toFixed(2)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            padding: "14px 16px", borderRadius: "10px", backgroundColor: c.grayLighter,
            marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "14px", color: c.gray }}>Total due</span>
            <span style={{ fontSize: "18px", fontWeight: 800, color: c.charcoal }}>{totalDisplay}</span>
          </div>

          {feePerLife > 0 && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px", backgroundColor: c.amberMuted,
              marginBottom: "20px",
            }}>
              <p style={{ fontSize: "12px", color: c.amber, margin: 0, fontWeight: 600 }}>
                Payment collected outside the app. Your spot is reserved when you join.
              </p>
            </div>
          )}

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px", backgroundColor: "#FEF2F2",
              marginBottom: "16px",
            }}>
              <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={isPending}
            style={{
              width: "100%", padding: "14px", borderRadius: "10px", border: "none",
              background: isPending ? "#9CA3AF" : c.green,
              color: c.white, fontSize: "16px", fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? "Joining..." : `Join Pool`}
          </button>

          <p style={{ fontSize: "13px", color: c.gray, textAlign: "center", margin: "12px 0 0" }}>
            You can change your pick each round until the lock deadline.
          </p>
        </div>
      </div>
    </div>
  );
}
