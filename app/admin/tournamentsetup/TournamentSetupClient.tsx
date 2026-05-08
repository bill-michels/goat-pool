"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyRoundComplete } from "./actions";

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

// Labels count from the END of the draw: Final, SF, QF, then Round N from start
function roundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "SF";
  if (fromEnd === 2) return "QF";
  return `Round ${roundNumber}`;
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

  // Confirmed deadlines stored as ISO strings
  const [deadlines, setDeadlines] = useState<Record<number, string>>(() => {
    const d: Record<number, string> = {};
    initialRounds.forEach((r) => {
      if (r.lock_deadline) d[r.round_number] = r.lock_deadline;
    });
    return d;
  });

  // Temporary date/time input values while editing
  const [inputs, setInputs] = useState<Record<number, { date: string; time: string }>>(() => {
    const init: Record<number, { date: string; time: string }> = {};
    initialRounds.forEach((r) => {
      if (r.lock_deadline) {
        const d = new Date(r.lock_deadline);
        init[r.round_number] = {
          date: d.toISOString().slice(0, 10),
          time: d.toTimeString().slice(0, 5),
        };
      }
    });
    return init;
  });

  // Rounds currently showing the input form (vs. confirmed display)
  const [editingRounds, setEditingRounds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roundCount = Math.min(Math.max(parseInt(numRounds) || 0, 1), 10);

  const setInput = (roundNum: number, field: "date" | "time", val: string) => {
    setInputs((prev) => ({ ...prev, [roundNum]: { ...(prev[roundNum] ?? { date: "", time: "" }), [field]: val } }));
  };

  const confirmDeadline = (roundNum: number) => {
    const inp = inputs[roundNum];
    if (!inp?.date) return;
    const iso = new Date(`${inp.date}T${inp.time || "00:00"}`).toISOString();
    setDeadlines((prev) => ({ ...prev, [roundNum]: iso }));
    setEditingRounds((prev) => { const s = new Set(prev); s.delete(roundNum); return s; });
  };

  const startEditing = (roundNum: number) => {
    setEditingRounds((prev) => new Set(Array.from(prev).concat(roundNum)));
  };

  const clearDeadline = (roundNum: number) => {
    setDeadlines((prev) => { const n = { ...prev }; delete n[roundNum]; return n; });
    setInputs((prev) => { const n = { ...prev }; delete n[roundNum]; return n; });
    setEditingRounds((prev) => { const s = new Set(prev); s.delete(roundNum); return s; });
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Tournament name is required."); return; }
    if (!numRounds || roundCount < 1) { setError("Number of rounds is required."); return; }

    setLoading(true);
    setError(null);

    let tournament = initialTournament;

    if (!tournament) {
      const { data, error: tErr } = await supabase
        .from("tournaments")
        .insert({ name: name.trim(), num_rounds: roundCount, status: "upcoming", created_by: userId })
        .select()
        .single();
      if (tErr) {
        setError(tErr.message.includes("unique") || tErr.message.includes("duplicate")
          ? "A tournament with that name already exists. Use a different name."
          : tErr.message);
        setLoading(false); return;
      }
      tournament = data;
    }

    const roundsPayload = Array.from({ length: roundCount }, (_, i) => ({
      tournament_id: tournament.id,
      round_number: i + 1,
      lock_deadline: deadlines[i + 1] ?? null,
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
            Grand Slams are typically 7 rounds (128-draw). Smaller tournaments may have 3–5.
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="7"
            value={numRounds}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              setNumRounds(v);
            }}
            style={{ ...inputStyle(), maxWidth: "100px" }}
          />
        </div>

        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
            Round Lock Deadlines
          </label>
          <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 12px" }}>
            The deadline players must submit their pick by. You can set these later once the schedule is confirmed.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Array.from({ length: roundCount }, (_, i) => {
              const roundNum = i + 1;
              const confirmed = deadlines[roundNum];
              const isEditing = editingRounds.has(roundNum) || !confirmed;
              const inp = inputs[roundNum] ?? { date: "", time: "" };

              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: c.charcoal, minWidth: "72px" }}>
                    {roundLabel(roundNum, roundCount)}
                  </span>

                  {isEditing ? (
                    <>
                      <input
                        type="date"
                        value={inp.date}
                        onChange={(e) => setInput(roundNum, "date", e.target.value)}
                        style={{
                          padding: "9px 10px", border: `1.5px solid ${c.grayLight}`,
                          borderRadius: "8px", fontSize: "14px", color: c.charcoal,
                          flex: 1,
                        }}
                      />
                      <input
                        type="time"
                        value={inp.time}
                        onChange={(e) => setInput(roundNum, "time", e.target.value)}
                        style={{
                          padding: "9px 10px", border: `1.5px solid ${c.grayLight}`,
                          borderRadius: "8px", fontSize: "14px", color: c.charcoal,
                          width: "145px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => confirmDeadline(roundNum)}
                        disabled={!inp.date}
                        style={{
                          padding: "9px 14px", borderRadius: "8px", border: "none",
                          background: inp.date ? c.green : "#9CA3AF",
                          color: c.white, fontSize: "13px", fontWeight: 600,
                          cursor: inp.date ? "pointer" : "not-allowed", whiteSpace: "nowrap",
                        }}
                      >
                        Set
                      </button>
                      {confirmed && (
                        <button
                          type="button"
                          onClick={() => setEditingRounds((prev) => { const s = new Set(prev); s.delete(roundNum); return s; })}
                          style={{ fontSize: "13px", color: c.gray, background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{
                        flex: 1, fontSize: "14px", color: c.charcoal, fontWeight: 500,
                        padding: "9px 12px", borderRadius: "8px",
                        backgroundColor: c.greenMuted, border: `1px solid ${c.grayLight}`,
                      }}>
                        {new Date(confirmed!).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditing(roundNum)}
                        style={{ fontSize: "13px", color: c.gray, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => clearDeadline(roundNum)}
                        style={{ fontSize: "13px", color: c.gray, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              );
            })}
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextAutoSeed = () => {
    const existing = athletes.map((a) => a.seed);
    let s = 100;
    while (existing.includes(s)) s++;
    return s;
  };

  const parseBulk = () => {
    setError(null);
    const entries = bulkText.split(",").map((s) => s.trim()).filter(Boolean);
    const parsed: Athlete[] = [];
    let autoSeed = nextAutoSeed();

    for (const entry of entries) {
      const withSeed = entry.match(/^(.+?)\s*\((\d+)\)$/);
      let name: string;
      let seed: number;

      if (withSeed) {
        name = withSeed[1].trim();
        seed = parseInt(withSeed[2]);
      } else {
        name = entry.trim();
        seed = autoSeed++;
      }

      if (!name) continue;
      if (athletes.some((a) => a.seed === seed) || parsed.some((a) => a.seed === seed)) {
        setError(`Duplicate seed ${seed}.`); return;
      }
      parsed.push({ name, seed, has_bye: false, status: "active" });
    }

    setAthletes((prev) =>
      [...prev, ...parsed].sort((a, b) => a.seed - b.seed)
    );
    setBulkText("");
  };

  const toggleBye = (seed: number) => {
    setAthletes((prev) =>
      prev.map((a) => (a.seed === seed ? { ...a, has_bye: !a.has_bye } : a))
    );
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
    onDone(data ?? athletes);
    setSaving(false);
  };

  const seededAthletes = athletes.filter((a) => a.seed < 100);
  const unseededAthletes = athletes.filter((a) => a.seed >= 100);

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

      <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 24px", letterSpacing: "-0.5px" }}>
        Add Athletes: {tournament.name}
      </h1>

      {error && (
        <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: c.redMuted, border: `1px solid #FECACA`, color: c.red, fontSize: "14px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Bulk Add */}
      <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "24px", border: `1px solid ${c.grayLight}`, marginBottom: "20px" }}>
        <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 10px" }}>
          Comma-separated list. Include a seed in parentheses to help track, but it&apos;s optional.{" "}
          <em>e.g. Jannik Sinner (1), Carlos Alcaraz (2)</em>
        </p>
        <textarea
          placeholder="Sinner (1), Alcaraz (2), Djokovic (3), Medvedev (4), ..."
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
          Add to List
        </button>
      </div>

      {/* Athlete List */}
      {athletes.length > 0 && (
        <>
          <p style={{ fontSize: "15px", fontWeight: 700, color: c.charcoal, margin: "0 0 12px" }}>
            Total Added: {athletes.length}, Total Seeded: {seededAthletes.length}
          </p>
        <div style={{ backgroundColor: c.white, borderRadius: "14px", overflow: "hidden", border: `1px solid ${c.grayLight}`, marginBottom: "16px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "0.5fr 2fr 1fr 0.5fr",
            padding: "12px 20px", backgroundColor: c.grayLighter,
            fontSize: "12px", fontWeight: 600, color: c.gray,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <span>Seed</span><span>Athlete</span><span>Bye in R1</span><span></span>
          </div>

          {athletes.map((a) => (
            <div key={a.seed} style={{
              display: "grid", gridTemplateColumns: "0.5fr 2fr 1fr 0.5fr",
              padding: "14px 20px", fontSize: "14px",
              borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
            }}>
              <span style={{ fontWeight: 700, color: a.seed < 100 ? c.green : c.gray }}>
                {a.seed < 100 ? a.seed : "—"}
              </span>
              <span style={{ fontWeight: 600, color: c.charcoal }}>{a.name}</span>
              <span>
                <button
                  onClick={() => toggleBye(a.seed)}
                  style={{
                    fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px",
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
        </>
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
  const totalRounds = rounds.length;

  const [activeRound, setActiveRound] = useState(
    rounds.find((r) => r.status === "active")?.round_number ?? rounds[0]?.round_number ?? 1
  );
  // Confirmed results already saved to DB
  const [savedResults, setSavedResults] = useState<Record<string, "win" | "loss">>({});
  // Pending selection the user has clicked but not yet saved
  const [pending, setPending] = useState<Record<string, "win" | "loss">>({});
  // Which athlete ID is currently mid-save
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRoundData = rounds.find((r) => r.round_number === activeRound);
  const activeAthletes = athletes.filter((a) => {
    if (activeRound === 1) return !a.has_bye;
    return a.status === "active";
  });
  const byeCount = activeRound === 1 ? athletes.filter((a) => a.has_bye).length : 0;

  const handleSelect = (athleteId: string, result: "win" | "loss") => {
    // If already saved as this result, do nothing
    if (savedResults[athleteId] === result && pending[athleteId] === undefined) return;
    // Toggle pending: clicking the same pending selection clears it
    setPending((prev) => {
      if (prev[athleteId] === result) {
        const n = { ...prev }; delete n[athleteId]; return n;
      }
      return { ...prev, [athleteId]: result };
    });
  };

  const handleSave = async (athleteId: string) => {
    const result = pending[athleteId];
    if (!result || !activeRoundData) return;

    setSavingId(athleteId);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingId(null); return; }

    // Save result to DB
    const { error: resErr } = await supabase.from("athlete_results").upsert({
      round_id: activeRoundData.id,
      athlete_id: athleteId,
      result,
      recorded_by: user.id,
    }, { onConflict: "round_id,athlete_id" });

    if (resErr) { setError(resErr.message); setSavingId(null); return; }

    // Trigger elimination if loss
    if (result === "loss") {
      await supabase.from("athletes")
        .update({ status: "eliminated", eliminated_in_round: activeRound })
        .eq("id", athleteId);
    }

    // Commit locally
    const newSaved = { ...savedResults, [athleteId]: result };
    setSavedResults(newSaved);
    setPending((prev) => { const n = { ...prev }; delete n[athleteId]; return n; });
    setSavingId(null);

    // Auto-complete the round when every match has a saved result
    const allDone = activeAthletes.every((a) => newSaved[a.id!] !== undefined);
    if (allDone && activeRoundData.status !== "completed") {
      await supabase.from("rounds").update({ status: "completed" }).eq("id", activeRoundData.id);
      const nextRound = rounds.find((r) => r.round_number === activeRound + 1);
      if (nextRound) {
        await supabase.from("rounds").update({ status: "active" }).eq("id", nextRound.id);
      } else {
        await supabase.from("tournaments").update({ status: "concluded" }).eq("id", tournament.id);
      }
      notifyRoundComplete(activeRoundData.id);
      router.refresh();
    }
  };

  const savedCount = activeAthletes.filter((a) => savedResults[a.id!] !== undefined).length;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px" }}>
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
            {roundLabel(r.round_number, totalRounds)}
          </button>
        ))}
      </div>

      {/* Results Entry */}
      <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "24px", border: `1px solid ${c.grayLight}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: c.charcoal, margin: "0 0 4px" }}>
              {roundLabel(activeRound, totalRounds)} Results
            </h2>
            <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>
              {savedCount} of {activeAthletes.length} confirmed
              {byeCount > 0 ? ` — ${byeCount} with a bye not included` : ""}
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

        <div style={{ borderRadius: "10px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
          <div style={{
            display: "grid", gridTemplateColumns: "0.4fr 2fr 1fr 1.8fr",
            padding: "10px 20px", backgroundColor: c.grayLighter,
            fontSize: "12px", fontWeight: 600,
            color: c.gray, textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <span>Seed</span><span>Athlete</span><span>Result</span><span></span>
          </div>

          {activeAthletes.length === 0 && (
            <div style={{ padding: "24px 20px", fontSize: "14px", color: c.gray }}>
              No athletes playing this round.
            </div>
          )}

          {activeAthletes.map((a) => {
            const saved = savedResults[a.id!];
            const sel = pending[a.id!] ?? saved;
            const hasPendingChange = pending[a.id!] !== undefined && pending[a.id!] !== saved;
            const isSaving = savingId === a.id;

            return (
              <div key={a.id} style={{
                display: "grid", gridTemplateColumns: "0.4fr 2fr 1fr 1.8fr",
                padding: "12px 20px", fontSize: "14px",
                backgroundColor: saved === "win" ? "#F0FAF3" : saved === "loss" ? "#FEF8F8" : c.white,
                borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
              }}>
                <span style={{ fontWeight: 700, color: a.seed < 100 ? c.green : c.gray }}>
                  {a.seed < 100 ? a.seed : "—"}
                </span>
                <span style={{ fontWeight: 600, color: c.charcoal }}>{a.name}</span>

                {/* Won / Lost toggle */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleSelect(a.id!, "win")}
                    disabled={!!saved && !hasPendingChange}
                    style={{
                      padding: "5px 12px", borderRadius: "7px", fontSize: "13px", fontWeight: 600,
                      cursor: saved && !hasPendingChange ? "default" : "pointer",
                      border: sel === "win" ? "none" : `1.5px solid ${c.grayLight}`,
                      backgroundColor: sel === "win" ? c.green : c.white,
                      color: sel === "win" ? c.white : c.charcoal,
                      opacity: saved && sel !== "win" ? 0.4 : 1,
                    }}
                  >Won</button>
                  <button
                    onClick={() => handleSelect(a.id!, "loss")}
                    disabled={!!saved && !hasPendingChange}
                    style={{
                      padding: "5px 12px", borderRadius: "7px", fontSize: "13px", fontWeight: 600,
                      cursor: saved && !hasPendingChange ? "default" : "pointer",
                      border: sel === "loss" ? "none" : `1.5px solid ${c.grayLight}`,
                      backgroundColor: sel === "loss" ? c.red : c.white,
                      color: sel === "loss" ? c.white : c.charcoal,
                      opacity: saved && sel !== "loss" ? 0.4 : 1,
                    }}
                  >Lost</button>
                </div>

                {/* Save button — only when a result is selected and not yet saved */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {hasPendingChange && (
                    <button
                      onClick={() => handleSave(a.id!)}
                      disabled={isSaving}
                      style={{
                        padding: "5px 14px", borderRadius: "7px", fontSize: "13px", fontWeight: 600,
                        border: "none", cursor: isSaving ? "not-allowed" : "pointer",
                        backgroundColor: isSaving ? "#9CA3AF" : c.charcoal,
                        color: c.white, whiteSpace: "nowrap",
                      }}
                    >
                      {isSaving ? "Saving..." : pending[a.id!] === "loss" ? "Save & Eliminate" : "Save Result"}
                    </button>
                  )}
                  {saved && !hasPendingChange && (
                    <span style={{ fontSize: "12px", color: c.green, fontWeight: 600 }}>Saved</span>
                  )}
                  {saved && !hasPendingChange && activeRoundData?.status !== "completed" && (
                    <button
                      onClick={() => setPending((prev) => ({ ...prev, [a.id!]: saved }))}
                      style={{ fontSize: "12px", color: c.gray, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
    // Force server re-fetch so the manage view loads athletes from DB
    router.refresh();
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
