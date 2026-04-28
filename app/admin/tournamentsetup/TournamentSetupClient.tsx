"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const c = {
  green: "#4A7C59",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  grayLighter: "#F3F4F6",
  amber: "#D97706",
  amberMuted: "#FEF3C7",
  red: "#EF4444",
  redMuted: "#FEF2F2",
};

const ROUND_LABELS = ["Round 1", "Round 2", "Round 3", "Round 4", "QF", "SF", "Final"];

function roundLabel(i: number) {
  return ROUND_LABELS[i] ?? `Round ${i + 1}`;
}

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

function Nav({ username }: { username: string }) {
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 40px", backgroundColor: c.white, borderBottom: `1px solid ${c.grayLight}`,
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <LogoIcon size={36} />
          <span style={{ fontSize: "22px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.5px" }}>Goat Pool</span>
        </Link>
        <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: c.amberMuted, color: c.amber, marginLeft: "4px" }}>ADMIN</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {["Overview", "Tournaments", "Metrics"].map((tab) => (
          <button key={tab} style={{
            padding: "8px 16px", borderRadius: "8px", border: "none",
            background: tab === "Tournaments" ? c.greenMuted : "transparent",
            color: tab === "Tournaments" ? c.green : c.gray,
            fontSize: "15px", fontWeight: 500, cursor: "pointer",
          }}>{tab}</button>
        ))}
        <div style={{ width: "1px", height: "24px", backgroundColor: c.grayLight, margin: "0 8px" }} />
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%", backgroundColor: c.amberMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: c.amber, cursor: "pointer",
        }}>
          {username.charAt(0).toUpperCase()}
        </div>
      </div>
    </nav>
  );
}

function inputStyle() {
  return {
    width: "100%", padding: "12px 14px",
    border: `1.5px solid ${c.grayLight}`, borderRadius: "10px",
    fontSize: "15px", color: c.charcoal, boxSizing: "border-box" as const,
    backgroundColor: c.white,
  };
}

// ── View 1: Create Tournament ──────────────────────────────────────────────

function CreateTournament({
  userId,
  onCreated,
  initialTournament,
  initialRounds,
}: {
  userId: string;
  onCreated: (tournament: any, rounds: any[]) => void;
  initialTournament: any;
  initialRounds: any[];
}) {
  const supabase = createClient();
  const [name, setName] = useState(initialTournament?.name ?? "");
  const [numRounds, setNumRounds] = useState(String(initialTournament?.num_rounds ?? 7));
  const [deadlines, setDeadlines] = useState<Record<number, string>>(() => {
    const d: Record<number, string> = {};
    initialRounds.forEach((r) => {
      if (r.lock_deadline) d[r.round_number] = r.lock_deadline.slice(0, 16);
    });
    return d;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roundCount = Math.min(Math.max(Number(numRounds) || 0, 1), 10);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Tournament name is required."); return; }
    if (!numRounds || roundCount < 1) { setError("Number of rounds is required."); return; }
    for (let i = 1; i <= roundCount; i++) {
      if (!deadlines[i]) { setError(`Lock deadline required for ${roundLabel(i - 1)}.`); return; }
    }

    setLoading(true);
    setError(null);

    let tournament = initialTournament;

    if (!tournament) {
      const { data, error: tErr } = await supabase
        .from("tournaments")
        .insert({ name: name.trim(), num_rounds: roundCount, status: "upcoming", created_by: userId })
        .select()
        .single();
      if (tErr) { setError(tErr.message); setLoading(false); return; }
      tournament = data;
    }

    // Upsert rounds
    const roundsPayload = Array.from({ length: roundCount }, (_, i) => ({
      tournament_id: tournament.id,
      round_number: i + 1,
      lock_deadline: new Date(deadlines[i + 1]).toISOString(),
      status: i === 0 ? "active" : "upcoming",
    }));

    const { data: roundsData, error: rErr } = await supabase
      .from("rounds")
      .upsert(roundsPayload, { onConflict: "tournament_id,round_number" })
      .select();

    if (rErr) { setError(rErr.message); setLoading(false); return; }

    onCreated(tournament, roundsData ?? []);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
        <Link href="/admin" style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>Admin</Link>
        <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
        <span style={{ fontSize: "14px", color: c.charcoal, fontWeight: 600 }}>
          {initialTournament ? initialTournament.name : "New Tournament"}
        </span>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        {initialTournament ? "Edit Tournament" : "Create Tournament"}
      </h1>
      <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 32px" }}>
        Set up a new tournament. You&apos;ll add athletes next.
      </p>

      {error && (
        <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: c.redMuted, border: `1px solid #FECACA`, color: c.red, fontSize: "14px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "32px", border: `1px solid ${c.grayLight}` }}>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
            Tournament Name
          </label>
          <input
            type="text"
            placeholder="e.g., Wimbledon 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle()}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
            Number of Rounds
          </label>
          <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 8px" }}>
            For Grand Slams this is typically 7 (128-draw).
          </p>
          <input
            type="number"
            placeholder="7"
            value={numRounds}
            min={1}
            max={10}
            onChange={(e) => setNumRounds(e.target.value)}
            style={{ ...inputStyle(), maxWidth: "120px" }}
          />
        </div>

        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
            Round Lock Deadlines
          </label>
          <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 10px" }}>
            Set the pick submission deadline for each round. You can adjust these as play develops.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Array.from({ length: roundCount }, (_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: c.charcoal, minWidth: "70px" }}>
                  {roundLabel(i)}
                </span>
                <input
                  type="datetime-local"
                  value={deadlines[i + 1] ?? ""}
                  onChange={(e) => setDeadlines((prev) => ({ ...prev, [i + 1]: e.target.value }))}
                  style={{
                    flex: 1, padding: "10px 12px",
                    border: `1.5px solid ${c.grayLight}`, borderRadius: "8px",
                    fontSize: "14px", color: c.charcoal,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "10px", border: "none",
            background: loading ? "#9CA3AF" : c.green, color: c.white,
            fontSize: "15px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Saving..." : "Continue — Add Athletes"}
        </button>
      </div>
    </div>
  );
}

// ── View 2: Add Athletes ───────────────────────────────────────────────────

interface Athlete {
  id?: string;
  name: string;
  seed: number;
  has_bye: boolean;
  status: string;
}

function AddAthletes({
  tournament,
  initialAthletes,
  onDone,
  onBack,
}: {
  tournament: any;
  initialAthletes: Athlete[];
  onDone: (athletes: Athlete[]) => void;
  onBack: () => void;
}) {
  const supabase = createClient();
  const [athletes, setAthletes] = useState<Athlete[]>(initialAthletes);
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseBulk = () => {
    setError(null);
    const entries = bulkText.split(",").map((s) => s.trim()).filter(Boolean);
    const parsed: Athlete[] = [];
    for (const entry of entries) {
      const match = entry.match(/^(.+?)\s*\((\d+)\)$/);
      if (!match) { setError(`Could not parse: "${entry}". Use format: Name (Seed)`); return; }
      const name = match[1].trim();
      const seed = parseInt(match[2]);
      if (athletes.some((a) => a.seed === seed) || parsed.some((a) => a.seed === seed)) {
        setError(`Duplicate seed ${seed}.`); return;
      }
      parsed.push({ name, seed, has_bye: seed <= 4, status: "active" });
    }
    setAthletes((prev) => [...prev, ...parsed].sort((a, b) => a.seed - b.seed));
    setBulkText("");
  };

  const toggleBye = (seed: number) => {
    setAthletes((prev) => prev.map((a) => a.seed === seed ? { ...a, has_bye: !a.has_bye } : a));
  };

  const removeAthlete = (seed: number) => {
    setAthletes((prev) => prev.filter((a) => a.seed !== seed));
  };

  const handleSave = async () => {
    if (athletes.length === 0) { setError("Add at least one athlete."); return; }
    setSaving(true);
    setError(null);

    const payload = athletes.map((a) => ({
      ...(a.id ? { id: a.id } : {}),
      tournament_id: tournament.id,
      name: a.name,
      seed: a.seed,
      has_bye: a.has_bye,
      status: a.status,
    }));

    const { data, error: err } = await supabase
      .from("athletes")
      .upsert(payload, { onConflict: "tournament_id,seed" })
      .select();

    if (err) { setError(err.message); setSaving(false); return; }
    onDone(data ?? []);
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: "740px", margin: "0 auto", padding: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
        <Link href="/admin" style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>Admin</Link>
        <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
        <button onClick={onBack} style={{ fontSize: "14px", color: c.gray, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {tournament.name}
        </button>
        <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
        <span style={{ fontSize: "14px", color: c.charcoal, fontWeight: 600 }}>Athletes</span>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Add Athletes</h1>
      <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 24px" }}>
        {tournament.name} — Add athletes with their seed and bye status.
      </p>

      {error && (
        <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: c.redMuted, border: `1px solid #FECACA`, color: c.red, fontSize: "14px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Bulk Add */}
      <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "24px", border: `1px solid ${c.grayLight}`, marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
          Quick Add
        </label>
        <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 8px" }}>
          Comma-separated: Name (Seed), Name (Seed), ... Seeds 1–4 get a bye by default.
        </p>
        <textarea
          placeholder="Jannik Sinner (1), Carlos Alcaraz (2), Novak Djokovic (3), ..."
          rows={3}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          style={{
            width: "100%", padding: "12px 14px", border: `1.5px solid ${c.grayLight}`,
            borderRadius: "10px", fontSize: "14px", color: c.charcoal,
            resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            marginBottom: "12px",
          }}
        />
        <button
          onClick={parseBulk}
          disabled={!bulkText.trim()}
          style={{
            padding: "10px 20px", borderRadius: "8px", border: "none",
            background: bulkText.trim() ? c.green : "#9CA3AF",
            color: c.white, fontSize: "14px", fontWeight: 600,
            cursor: bulkText.trim() ? "pointer" : "not-allowed",
          }}
        >
          Add Athletes
        </button>
      </div>

      {/* Athlete List */}
      {athletes.length > 0 && (
        <div style={{ backgroundColor: c.white, borderRadius: "14px", overflow: "hidden", border: `1px solid ${c.grayLight}`, marginBottom: "20px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "0.5fr 2fr 0.8fr 0.5fr",
            padding: "12px 20px", backgroundColor: c.grayLighter,
            fontSize: "12px", fontWeight: 600, color: c.gray,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <span>Seed</span><span>Athlete</span><span>Bye (R1)</span><span></span>
          </div>

          {athletes.map((a) => (
            <div key={a.seed} style={{
              display: "grid", gridTemplateColumns: "0.5fr 2fr 0.8fr 0.5fr",
              padding: "14px 20px", fontSize: "14px",
              borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
            }}>
              <span style={{ fontWeight: 700, color: c.green }}>{a.seed}</span>
              <span style={{ fontWeight: 600, color: c.charcoal }}>{a.name}</span>
              <span>
                <button
                  onClick={() => toggleBye(a.seed)}
                  style={{
                    fontSize: "12px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px",
                    border: "none", cursor: "pointer",
                    backgroundColor: a.has_bye ? c.amberMuted : c.grayLighter,
                    color: a.has_bye ? c.amber : c.gray,
                  }}
                >
                  {a.has_bye ? "Bye" : "No bye"}
                </button>
              </span>
              <span style={{ textAlign: "right" }}>
                <button
                  onClick={() => removeAthlete(a.seed)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: c.gray }}
                >
                  ×
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {athletes.length > 0 && (
        <p style={{ fontSize: "13px", color: c.gray, marginBottom: "20px" }}>
          {athletes.length} athlete{athletes.length !== 1 ? "s" : ""} added.
        </p>
      )}

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={{
          flex: 1, padding: "14px", borderRadius: "10px",
          border: `1.5px solid ${c.grayLight}`, background: c.white,
          color: c.charcoal, fontSize: "15px", fontWeight: 600, cursor: "pointer",
        }}>
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving || athletes.length === 0}
          style={{
            flex: 2, padding: "14px", borderRadius: "10px", border: "none",
            background: saving || athletes.length === 0 ? "#9CA3AF" : c.green,
            color: c.white, fontSize: "15px", fontWeight: 600,
            cursor: saving || athletes.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save & Go to Tournament"}
        </button>
      </div>
    </div>
  );
}

// ── View 3: Manage Tournament ──────────────────────────────────────────────

function ManageTournament({
  tournament,
  rounds,
  athletes,
  onEditAthletes,
}: {
  tournament: any;
  rounds: any[];
  athletes: Athlete[];
  onEditAthletes: () => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [activeRound, setActiveRound] = useState(
    rounds.find((r) => r.status === "active")?.round_number ?? rounds[0]?.round_number ?? 1
  );
  const [results, setResults] = useState<Record<string, "win" | "loss">>({});
  const [savedResults, setSavedResults] = useState<Record<string, "win" | "loss">>({});
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRoundData = rounds.find((r) => r.round_number === activeRound);
  const activeAthletes = athletes.filter((a) => {
    if (activeRound === 1) return !a.has_bye;
    return a.status === "active";
  });

  const markResult = (athleteId: string, result: "win" | "loss") => {
    setResults((prev) => ({
      ...prev,
      [athleteId]: prev[athleteId] === result ? undefined as any : result,
    }));
  };

  const saveResult = async (athleteId: string, result: "win" | "loss") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !activeRoundData) return;

    await supabase.from("athlete_results").upsert({
      round_id: activeRoundData.id,
      athlete_id: athleteId,
      result,
      recorded_by: user.id,
    }, { onConflict: "round_id,athlete_id" });

    setSavedResults((prev) => ({ ...prev, [athleteId]: result }));
  };

  const handleMarkResult = async (athleteId: string, result: "win" | "loss") => {
    markResult(athleteId, result);
    await saveResult(athleteId, result);
  };

  const handleFinalizeRound = async () => {
    setFinalizing(true);
    setError(null);

    // Mark losing athletes as eliminated
    const losers = Object.entries({ ...savedResults, ...results })
      .filter(([, r]) => r === "loss")
      .map(([id]) => id);

    if (losers.length > 0) {
      await supabase.from("athletes")
        .update({ status: "eliminated", eliminated_in_round: activeRound })
        .in("id", losers);
    }

    // Complete this round
    await supabase.from("rounds")
      .update({ status: "completed" })
      .eq("id", activeRoundData?.id);

    // Activate next round if it exists
    const nextRound = rounds.find((r) => r.round_number === activeRound + 1);
    if (nextRound) {
      await supabase.from("rounds").update({ status: "active" }).eq("id", nextRound.id);
    } else {
      // All rounds done — conclude tournament
      await supabase.from("tournaments").update({ status: "concluded" }).eq("id", tournament.id);
    }

    router.refresh();
    setFinalizing(false);
  };

  const allResultsIn = activeAthletes.every((a) => results[a.id!] || savedResults[a.id!]);
  const enteredCount = activeAthletes.filter((a) => results[a.id!] || savedResults[a.id!]).length;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
        <Link href="/admin" style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>Admin</Link>
        <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
        <span style={{ fontSize: "14px", color: c.charcoal, fontWeight: 600 }}>{tournament.name}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: 0, letterSpacing: "-0.5px" }}>
              {tournament.name}
            </h1>
            <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, backgroundColor: c.greenMuted, color: c.green }}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </span>
          </div>
          <p style={{ fontSize: "15px", color: c.gray, margin: 0 }}>
            {athletes.length} athletes — {rounds.length} rounds
          </p>
        </div>
        <button onClick={onEditAthletes} style={{
          padding: "10px 20px", borderRadius: "10px",
          border: `1.5px solid ${c.grayLight}`, background: c.white,
          color: c.charcoal, fontSize: "14px", fontWeight: 600, cursor: "pointer",
        }}>
          Edit Athletes
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: c.redMuted, border: `1px solid #FECACA`, color: c.red, fontSize: "14px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Round Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
        {rounds.map((r) => (
          <button
            key={r.round_number}
            onClick={() => r.status !== "upcoming" && setActiveRound(r.round_number)}
            style={{
              flex: 1, padding: "10px 4px", borderRadius: "8px", border: "none",
              textAlign: "center", fontSize: "12px", fontWeight: 700,
              cursor: r.status !== "upcoming" ? "pointer" : "default",
              backgroundColor:
                activeRound === r.round_number ? c.green :
                r.status === "completed" ? c.greenMuted : c.grayLighter,
              color:
                activeRound === r.round_number ? c.white :
                r.status === "completed" ? c.green : c.gray,
              opacity: r.status === "upcoming" ? 0.5 : 1,
            }}
          >
            {roundLabel(r.round_number - 1)}
          </button>
        ))}
      </div>

      {/* Results Entry */}
      <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "24px", border: `1px solid ${c.grayLight}`, marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: c.charcoal, margin: "0 0 4px" }}>
              {roundLabel(activeRound - 1)} — Enter Results
            </h2>
            {activeRoundData?.lock_deadline && (
              <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 4px" }}>
                Lock deadline: {new Date(activeRoundData.lock_deadline).toLocaleString()}
              </p>
            )}
            <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>
              {enteredCount} of {activeAthletes.length} results entered
            </p>
          </div>
          <span style={{
            padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
            backgroundColor: activeRoundData?.status === "completed" ? c.greenMuted : c.amberMuted,
            color: activeRoundData?.status === "completed" ? c.green : c.amber,
          }}>
            {activeRoundData?.status === "completed" ? "Completed" : "In Progress"}
          </span>
        </div>

        <div style={{ backgroundColor: c.grayLighter, borderRadius: "10px", overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "0.4fr 2fr 1.2fr 0.6fr",
            padding: "10px 20px", fontSize: "12px", fontWeight: 600,
            color: c.gray, textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <span>Seed</span><span>Athlete</span><span>Result</span><span></span>
          </div>

          {activeAthletes.map((a) => {
            const res = results[a.id!] ?? savedResults[a.id!];
            return (
              <div key={a.id} style={{
                display: "grid", gridTemplateColumns: "0.4fr 2fr 1.2fr 0.6fr",
                padding: "12px 20px", fontSize: "14px",
                backgroundColor: res === "win" ? "#F0FAF3" : res === "loss" ? "#FEF8F8" : c.white,
                borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
              }}>
                <span style={{ fontWeight: 700, color: c.green }}>{a.seed}</span>
                <span style={{ fontWeight: 600, color: c.charcoal }}>{a.name}</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleMarkResult(a.id!, "win")} style={{
                    padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    border: res === "win" ? "none" : `1.5px solid ${c.grayLight}`,
                    backgroundColor: res === "win" ? c.green : c.white,
                    color: res === "win" ? c.white : c.charcoal,
                  }}>Win</button>
                  <button onClick={() => handleMarkResult(a.id!, "loss")} style={{
                    padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    border: res === "loss" ? "none" : `1.5px solid ${c.grayLight}`,
                    backgroundColor: res === "loss" ? c.red : c.white,
                    color: res === "loss" ? c.white : c.charcoal,
                  }}>Loss</button>
                </div>
                <span style={{ fontSize: "12px", color: c.green, fontWeight: 600, textAlign: "right" }}>
                  {res ? "✓" : ""}
                </span>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: "13px", color: c.gray, margin: "16px 0 0", lineHeight: 1.5 }}>
          Results save automatically as you enter them. Finalize when all results are in to trigger eliminations.
        </p>
      </div>

      {activeRoundData?.status !== "completed" && (
        <button
          onClick={handleFinalizeRound}
          disabled={!allResultsIn || finalizing}
          style={{
            width: "100%", padding: "14px", borderRadius: "10px", border: "none",
            background: allResultsIn && !finalizing ? c.green : c.grayLight,
            color: allResultsIn && !finalizing ? c.white : c.gray,
            fontSize: "15px", fontWeight: 600,
            cursor: allResultsIn && !finalizing ? "pointer" : "default",
          }}
        >
          {finalizing ? "Finalizing..." : `Finalize ${roundLabel(activeRound - 1)} (${enteredCount}/${activeAthletes.length} results entered)`}
        </button>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

type View = "create" | "athletes" | "manage";

export default function TournamentSetupClient({
  userId,
  username,
  initialTournament,
  initialRounds,
  initialAthletes,
}: {
  userId: string;
  username: string;
  initialTournament: any;
  initialRounds: any[];
  initialAthletes: any[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>(
    initialTournament && initialAthletes.length > 0 ? "manage" :
    initialTournament ? "athletes" : "create"
  );
  const [tournament, setTournament] = useState(initialTournament);
  const [rounds, setRounds] = useState(initialRounds);
  const [athletes, setAthletes] = useState<Athlete[]>(initialAthletes);

  const handleCreated = (t: any, r: any[]) => {
    setTournament(t);
    setRounds(r);
    setView("athletes");
    router.replace(`/admin/tournamentsetup?id=${t.id}`);
  };

  const handleAthletesDone = (a: Athlete[]) => {
    setAthletes(a);
    setView("manage");
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      <Nav username={username} />
      {view === "create" && (
        <CreateTournament
          userId={userId}
          onCreated={handleCreated}
          initialTournament={tournament}
          initialRounds={rounds}
        />
      )}
      {view === "athletes" && tournament && (
        <AddAthletes
          tournament={tournament}
          initialAthletes={athletes}
          onDone={handleAthletesDone}
          onBack={() => setView("create")}
        />
      )}
      {view === "manage" && tournament && (
        <ManageTournament
          tournament={tournament}
          rounds={rounds}
          athletes={athletes}
          onEditAthletes={() => setView("athletes")}
        />
      )}
    </div>
  );
}
