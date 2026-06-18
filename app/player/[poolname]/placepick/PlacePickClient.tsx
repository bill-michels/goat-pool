"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import PlayerNav from "../../PlayerNav";
import { placePick } from "./actions";

const c = {
  green: "#4A7C59", greenMuted: "#E8F0EA", cream: "#F5F3EF",
  white: "#FFFFFF", charcoal: "#2D2D2D", gray: "#6B7280",
  grayLight: "#E5E7EB", grayLighter: "#F3F4F6",
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

type Athlete = { id: string; name: string; seed: number };

type Props = {
  username: string;
  isCommissioner: boolean;
  pool: { id: string; name: string; slug: string };
  activeRound: { id: string; roundNumber: number; lockDeadline: string | null; totalRounds: number };
  membership: { livesRemaining: number; livesPurchased: number };
  athletes: Athlete[];
  previousPickNames: string[];
  existingPickId: string | null;
  existingPickAthleteId: string | null;
  isPreviewOnly: boolean;
  previousRoundLabel: string | null;
};

export default function PlacePickClient({
  username, isCommissioner, pool, activeRound, membership,
  athletes, previousPickNames, existingPickId, existingPickAthleteId,
  isPreviewOnly, previousRoundLabel,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(existingPickAthleteId);
  const [search, setSearch] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAthlete = athletes.find(a => a.id === selectedId) ?? null;
  const filtered = athletes.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const rLabel = roundLabel(activeRound.roundNumber, activeRound.totalRounds);

  function handleConfirm() {
    if (!selectedId) return;
    setError(null);
    startTransition(async () => {
      const result = await placePick(pool.id, activeRound.id, selectedId, pool.slug, existingPickId);
      if (result?.error) setError(result.error);
    });
  }

  if (confirmed && selectedAthlete) {
    const livesUsed = membership.livesPurchased - membership.livesRemaining + 1;
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
        <PlayerNav username={username} isCommissioner={isCommissioner} />
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "80px 40px", textAlign: "center" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%", backgroundColor: c.greenMuted,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke={c.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Pick Locked In</h1>
          <p style={{ fontSize: "17px", color: c.gray, margin: "0 0 8px" }}>
            You picked <strong style={{ color: c.charcoal }}>{selectedAthlete.name}</strong> for {rLabel}.
          </p>
          <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 8px" }}>
            Life {livesUsed} of {membership.livesPurchased}
          </p>
          <p style={{ fontSize: "14px", color: c.gray, margin: "0 0 32px" }}>
            Your pick is hidden from other players until the round locks.
          </p>
          <Link href={`/player/${pool.slug}`} style={{
            display: "inline-block", padding: "12px 24px", borderRadius: "10px",
            border: `1.5px solid ${c.grayLight}`, background: c.white,
            color: c.charcoal, fontSize: "15px", fontWeight: 600, textDecoration: "none",
          }}>
            Back to Pool
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      <PlayerNav username={username} isCommissioner={isCommissioner} />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          <Link href="/player" style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>My Pools</Link>
          <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
          <Link href={`/player/${pool.slug}`} style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>{pool.name}</Link>
          <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
          <span style={{ fontSize: "14px", color: c.charcoal, fontWeight: 600 }}>Place Pick</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          {rLabel} — {isPreviewOnly ? "Preview Picks" : existingPickId ? "Change Your Pick" : "Place Your Pick"}
        </h1>
        <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 24px" }}>
          {isPreviewOnly ? "Browse available athletes for this round." : "Choose one athlete to win this round."}
        </p>

        {isPreviewOnly && (
          <div style={{
            backgroundColor: c.amberMuted, border: `1px solid #FCD34D`,
            borderRadius: "12px", padding: "14px 18px", marginBottom: "24px",
          }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: c.amber, margin: "0 0 4px" }}>
              {previousRoundLabel} results still coming in
            </p>
            <p style={{ fontSize: "13px", color: c.amber, margin: 0 }}>
              You can browse available athletes now, but your pick will unlock once all {previousRoundLabel} matches are final.
            </p>
          </div>
        )}

        {/* Life + Deadline Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <div style={{
            flex: 1, padding: "14px 16px", borderRadius: "10px",
            backgroundColor: c.white, border: `1px solid ${c.grayLight}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: c.charcoal }}>
              {membership.livesRemaining} of {membership.livesPurchased} lives
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              {Array.from({ length: membership.livesPurchased }, (_, i) => (
                <span key={i} style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  backgroundColor: i < membership.livesRemaining ? c.green : "#EF4444",
                }} />
              ))}
            </div>
          </div>
          {activeRound.lockDeadline && (
            <div style={{
              flex: 1, padding: "14px 16px", borderRadius: "10px",
              backgroundColor: c.amberMuted,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: c.amber }}>
                Due: {formatDeadline(activeRound.lockDeadline)}
              </span>
            </div>
          )}
        </div>

        {/* Previous Picks */}
        {previousPickNames.length > 0 && (
          <div style={{
            backgroundColor: c.white, borderRadius: "12px", padding: "14px 20px",
            border: `1px solid ${c.grayLight}`, marginBottom: "24px",
            display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: c.gray, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              Already picked:
            </span>
            <span style={{ fontSize: "14px", color: c.charcoal, fontWeight: 500 }}>
              {previousPickNames.join(", ")}
            </span>
            <span style={{ fontSize: "12px", color: c.gray, whiteSpace: "nowrap" }}>(unavailable)</span>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search athletes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "12px 14px",
            border: `1.5px solid ${c.grayLight}`, borderRadius: "10px",
            fontSize: "15px", color: c.charcoal, boxSizing: "border-box",
            marginBottom: "8px", outline: "none",
          }}
        />
        <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 12px" }}>
          {athletes.length} athletes available — click to select
        </p>

        {/* Athlete List */}
        <div style={{
          backgroundColor: c.white, borderRadius: "14px", overflow: "hidden",
          border: `1px solid ${c.grayLight}`, marginBottom: "24px",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "0.5fr 2fr 0.5fr",
            padding: "10px 20px", backgroundColor: c.grayLighter,
            fontSize: "12px", fontWeight: 600, color: c.gray,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <span>Seed</span><span>Athlete</span><span></span>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: "24px 20px", textAlign: "center", fontSize: "14px", color: c.gray }}>
              No athletes match your search.
            </div>
          )}
          {filtered.map((a) => {
            const isSelected = selectedId === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                style={{
                  display: "grid", gridTemplateColumns: "0.5fr 2fr 0.5fr",
                  padding: "14px 20px", fontSize: "14px",
                  borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
                  cursor: "pointer",
                  backgroundColor: isSelected ? c.greenMuted : "transparent",
                  transition: "background-color 0.1s",
                }}
              >
                <span style={{ fontWeight: 700, color: c.green }}>{a.seed >= 100 ? "—" : a.seed}</span>
                <span style={{ fontWeight: 600, color: c.charcoal }}>{a.name}</span>
                <span style={{ textAlign: "right" }}>
                  {isSelected && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill={c.green} />
                      <path d="M6 10.5 L9 13.5 L14.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#FEF2F2", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{error}</p>
          </div>
        )}

        <button
          onClick={() => {
            if (!selectedId || isPending || isPreviewOnly) return;
            if (!existingPickId) {
              setConfirmed(true);
              handleConfirm();
            } else {
              handleConfirm();
            }
          }}
          disabled={!selectedId || isPending || isPreviewOnly}
          style={{
            width: "100%", padding: "14px", borderRadius: "10px", border: "none",
            background: selectedId && !isPending && !isPreviewOnly ? c.green : c.grayLight,
            color: selectedId && !isPending && !isPreviewOnly ? c.white : c.gray,
            fontSize: "16px", fontWeight: 600,
            cursor: selectedId && !isPending && !isPreviewOnly ? "pointer" : "default",
          }}
        >
          {isPreviewOnly
            ? `Picks open when ${previousRoundLabel} results are final`
            : isPending
            ? "Saving..."
            : selectedAthlete
            ? `Confirm Pick: ${selectedAthlete.name}`
            : "Select an athlete above"}
        </button>

        <p style={{ fontSize: "13px", color: c.gray, textAlign: "center", margin: "12px 0 0" }}>
          {isPreviewOnly ? "" : "You can change your pick until the round locks."}
        </p>
      </div>
    </div>
  );
}
