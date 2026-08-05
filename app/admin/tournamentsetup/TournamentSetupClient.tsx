"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyRoundComplete, deleteTournament, processAthleteResult, undoAthleteResult, autoAssignMissedPicksForRound, concludeTournament, syncRoundFromOddsApi, saveOddsApiSportKey } from "./actions";

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

  // Odds API sport key
  const [oddsApiSportKey, setOddsApiSportKey] = useState((initialTournament as any)?.odds_api_sport_key ?? "");

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

    const sfFields = {
      odds_api_sport_key: oddsApiSportKey || null,
    };

    if (!tournament) {
      const { data, error: tErr } = await supabase
        .from("tournaments")
        .insert({ name: name.trim(), num_rounds: roundCount, status: "upcoming", created_by: userId, ...sfFields })
        .select()
        .single();
      if (tErr) {
        setError(tErr.message.includes("unique") || tErr.message.includes("duplicate")
          ? "A tournament with that name already exists. Use a different name."
          : tErr.message);
        setLoading(false); return;
      }
      tournament = data;
    } else {
      const { error: uErr } = await supabase
        .from("tournaments")
        .update({ name: name.trim(), num_rounds: roundCount, ...sfFields })
        .eq("id", tournament.id);
      if (uErr) { setError(uErr.message); setLoading(false); return; }
      tournament = { ...tournament, name: name.trim(), num_rounds: roundCount, ...sfFields };
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

        {/* Odds API Sport Key */}
        <div style={{ backgroundColor: c.white, borderRadius: "14px", padding: "20px", border: `1px solid ${c.grayLight}`, marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: c.charcoal, margin: "0 0 4px" }}>
            Odds API Sport Key <span style={{ fontWeight: 400, color: c.gray }}>(optional)</span>
          </p>
          <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 12px" }}>
            Enables auto-syncing match results each round.
          </p>
          <select
            value={oddsApiSportKey}
            onChange={e => setOddsApiSportKey(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1.5px solid ${c.grayLight}`, fontSize: "14px", color: c.charcoal }}
          >
            <option value="">— not connected —</option>
            <optgroup label="ATP Grand Slams">
              <option value="tennis_atp_aus_open_singles">Australian Open</option>
              <option value="tennis_atp_french_open">French Open</option>
              <option value="tennis_atp_wimbledon">Wimbledon</option>
              <option value="tennis_atp_us_open">US Open</option>
            </optgroup>
            <optgroup label="ATP Masters 1000">
              <option value="tennis_atp_indian_wells">Indian Wells</option>
              <option value="tennis_atp_miami_open">Miami Open</option>
              <option value="tennis_atp_monte_carlo_masters">Monte Carlo</option>
              <option value="tennis_atp_madrid_open">Madrid Open</option>
              <option value="tennis_atp_italian_open">Italian Open</option>
              <option value="tennis_atp_canadian_open">Canadian Open</option>
              <option value="tennis_atp_cincinnati_open">Cincinnati Open</option>
              <option value="tennis_atp_shanghai_masters">Shanghai Masters</option>
              <option value="tennis_atp_paris_masters">Paris Masters</option>
            </optgroup>
            <optgroup label="ATP 500">
              <option value="tennis_atp_dubai">Dubai</option>
              <option value="tennis_atp_barcelona_open">Barcelona Open</option>
              <option value="tennis_atp_halle_open">Halle Open</option>
              <option value="tennis_atp_queens_club_champ">Queen&apos;s Club</option>
              <option value="tennis_atp_hamburg_open">Hamburg Open</option>
              <option value="tennis_atp_china_open">China Open</option>
            </optgroup>
            <optgroup label="ATP 250">
              <option value="tennis_atp_washington_open">Washington Open</option>
            </optgroup>
            <optgroup label="WTA Grand Slams">
              <option value="tennis_wta_aus_open_singles">Australian Open (W)</option>
              <option value="tennis_wta_french_open">French Open (W)</option>
              <option value="tennis_wta_wimbledon">Wimbledon (W)</option>
              <option value="tennis_wta_us_open">US Open (W)</option>
            </optgroup>
            <optgroup label="WTA 1000">
              <option value="tennis_wta_indian_wells">Indian Wells (W)</option>
              <option value="tennis_wta_miami_open">Miami Open (W)</option>
              <option value="tennis_wta_madrid_open">Madrid Open (W)</option>
              <option value="tennis_wta_italian_open">Italian Open (W)</option>
              <option value="tennis_wta_canadian_open">Canadian Open (W)</option>
              <option value="tennis_wta_cincinnati_open">Cincinnati Open (W)</option>
              <option value="tennis_wta_wuhan_open">Wuhan Open (W)</option>
              <option value="tennis_wta_china_open">China Open (W)</option>
            </optgroup>
          </select>
          {oddsApiSportKey && (
            <p style={{ fontSize: "12px", color: c.green, margin: "8px 0 0", fontWeight: 600 }}>
              ✓ Connected: {oddsApiSportKey}
            </p>
          )}
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
  _key: string;
  name: string;
  seed: number | null;
  has_bye: boolean;
  status: string;
  eliminated_in_round?: number | null;
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
  const [athletes, setAthletes] = useState<Athlete[]>(
    initialAthletes.map((a) => ({ ...a, _key: a._key ?? a.id ?? crypto.randomUUID() }))
  );
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseBulk = () => {
    setError(null);
    const entries = bulkText.split(",").map((s) => s.trim()).filter(Boolean);
    const parsed: Athlete[] = [];
    const takenSeeds = new Set(athletes.map((a) => a.seed).filter((s) => s !== null));

    for (const entry of entries) {
      const withSeed = entry.match(/^(.+?)\s*\((\d+)\)$/);
      let name: string;
      let seed: number | null;

      if (withSeed) {
        name = withSeed[1].trim();
        seed = parseInt(withSeed[2]);
        if (takenSeeds.has(seed)) { setError(`Duplicate seed ${seed}.`); return; }
        takenSeeds.add(seed);
      } else {
        name = entry.trim();
        seed = null;
      }

      if (!name) continue;
      parsed.push({ _key: crypto.randomUUID(), name, seed, has_bye: false, status: "active" });
    }

    setAthletes((prev) => {
      const combined = [...prev, ...parsed];
      return combined.sort((a, b) => {
        if (a.seed !== null && b.seed !== null) return a.seed - b.seed;
        if (a.seed !== null) return -1;
        if (b.seed !== null) return 1;
        return a.name.localeCompare(b.name);
      });
    });
    setBulkText("");
  };

  const toggleBye = (key: string) => {
    setAthletes((prev) =>
      prev.map((a) => (a._key === key ? { ...a, has_bye: !a.has_bye } : a))
    );
  };

  const removeAthlete = (key: string) => {
    setAthletes((prev) => prev.filter((a) => a._key !== key));
  };

  const handleSave = async () => {
    if (athletes.length === 0) { setError("Add at least one athlete."); return; }
    const seeds = athletes.map((a) => a.seed).filter((s) => s !== null);
    if (new Set(seeds).size !== seeds.length) { setError("Duplicate seed numbers detected. Each seed must be unique."); return; }
    setSaving(true);
    setError(null);

    const existing = athletes.filter((a) => a.id);
    const newAthletes = athletes.filter((a) => !a.id);

    // Soft-delete removed athletes by setting status = 'inactive'
    const removedIds = initialAthletes
      .filter((a) => a.id && !athletes.some((curr) => curr.id === a.id))
      .map((a) => a.id);
    if (removedIds.length > 0) {
      const { error: err } = await supabase.from("athletes").update({ status: "inactive" }).in("id", removedIds);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    const results: Athlete[] = [];

    if (existing.length > 0) {
      for (const a of existing) {
        const { error: err } = await supabase
          .from("athletes")
          .update({ name: a.name, seed: a.seed, has_bye: a.has_bye, status: a.status })
          .eq("id", a.id!);
        if (err) { setError(err.message); setSaving(false); return; }
      }
      results.push(...existing);
    }

    if (newAthletes.length > 0) {
      const { data, error: err } = await supabase
        .from("athletes")
        .upsert(
          newAthletes.map((a) => ({
            tournament_id: tournament.id,
            name: a.name,
            seed: a.seed,
            has_bye: a.has_bye,
            status: a.status,
          })),
          { onConflict: "tournament_id,name" }
        )
        .select();
      if (err) { setError(err.message); setSaving(false); return; }
      results.push(...(data ?? []).map((d: any) => ({ ...d, _key: d.id })));
    }

    onDone(results);
    setSaving(false);
  };

  const seededCount = athletes.filter((a) => a.seed !== null).length;
  const byeCount = athletes.filter((a) => a.has_bye).length;

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
          Comma-separated list. Include a seed in parentheses if known — unseeded athletes are fine too.{" "}
          <em>e.g. Sinner (1), Alcaraz (2), Musetti</em>
        </p>
        <textarea
          placeholder="Sinner (1), Alcaraz (2), Musetti, Zverev (3), ..."
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
            Total: {athletes.length} — Seeded: {seededCount} — Unseeded: {athletes.length - seededCount} — Byes: {byeCount}
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
              <div key={a._key} style={{
                display: "grid", gridTemplateColumns: "0.5fr 2fr 1fr 0.5fr",
                padding: "14px 20px", fontSize: "14px",
                borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
              }}>
                <input
                  type="number"
                  min="1"
                  placeholder="—"
                  value={a.seed ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAthletes((prev) =>
                      prev.map((x) =>
                        x._key === a._key
                          ? { ...x, seed: val === "" ? null : parseInt(val) }
                          : x
                      )
                    );
                  }}
                  style={{
                    width: "56px", padding: "4px 8px",
                    border: `1.5px solid ${c.grayLight}`, borderRadius: "6px",
                    fontSize: "14px", fontWeight: 700,
                    color: a.seed !== null ? c.green : c.gray,
                    textAlign: "center", boxSizing: "border-box" as const,
                  }}
                />
                <span style={{ fontWeight: 600, color: c.charcoal }}>{a.name}</span>
                <span>
                  <button
                    onClick={() => toggleBye(a._key)}
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
                    onClick={() => removeAthlete(a._key)}
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
  onEditDetails,
}: {
  tournament: any;
  rounds: any[];
  athletes: Athlete[];
  onEditAthletes: () => void;
  onEditDetails: () => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const totalRounds = rounds.length;
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [activeRound, setActiveRound] = useState(
    rounds.find((r) => r.status === "active")?.round_number ?? rounds[0]?.round_number ?? 1
  );
  // Confirmed results already saved to DB for the viewed round
  const [savedResults, setSavedResults] = useState<Record<string, "win" | "loss">>({});
  // Confirmed results for the previous round — used to filter eligible athletes
  const [prevRoundResults, setPrevRoundResults] = useState<Record<string, "win" | "loss">>({});
  // Pending selection the user has clicked but not yet saved
  const [pending, setPending] = useState<Record<string, "win" | "loss">>({});
  const [editingResultIds, setEditingResultIds] = useState<Set<string>>(() => new Set());
  // Which athlete ID is currently mid-save
  const [savingId, setSavingId] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [assigningPicks, setAssigningPicks] = useState(false);
  const [assignedCount, setAssignedCount] = useState<number | null>(null);
  const [openingNextRound, setOpeningNextRound] = useState(false);
  const [completingRound, setCompletingRound] = useState(false);
  const [concluding, setConcluding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Odds API sport key edit state
  const [oddsKeyEditing, setOddsKeyEditing] = useState(false);
  const [oddsKeyDraft, setOddsKeyDraft] = useState((tournament as any).odds_api_sport_key ?? "");
  const [oddsKeySaving, setOddsKeySaving] = useState(false);
  const [oddsKeySaved, setOddsKeySaved] = useState(false);

  // Sync state
  const [sfSyncing, setSfSyncing] = useState(false);
  const [sfResult, setSfResult] = useState<{ synced: number; unmatched: string[]; skipped: number; needsManual: string[] } | null>(null);
  const [sfError, setSfError] = useState<string | null>(null);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState({ date: "", time: "" });
  const [savingDeadline, setSavingDeadline] = useState(false);
  // Local copy of deadlines so saves reflect immediately without a full refresh
  const [deadlineOverrides, setDeadlineOverrides] = useState<Record<string, string | null>>({});


  const activeRoundData = (() => {
    const r = rounds.find((r) => r.round_number === activeRound);
    if (!r) return r;
    return r.id in deadlineOverrides ? { ...r, lock_deadline: deadlineOverrides[r.id] } : r;
  })();

  // Athletes eligible for the viewed round:
  // Round 1: all non-bye athletes
  // Round N: athletes with a confirmed win in round N-1, plus bye athletes advancing to round 2
  const activeAthletes = athletes.filter((a) => {
    if (!a.id) return false;
    if (a.status === "inactive") return false;
    if (activeRound === 1) return !a.has_bye;
    if (activeRound === 2 && a.has_bye) return true;
    return prevRoundResults[a.id] === "win";
  });
  const byeCount = activeRound === 1 ? athletes.filter((a) => a.has_bye).length : 0;

  // Load saved results from DB whenever the viewed round changes
  useEffect(() => {
    const roundData = rounds.find((r) => r.round_number === activeRound);
    if (!roundData?.id) return;
    setSavedResults({});
    setPrevRoundResults({});
    setPending({});
    setEditingResultIds(new Set());
    setSfResult(null);
    setSfError(null);

    const prevRoundData = rounds.find((r) => r.round_number === activeRound - 1);

    const currentQuery = supabase
      .from("athlete_results")
      .select("athlete_id, result")
      .eq("round_id", roundData.id)
      .then(({ data }) => {
        const map: Record<string, "win" | "loss"> = {};
        (data ?? []).forEach((r: any) => { map[r.athlete_id] = r.result; });
        setSavedResults(map);
      });

    if (prevRoundData) {
      supabase
        .from("athlete_results")
        .select("athlete_id, result")
        .eq("round_id", prevRoundData.id)
        .then(({ data }) => {
          const map: Record<string, "win" | "loss"> = {};
          (data ?? []).forEach((r: any) => { map[r.athlete_id] = r.result; });
          setPrevRoundResults(map);
        });
    }

    return () => { void currentQuery; };
  }, [activeRound]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const { error: resErr } = await processAthleteResult(
      athleteId,
      activeRoundData.id,
      result,
      activeRound
    );

    if (resErr) { setError(resErr); setSavingId(null); return; }

    // Commit locally
    const newSaved = { ...savedResults, [athleteId]: result };
    setSavedResults(newSaved);
    setPending((prev) => { const n = { ...prev }; delete n[athleteId]; return n; });
    setEditingResultIds((prev) => { const s = new Set(prev); s.delete(athleteId); return s; });
    setSavingId(null);
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
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onEditDetails} style={{
            padding: "10px 20px", borderRadius: "10px",
            border: `1.5px solid ${c.grayLight}`, background: c.white,
            color: c.charcoal, fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}>
            Edit Details
          </button>
          <button onClick={onEditAthletes} style={{
            padding: "10px 20px", borderRadius: "10px",
            border: `1.5px solid ${c.grayLight}`, background: c.white,
            color: c.charcoal, fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}>
            Edit Athletes
          </button>
          {tournament.status !== "concluded" && (
            <button
              onClick={async () => {
                if (!confirm(`Conclude "${tournament.name}"? This will mark all pools as concluded and cannot be undone.`)) return;
                setConcluding(true);
                setError(null);
                const result = await concludeTournament(tournament.id);
                setConcluding(false);
                if (result.error) {
                  setError(result.error);
                } else {
                  router.refresh();
                }
              }}
              disabled={concluding}
              style={{
                padding: "10px 20px", borderRadius: "10px",
                border: `1.5px solid ${c.green}`, background: c.green,
                color: c.white, fontSize: "14px", fontWeight: 600,
                cursor: concluding ? "not-allowed" : "pointer",
              }}
            >
              {concluding ? "Concluding..." : "Conclude Tournament"}
            </button>
          )}
          <button
            onClick={async () => {
              if (!confirm(`Delete "${tournament.name}"? This cannot be undone.`)) return;
              setDeleting(true);
              setDeleteError(null);
              const result = await deleteTournament(tournament.id);
              if (result.error) {
                setDeleteError(result.error);
                setDeleting(false);
              } else {
                router.push("/admin/tournamentsetup");
                router.refresh();
              }
            }}
            disabled={deleting}
            style={{
              padding: "10px 20px", borderRadius: "10px",
              border: `1.5px solid #FECACA`, background: "#FEF2F2",
              color: c.red, fontSize: "14px", fontWeight: 600,
              cursor: deleting ? "not-allowed" : "pointer",
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {(error || deleteError) && (
        <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: c.redMuted, border: `1px solid #FECACA`, color: c.red, fontSize: "14px", marginBottom: "20px" }}>
          {error || deleteError}
        </div>
      )}

      {/* Odds API Connection */}
      <div style={{ backgroundColor: c.white, borderRadius: "12px", padding: "14px 20px", border: `1px solid ${c.grayLight}`, marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: c.charcoal }}>Odds API</span>
            {oddsKeySaved || (tournament as any).odds_api_sport_key ? (
              <span style={{ fontSize: "12px", padding: "3px 8px", borderRadius: "6px", backgroundColor: c.greenMuted, color: c.green, fontWeight: 600 }}>
                {oddsKeyDraft || (tournament as any).odds_api_sport_key}
              </span>
            ) : (
              <span style={{ fontSize: "12px", color: c.gray }}>No sport key — set one to enable auto-sync</span>
            )}
          </div>
          <button
            onClick={() => { setOddsKeyEditing(o => !o); setOddsKeySaved(false); }}
            style={{ padding: "5px 12px", borderRadius: "7px", border: `1px solid ${c.grayLight}`, background: c.white, color: c.charcoal, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            {oddsKeyEditing ? "Close" : oddsKeyDraft || (tournament as any).odds_api_sport_key ? "Update" : "Set Key"}
          </button>
        </div>

        {oddsKeyEditing && (
          <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${c.grayLight}` }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: c.gray, display: "block", marginBottom: "6px" }}>Sport Key</label>
            <select
              value={oddsKeyDraft}
              onChange={e => setOddsKeyDraft(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "7px", border: `1px solid ${c.grayLight}`, fontSize: "13px", marginBottom: "10px" }}
            >
              <option value="">— select sport key —</option>
              <optgroup label="ATP Masters / Grand Slams">
                <option value="tennis_atp_australian_open">Australian Open (ATP)</option>
                <option value="tennis_atp_french_open">French Open (ATP)</option>
                <option value="tennis_atp_wimbledon">Wimbledon (ATP)</option>
                <option value="tennis_atp_us_open">US Open (ATP)</option>
                <option value="tennis_atp_miami_open">Miami Open (ATP)</option>
                <option value="tennis_atp_madrid_open">Madrid Open (ATP)</option>
                <option value="tennis_atp_rome">Rome (ATP)</option>
                <option value="tennis_atp_canadian_open">Canadian Open (ATP)</option>
                <option value="tennis_atp_cincinnati_open">Cincinnati Open (ATP)</option>
                <option value="tennis_atp_shanghai">Shanghai (ATP)</option>
                <option value="tennis_atp_paris_masters">Paris Masters (ATP)</option>
                <option value="tennis_atp_nitto_atp_finals">ATP Finals</option>
              </optgroup>
              <optgroup label="ATP 250 / 500">
                <option value="tennis_atp_washington_open">Washington Open (ATP)</option>
              </optgroup>
              <optgroup label="WTA Majors">
                <option value="tennis_wta_australian_open">Australian Open (WTA)</option>
                <option value="tennis_wta_french_open">French Open (WTA)</option>
                <option value="tennis_wta_wimbledon">Wimbledon (WTA)</option>
                <option value="tennis_wta_us_open">US Open (WTA)</option>
                <option value="tennis_wta_miami_open">Miami Open (WTA)</option>
                <option value="tennis_wta_madrid_open">Madrid Open (WTA)</option>
                <option value="tennis_wta_rome">Rome (WTA)</option>
                <option value="tennis_wta_canadian_open">Canadian Open (WTA)</option>
                <option value="tennis_wta_cincinnati_open">Cincinnati Open (WTA)</option>
                <option value="tennis_wta_wta_finals">WTA Finals</option>
                <option value="tennis_wta_washington_open">Washington Open (WTA)</option>
              </optgroup>
            </select>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={async () => {
                  setOddsKeySaving(true);
                  const res = await saveOddsApiSportKey(tournament.id, oddsKeyDraft || null);
                  if (!res.error) { setOddsKeySaved(true); setOddsKeyEditing(false); router.refresh(); }
                  setOddsKeySaving(false);
                }}
                disabled={oddsKeySaving}
                style={{
                  padding: "7px 16px", borderRadius: "7px", border: "none",
                  background: c.green, color: c.white,
                  fontSize: "13px", fontWeight: 600, cursor: oddsKeySaving ? "not-allowed" : "pointer",
                }}
              >
                {oddsKeySaving ? "Saving…" : "Save"}
              </button>
              {oddsKeySaved && <span style={{ fontSize: "13px", color: c.green, fontWeight: 600 }}>✓ Saved</span>}
            </div>
          </div>
        )}
      </div>

      {/* Round Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
        {rounds.map((r) => {
          const clickable = true;
          return (
            <button
              key={r.round_number}
              onClick={() => { if (clickable) { setActiveRound(r.round_number); setEditingDeadline(false); } }}
              style={{
                flex: 1, padding: "10px 4px", borderRadius: "8px", border: "none",
                textAlign: "center", fontSize: "12px", fontWeight: 700,
                cursor: clickable ? "pointer" : "default",
                backgroundColor:
                  activeRound === r.round_number ? c.green :
                  r.status === "completed" ? c.greenMuted : c.grayLighter,
                color:
                  activeRound === r.round_number ? c.white :
                  r.status === "completed" ? c.green : c.gray,
                opacity: clickable ? 1 : 0.4,
              }}
            >
              {roundLabel(r.round_number, totalRounds)}
            </button>
          );
        })}
      </div>

      {/* Lock Deadline */}
      <div style={{ backgroundColor: c.white, borderRadius: "12px", padding: "16px 20px", border: `1px solid ${c.grayLight}`, marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" as const }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: c.charcoal, minWidth: "100px" }}>Lock Deadline</span>
        {editingDeadline ? (
          <>
            <input
              type="date"
              value={deadlineInput.date}
              onChange={(e) => setDeadlineInput((p) => ({ ...p, date: e.target.value }))}
              style={{ padding: "7px 10px", border: `1.5px solid ${c.grayLight}`, borderRadius: "8px", fontSize: "14px", color: c.charcoal }}
            />
            <input
              type="time"
              value={deadlineInput.time}
              onChange={(e) => setDeadlineInput((p) => ({ ...p, time: e.target.value }))}
              style={{ padding: "7px 10px", border: `1.5px solid ${c.grayLight}`, borderRadius: "8px", fontSize: "14px", color: c.charcoal, width: "130px" }}
            />
            <span style={{ fontSize: "13px", color: c.gray }}>PT</span>
            <button
              disabled={!deadlineInput.date || savingDeadline}
              onClick={async () => {
                if (!activeRoundData) return;
                setSavingDeadline(true);
                // Convert PT input to UTC by formatting a reference date in LA and computing the offset
                const naive = new Date(`${deadlineInput.date}T${deadlineInput.time || "00:00"}:00`);
                const utcMs = naive.getTime();
                const laStr = naive.toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
                const laMs = new Date(laStr.replace(/(\d+)\/(\d+)\/(\d+),/, "$3-$1-$2")).getTime();
                const offsetMs = utcMs - laMs;
                const iso = new Date(naive.getTime() + offsetMs).toISOString();
                const { error: err } = await supabase.from("rounds").update({ lock_deadline: iso }).eq("id", activeRoundData.id);
                if (err) { setError(err.message); setSavingDeadline(false); return; }
                setDeadlineOverrides((prev) => ({ ...prev, [activeRoundData.id]: iso }));
                setSavingDeadline(false);
                setEditingDeadline(false);
              }}
              style={{ padding: "7px 14px", borderRadius: "8px", border: "none", background: deadlineInput.date ? c.green : "#9CA3AF", color: c.white, fontSize: "13px", fontWeight: 600, cursor: deadlineInput.date ? "pointer" : "not-allowed" }}
            >
              {savingDeadline ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditingDeadline(false)}
              style={{ fontSize: "13px", color: c.gray, background: "none", border: "none", cursor: "pointer" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: "14px", color: activeRoundData?.lock_deadline ? c.charcoal : c.gray, flex: 1 }}>
              {activeRoundData?.lock_deadline
                ? new Date(activeRoundData.lock_deadline).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })
                : "No deadline set"}
            </span>
            <button
              onClick={() => {
                if (activeRoundData?.lock_deadline) {
                  const d = new Date(activeRoundData.lock_deadline);
                  const ptStr = d.toLocaleString("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
                  const [datePart, timePart] = ptStr.split(", ");
                  const [mm, dd, yyyy] = datePart.split("/");
                  setDeadlineInput({ date: `${yyyy}-${mm}-${dd}`, time: timePart === "24:00" ? "00:00" : timePart });
                } else {
                  setDeadlineInput({ date: "", time: "" });
                }
                setEditingDeadline(true);
              }}
              style={{ fontSize: "13px", color: c.gray, background: "none", border: `1px solid ${c.grayLight}`, borderRadius: "6px", cursor: "pointer", padding: "5px 12px" }}
            >
              {activeRoundData?.lock_deadline ? "Edit" : "Set"}
            </button>
          </>
        )}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {assignedCount !== null && (
              <span style={{ fontSize: "13px", color: c.green, fontWeight: 600 }}>
                {assignedCount === 0 ? "No missing picks" : `${assignedCount} pick${assignedCount === 1 ? "" : "s"} assigned`}
              </span>
            )}
            <button
              onClick={async () => {
                if (!activeRoundData) return;
                setAssigningPicks(true);
                setAssignedCount(null);
                const { assigned } = await autoAssignMissedPicksForRound(
                  activeRoundData.id,
                  activeRound,
                  tournament.id
                );
                setAssignedCount(assigned);
                setAssigningPicks(false);
                if (assigned > 0) router.refresh();
              }}
              disabled={assigningPicks}
              style={{
                padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                border: `1px solid ${c.grayLight}`, background: c.white,
                color: c.charcoal, cursor: assigningPicks ? "not-allowed" : "pointer",
                whiteSpace: "nowrap" as const,
              }}
            >
              {assigningPicks ? "Assigning..." : "Auto-Assign Missed Picks"}
            </button>
            {(() => {
              const nextRound = rounds.find(r => r.round_number === activeRound + 1);
              const nextRoundAlreadyOpen = nextRound?.status === "active";
              if (!nextRound || activeRoundData?.status === "completed") return null;
              return (
                <button
                  onClick={async () => {
                    if (!nextRound || nextRoundAlreadyOpen) return;
                    setOpeningNextRound(true);
                    await supabase.from("rounds").update({ status: "active" }).eq("id", nextRound.id);
                    await supabase.from("tournaments").update({ status: "active" }).eq("id", tournament.id).neq("status", "concluded");
                    setOpeningNextRound(false);
                    router.refresh();
                  }}
                  disabled={openingNextRound || nextRoundAlreadyOpen}
                  style={{
                    padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                    border: `1px solid ${c.grayLight}`, background: nextRoundAlreadyOpen ? c.greenMuted : c.white,
                    color: nextRoundAlreadyOpen ? c.green : c.charcoal,
                    cursor: openingNextRound || nextRoundAlreadyOpen ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {nextRoundAlreadyOpen ? `Round ${activeRound + 1} Open` : openingNextRound ? "Opening..." : `Open Round ${activeRound + 1} for Picks`}
                </button>
              );
            })()}
            {activeRoundData?.status === "active" && activeAthletes.length > 0 && (() => {
              const allSaved = savedCount === activeAthletes.length;
              const isDisabled = completingRound || !allSaved;
              return (
                <button
                  onClick={async () => {
                    if (!activeRoundData || !allSaved) return;
                    setCompletingRound(true);
                    await autoAssignMissedPicksForRound(activeRoundData.id, activeRound, tournament.id);
                    await supabase.from("rounds").update({ status: "completed" }).eq("id", activeRoundData.id);
                    const nextRound = rounds.find((r) => r.round_number === activeRound + 1);
                    if (nextRound) {
                      await supabase.from("rounds").update({ status: "active" }).eq("id", nextRound.id);
                    } else {
                      await concludeTournament(tournament.id);
                    }
                    notifyRoundComplete(activeRoundData.id);
                    setCompletingRound(false);
                    router.refresh();
                  }}
                  disabled={isDisabled}
                  style={{
                    padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                    border: `1px solid ${allSaved ? c.green : c.grayLight}`,
                    background: allSaved ? c.green : c.white,
                    color: allSaved ? c.white : c.gray,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {completingRound ? "Completing..." : "Complete Round"}
                </button>
              );
            })()}
            <span style={{
              padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
              backgroundColor: activeRoundData?.status === "completed" ? c.greenMuted : activeRoundData?.status === "active" ? c.amberMuted : c.grayLighter,
              color: activeRoundData?.status === "completed" ? c.green : activeRoundData?.status === "active" ? c.amber : c.gray,
            }}>
              {activeRoundData?.status === "completed" ? "Completed" : activeRoundData?.status === "active" ? "In Progress" : "Upcoming"}
            </span>
          </div>
        </div>

        {/* Odds API sync — shown for all rounds when a sport key is set */}
        {(oddsKeySaved || (tournament as any).odds_api_sport_key) && (
          <div style={{
            backgroundColor: c.white, borderRadius: "14px", padding: "18px 22px",
            border: `1px solid ${c.grayLight}`, marginBottom: "20px",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: c.charcoal, margin: "0 0 2px" }}>Odds API Sync</p>
              <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 10px" }}>
                Pull Round {activeRound} results from the Odds API.
              </p>
              {sfError && (
                <p style={{ fontSize: "13px", color: "#EF4444", margin: "0" }}>{sfError}</p>
              )}
              {sfResult && (
                <div style={{ fontSize: "13px" }}>
                  <span style={{ color: c.green, fontWeight: 600 }}>✓ {sfResult.synced} results synced</span>
                  {sfResult.skipped > 0 && <span style={{ color: c.gray, marginLeft: "10px" }}>{sfResult.skipped} already recorded</span>}
                  {sfResult.needsManual.length > 0 && (
                    <div style={{ marginTop: "6px", color: "#D97706" }}>
                      ⚠ Needs manual entry ({sfResult.needsManual.length}): {sfResult.needsManual.join(", ")}
                      <span style={{ color: c.gray, marginLeft: "6px" }}>— walkover or retirement, enter result above</span>
                    </div>
                  )}
                  {sfResult.unmatched.length > 0 && (
                    <div style={{ marginTop: "6px", color: "#D97706" }}>
                      ⚠ Unmatched ({sfResult.unmatched.length}): {sfResult.unmatched.join(", ")}
                      <span style={{ color: c.gray, marginLeft: "6px" }}>— check athlete name spelling</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                if (!activeRoundData) return;
                const sportKey = oddsKeyDraft || (tournament as any).odds_api_sport_key;
                if (!sportKey) return;
                setSfSyncing(true);
                setSfError(null);
                setSfResult(null);
                const res = await syncRoundFromOddsApi(activeRoundData.id, activeRound, tournament.id, sportKey);
                if (res.error) setSfError(res.error);
                else { setSfResult(res); if (res.synced > 0) router.refresh(); }
                setSfSyncing(false);
              }}
              disabled={sfSyncing}
              style={{
                padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                border: `1px solid ${sfSyncing ? c.grayLight : c.green}`,
                background: sfSyncing ? c.white : c.green,
                color: sfSyncing ? c.gray : c.white,
                cursor: sfSyncing ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {sfSyncing ? "Syncing…" : `Sync Round ${activeRound} Results`}
            </button>
          </div>
        )}

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
            const isEditing = editingResultIds.has(a.id!);
            const sel = pending[a.id!] ?? saved;
            const hasChange = pending[a.id!] !== undefined && pending[a.id!] !== saved;
            const isSaving = savingId === a.id;
            const isUndoing = undoingId === a.id;
            const locked = !!saved && !isEditing;

            const cancelEdit = () => {
              setEditingResultIds((prev) => { const s = new Set(prev); s.delete(a.id!); return s; });
              setPending((prev) => { const n = { ...prev }; delete n[a.id!]; return n; });
            };

            const handleUndo = async () => {
              if (!activeRoundData) return;
              setUndoingId(a.id!);
              setError(null);
              const { error: undoErr } = await undoAthleteResult(a.id!, activeRoundData.id);
              if (undoErr) { setError(undoErr); setUndoingId(null); return; }
              setSavedResults((prev) => { const n = { ...prev }; delete n[a.id!]; return n; });
              setPending((prev) => { const n = { ...prev }; delete n[a.id!]; return n; });
              setEditingResultIds((prev) => { const s = new Set(prev); s.delete(a.id!); return s; });
              setUndoingId(null);
            };

            return (
              <div key={a.id} style={{
                display: "grid", gridTemplateColumns: "0.4fr 2fr 1fr 1.8fr",
                padding: "12px 20px", fontSize: "14px",
                backgroundColor: saved === "win" ? "#F0FAF3" : saved === "loss" ? "#FEF8F8" : c.white,
                borderTop: `1px solid ${c.grayLight}`, alignItems: "center",
              }}>
                <span style={{ fontWeight: 700, color: a.seed !== null ? c.green : c.gray }}>
                  {a.seed !== null ? a.seed : "—"}
                </span>
                <span style={{ fontWeight: 600, color: c.charcoal }}>{a.name}</span>

                {/* Won / Lost toggle */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => !locked && handleSelect(a.id!, "win")}
                    style={{
                      padding: "5px 12px", borderRadius: "7px", fontSize: "13px", fontWeight: 600,
                      cursor: locked ? "default" : "pointer",
                      border: sel === "win" ? "none" : `1.5px solid ${c.grayLight}`,
                      backgroundColor: sel === "win" ? c.green : c.white,
                      color: sel === "win" ? c.white : c.charcoal,
                      opacity: locked && sel !== "win" ? 0.4 : 1,
                    }}
                  >Won</button>
                  <button
                    onClick={() => !locked && handleSelect(a.id!, "loss")}
                    style={{
                      padding: "5px 12px", borderRadius: "7px", fontSize: "13px", fontWeight: 600,
                      cursor: locked ? "default" : "pointer",
                      border: sel === "loss" ? "none" : `1.5px solid ${c.grayLight}`,
                      backgroundColor: sel === "loss" ? c.red : c.white,
                      color: sel === "loss" ? c.white : c.charcoal,
                      opacity: locked && sel !== "loss" ? 0.4 : 1,
                    }}
                  >Lost</button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {hasChange && (
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
                  {isEditing && !hasChange && (
                    <button onClick={cancelEdit} style={{ fontSize: "12px", color: c.gray, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      Cancel
                    </button>
                  )}
                  {saved && !isEditing && (
                    <span style={{ fontSize: "12px", color: c.green, fontWeight: 600 }}>Saved</span>
                  )}
                  {saved && !isEditing && (
                    <button
                      onClick={handleUndo}
                      disabled={isUndoing}
                      style={{ fontSize: "12px", color: c.gray, background: "none", border: "none", cursor: isUndoing ? "not-allowed" : "pointer", padding: 0 }}
                    >
                      {isUndoing ? "Undoing..." : "Undo"}
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
          onEditDetails={() => setView("create")}
        />
      )}
    </div>
  );
}
