"use client";
import Link from "next/link";
import PlayerNav from "./PlayerNav";

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

type ActiveRound = {
  id: string;
  roundNumber: number;
  lockDeadline: string | null;
  hasPick: boolean;
};

type PoolEntry = {
  poolId: string;
  poolName: string;
  poolSlug: string;
  poolStatus: string;
  tournamentName: string;
  totalRounds: number;
  playerStatus: string;
  livesRemaining: number;
  livesPurchased: number;
  pickCount: number;
  activeRound: ActiveRound | null;
};

function PoolCard({ pool }: { pool: PoolEntry }) {
  const isAlive = pool.playerStatus === "alive";
  const isWinner = pool.playerStatus === "winner";
  const isEliminated = pool.playerStatus === "eliminated";
  const isActive = pool.poolStatus === "active" || pool.poolStatus === "open";
  const hasActiveRound = !!pool.activeRound;
  const needsPick = isAlive && isActive && hasActiveRound && !pool.activeRound!.hasPick;

  const statusLabel = isWinner ? "Winner!" : isEliminated ? "Eliminated" : isActive ? "Live" : pool.poolStatus === "cancelled" ? "Cancelled" : "Concluded";
  const statusColor = (isWinner || isActive) ? c.green : isEliminated ? c.red : c.gray;
  const statusBg = (isWinner || isActive) ? c.greenMuted : isEliminated ? c.redMuted : c.grayLighter;

  const livesColor = pool.livesRemaining === 1 ? c.amber : c.green;

  const currentRoundLabel = pool.activeRound
    ? roundLabel(pool.activeRound.roundNumber, pool.totalRounds)
    : null;

  return (
    <Link href={`/player/${pool.poolSlug}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        backgroundColor: c.white, borderRadius: "14px", padding: "24px",
        border: `1px solid ${c.grayLight}`, opacity: isEliminated ? 0.75 : 1,
        transition: "box-shadow 0.1s",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: "0 0 4px" }}>{pool.poolName}</h3>
            <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>{pool.tournamentName}</p>
          </div>
          <span style={{
            padding: "5px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
            backgroundColor: statusBg, color: statusColor,
          }}>{statusLabel}</span>
        </div>

        {isAlive && isActive && (
          <>
            <div style={{ display: "flex", gap: "24px", marginBottom: "14px" }}>
              <div>
                <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Round</p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: 0 }}>
                  {currentRoundLabel ?? "—"}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lives</p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: livesColor, margin: 0 }}>
                  {pool.livesRemaining} of {pool.livesPurchased}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Picks Made</p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: c.charcoal, margin: 0 }}>{pool.pickCount}</p>
              </div>
            </div>

            {needsPick && pool.activeRound?.lockDeadline && (
              <div style={{
                padding: "10px 14px", borderRadius: "8px", backgroundColor: c.amberMuted,
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: c.amber }}>
                  Pick due: {formatDeadline(pool.activeRound.lockDeadline)}
                </span>
              </div>
            )}

            {!needsPick && hasActiveRound && (
              <div style={{
                padding: "10px 14px", borderRadius: "8px", backgroundColor: c.greenMuted,
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: c.green }}>
                  Pick submitted for {currentRoundLabel}
                </span>
              </div>
            )}
          </>
        )}

        {isEliminated && (
          <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>
            Eliminated · {pool.pickCount} picks made
          </p>
        )}

        {isWinner && (
          <p style={{ fontSize: "14px", color: c.green, fontWeight: 600, margin: 0 }}>
            Survived all {pool.pickCount} rounds!
          </p>
        )}

        {!isAlive && !isEliminated && !isWinner && pool.poolStatus !== "active" && (
          <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>{pool.pickCount} picks made</p>
        )}
      </div>
    </Link>
  );
}

type Props = {
  username: string;
  isCommissioner: boolean;
  pools: PoolEntry[];
};

export default function PlayerDashClient({ username, isCommissioner, pools }: Props) {
  const isCurrentPool = (p: PoolEntry) =>
    p.playerStatus === "alive" && (p.poolStatus === "active" || p.poolStatus === "open");

  const pickNeeded = pools.filter(
    p => p.playerStatus === "alive" && p.poolStatus === "active" && p.activeRound && !p.activeRound.hasPick
  );
  const active = pools.filter(
    p => isCurrentPool(p) && !(p.poolStatus === "active" && p.activeRound && !p.activeRound.hasPick)
  );
  const past = pools.filter(p => !isCurrentPool(p));

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      <PlayerNav username={username} isCommissioner={isCommissioner} />

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          My Pools
        </h1>
        <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 32px" }}>
          Pools you&apos;re playing in.
        </p>

        {pools.length === 0 && (
          <div style={{
            backgroundColor: c.white, borderRadius: "14px", padding: "40px",
            border: `1px solid ${c.grayLight}`, textAlign: "center",
          }}>
            <p style={{ fontSize: "16px", color: c.gray, margin: "0 0 8px" }}>You&apos;re not in any pools yet.</p>
            <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>Accept an invite link from a Commissioner to join a pool.</p>
          </div>
        )}

        {pickNeeded.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: c.amber }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: c.charcoal, margin: 0 }}>Pick Needed</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pickNeeded.map(p => <PoolCard key={p.poolId} pool={p} />)}
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: c.green }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: c.charcoal, margin: 0 }}>
                {pickNeeded.length > 0 ? "Pick Submitted" : "Active Pools"}
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {active.map(p => <PoolCard key={p.poolId} pool={p} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: c.charcoal, margin: "0 0 16px" }}>Past Pools</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {past.map(p => <PoolCard key={p.poolId} pool={p} />)}
            </div>
          </div>
        )}

        {/* Start a Pool CTA */}
        <div style={{
          padding: "20px 24px", borderRadius: "14px",
          border: `1.5px dashed ${c.grayLight}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: c.charcoal, margin: "0 0 2px" }}>Want to run your own pool?</p>
            <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>Create a pool for the next tournament and invite your friends.</p>
          </div>
          <Link href="/commissioner/startpool" style={{
            padding: "10px 18px", borderRadius: "10px", border: "none",
            background: c.green, color: c.white, fontSize: "14px", fontWeight: 600,
            textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Start a Pool
          </Link>
        </div>
      </div>
    </div>
  );
}
