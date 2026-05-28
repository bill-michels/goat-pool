"use client";
import { useState } from "react";
import Link from "next/link";
import PlayerNav from "../PlayerNav";

const c = {
  green: "#4A7C59", greenMuted: "#E8F0EA", cream: "#F5F3EF",
  white: "#FFFFFF", charcoal: "#2D2D2D", gray: "#6B7280",
  grayLight: "#E5E7EB", grayLighter: "#F3F4F6",
  red: "#EF4444", redMuted: "#FEF2F2",
  amber: "#D97706", amberMuted: "#FEF3C7",
};

function roundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "SF";
  if (fromEnd === 2) return "QF";
  return `Round ${roundNumber}`;
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

type Round = { id: string; roundNumber: number; status: string; lockDeadline: string | null };
type Player = {
  userId: string; username: string; isYou: boolean;
  status: string; livesRemaining: number; livesPurchased: number;
  completedPicks: string[];
};
type ActiveRound = {
  id: string; roundNumber: number; lockDeadline: string | null;
  hasPick: boolean; pickAthleteName: string | null;
};

type Props = {
  userId: string;
  username: string;
  isCommissioner: boolean;
  pool: { id: string; name: string; slug: string; status: string; tournamentName: string; commissionerUsername: string; totalRounds: number };
  membership: { status: string; livesRemaining: number; livesPurchased: number } | null;
  rounds: Round[];
  players: Player[];
  activeRound: ActiveRound | null;
  totalPlayers: number;
  aliveCount: number;
  eliminatedCount: number;
};

export default function PoolViewClient({
  username, isCommissioner, pool, membership, rounds, players,
  activeRound, totalPlayers, aliveCount, eliminatedCount,
}: Props) {
  const [selectedRound, setSelectedRound] = useState<string | null>(null);

  const myPlayer = players.find(p => p.isYou);
  const usedPicks = myPlayer?.completedPicks ?? [];

  const isAlive = membership?.status === "alive";
  const canPickRound = activeRound && isAlive;
  const pickButtonLabel = canPickRound
    ? (activeRound.hasPick ? "Change Pick" : "Place Pick")
    : null;

  const selectedRoundData = selectedRound ? rounds.find(r => r.id === selectedRound) : null;
  const selectedPicks = selectedRound
    ? players.map(p => ({
        username: p.username,
        pick: p.completedPicks[rounds.filter(r => r.status === "completed" || r.status === "locked").findIndex(r => r.id === selectedRound)] ?? null,
      })).filter(p => p.pick)
    : [];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      <PlayerNav username={username} isCommissioner={isCommissioner} />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          <Link href="/player" style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>My Pools</Link>
          <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
          <span style={{ fontSize: "14px", color: c.charcoal, fontWeight: 600 }}>{pool.name}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: 0, letterSpacing: "-0.5px" }}>{pool.name}</h1>
              <span style={{
                padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                backgroundColor: (pool.status === "active" || pool.status === "open") ? c.greenMuted : c.grayLighter,
                color: (pool.status === "active" || pool.status === "open") ? c.green : c.gray,
              }}>
                {(pool.status === "active" || pool.status === "open") ? "Live" : pool.status === "cancelled" ? "Cancelled" : "Concluded"}
              </span>
            </div>
            <p style={{ fontSize: "14px", color: c.gray, margin: "0 0 2px" }}>
              Commissioner: {pool.commissionerUsername}
            </p>
            <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>
              Tournament: {pool.tournamentName}
            </p>
          </div>
          {canPickRound && (
            <Link href={`/player/${pool.slug}/placepick`} style={{
              padding: "12px 24px", borderRadius: "10px", border: "none",
              background: c.green, color: c.white, fontSize: "15px", fontWeight: 600,
              textDecoration: "none", boxShadow: "0 2px 8px rgba(74,124,89,0.3)",
            }}>
              {pickButtonLabel}
            </Link>
          )}
        </div>

        {/* Your Status */}
        {membership && (
          <>
            <div style={{
              padding: "20px 24px", borderRadius: "14px", backgroundColor: c.white,
              border: `1px solid ${c.grayLight}`, marginBottom: usedPicks.length > 0 ? "8px" : "20px",
              display: "flex", gap: "32px", alignItems: "center", flexWrap: "nowrap", overflowX: "auto",
            }}>
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Your Status</p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isAlive ? c.green : c.red, flexShrink: 0 }} />
                  <span style={{ fontSize: "16px", fontWeight: 700, color: isAlive ? c.green : c.red, whiteSpace: "nowrap" }}>
                    {membership.status === "winner" ? "Winner!" : isAlive ? "Alive" : "Eliminated"}
                  </span>
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Lives</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: membership.livesRemaining === 1 ? c.amber : c.green, margin: 0, whiteSpace: "nowrap" }}>
                  {membership.livesRemaining} of {membership.livesPurchased}
                </p>
              </div>
              {activeRound && (
                <div style={{ flexShrink: 0 }}>
                  <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Current Round</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: c.charcoal, margin: 0, whiteSpace: "nowrap" }}>
                    {roundLabel(activeRound.roundNumber, pool.totalRounds)}
                  </p>
                </div>
              )}
              {activeRound?.hasPick && activeRound.pickAthleteName && (
                <div style={{ flexShrink: 0 }}>
                  <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Current Round Pick</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: c.charcoal, margin: 0, whiteSpace: "nowrap" }}>{activeRound.pickAthleteName}</p>
                </div>
              )}
              {activeRound?.lockDeadline && (
                <div style={{ flexShrink: 0, marginLeft: "auto" }}>
                  <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Next Lock Date</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: c.charcoal, margin: 0, whiteSpace: "nowrap" }}>{formatDeadline(activeRound.lockDeadline)}</p>
                </div>
              )}
            </div>

            {usedPicks.length > 0 && (
              <div style={{
                padding: "16px 24px", borderRadius: "14px", backgroundColor: c.white,
                border: `1px solid ${c.grayLight}`, marginBottom: "20px",
              }}>
                <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Used Picks</p>
                <p style={{ fontSize: "14px", fontWeight: 500, color: c.charcoal, margin: 0 }}>{usedPicks.join(", ")}</p>
              </div>
            )}
          </>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Players", value: String(totalPlayers), color: c.charcoal },
            { label: "Alive", value: String(aliveCount), color: c.green },
            { label: "Eliminated", value: String(eliminatedCount), color: c.red },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, backgroundColor: c.white, borderRadius: "14px", padding: "20px", border: `1px solid ${c.grayLight}`, textAlign: "center" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: c.gray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color, margin: 0, letterSpacing: "-1px" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Rounds & Lock Dates */}
        {rounds.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: c.charcoal, margin: 0 }}>Rounds &amp; Lock Dates</p>
              <p style={{ fontSize: "11px", color: c.gray, margin: 0 }}>Dates may shift based on match times</p>
            </div>
            <div style={{ backgroundColor: c.white, borderRadius: "12px", border: `1px solid ${c.grayLight}`, overflow: "hidden" }}>
              {rounds.map((r, i) => {
                const isDone = r.status === "completed" || r.status === "locked";
                const isActive = r.status === "active";
                const isSelected = selectedRound === r.id;
                const completedRounds = rounds.filter(r => r.status === "completed" || r.status === "locked");
                const pickIdx = completedRounds.findIndex(cr => cr.id === r.id);
                return (
                  <div key={r.id}>
                    <div
                      onClick={() => isDone && setSelectedRound(isSelected ? null : r.id)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 16px",
                        borderTop: i > 0 ? `1px solid ${c.grayLight}` : "none",
                        backgroundColor: isSelected ? c.grayLighter : isActive ? c.greenMuted : "transparent",
                        cursor: isDone ? "pointer" : "default",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "13px", fontWeight: isActive ? 700 : 500, color: isDone ? c.gray : isActive ? c.green : c.charcoal }}>
                          {roundLabel(r.roundNumber, pool.totalRounds)}
                        </span>
                        {isActive && (
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "5px", backgroundColor: c.green, color: c.white }}>Active</span>
                        )}
                        {isDone && (
                          <span style={{ fontSize: "11px", color: c.gray }}>
                            {isSelected ? "Hide picks ▲" : "View picks ▼"}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "13px", color: isDone ? c.gray : c.charcoal, textDecoration: isDone ? "line-through" : "none" }}>
                        {r.lockDeadline ? formatDeadline(r.lockDeadline) : "—"}
                      </span>
                    </div>

                    {/* Inline picks drawer */}
                    {isSelected && pickIdx >= 0 && (
                      <div style={{ borderTop: `1px solid ${c.grayLight}` }}>
                        {players
                          .filter(p => p.completedPicks[pickIdx])
                          .map(p => (
                            <div key={p.userId} style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "10px 16px 10px 28px", fontSize: "14px",
                              borderTop: `1px solid ${c.grayLight}`,
                              backgroundColor: p.isYou ? c.greenMuted : c.grayLighter,
                            }}>
                              <span style={{ fontWeight: p.isYou ? 700 : 500, color: c.charcoal }}>
                                {p.username}{p.isYou ? " (you)" : ""}
                              </span>
                              <span style={{ color: c.charcoal, fontWeight: 600 }}>{p.completedPicks[pickIdx]}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Standings Table */}
        <div style={{ backgroundColor: c.white, borderRadius: "14px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.7fr 3fr",
            padding: "12px 20px", backgroundColor: c.grayLighter,
            fontSize: "12px", fontWeight: 600, color: c.gray,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <span>Player</span><span>Status</span><span>Lives</span><span>Previous Picks</span>
          </div>
          {players.map((p) => (
            <div key={p.userId} style={{
              display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.7fr 3fr",
              padding: "14px 20px", fontSize: "14px",
              borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
              backgroundColor: p.isYou ? c.greenMuted : "transparent",
            }}>
              <span style={{ fontWeight: p.isYou ? 700 : 500, color: c.charcoal }}>
                {p.username}{p.isYou ? " (you)" : ""}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.status === "alive" ? c.green : c.red }} />
                <span style={{ fontSize: "13px", fontWeight: 500, color: p.status === "alive" ? c.green : c.red }}>
                  {p.status === "alive" ? "Alive" : "Out"}
                </span>
              </span>
              <span style={{ fontWeight: 600, color: p.livesRemaining > 0 ? c.charcoal : c.gray }}>
                {p.livesRemaining > 0 ? `${p.livesRemaining} left` : "—"}
              </span>
              <span style={{ fontSize: "13px", color: c.gray }}>
                {p.completedPicks.length > 0 ? p.completedPicks.join(", ") : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
