"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CommissionerNav from "../CommissionerNav";

const c = {
  green: "#4A7C59",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  grayLighter: "#F3F4F6",
  red: "#EF4444",
  redMuted: "#FEF2F2",
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function ToggleOption({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: `1.5px solid ${selected === opt.value ? c.green : c.grayLight}`,
            backgroundColor: selected === opt.value ? c.greenMuted : c.white,
            color: selected === opt.value ? c.green : c.charcoal,
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 8px" }}>{hint}</p>}
      {children}
    </div>
  );
}

function inputStyle() {
  return {
    width: "100%", padding: "12px 14px",
    border: `1.5px solid ${c.grayLight}`, borderRadius: "10px",
    fontSize: "15px", color: c.charcoal,
    backgroundColor: c.white, boxSizing: "border-box" as const,
  };
}

export default function StartPoolClient({
  userId,
  username,
  isAdmin,
  tournaments,
}: {
  userId: string;
  username: string;
  isAdmin: boolean;
  tournaments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [poolName, setPoolName] = useState("");
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? "");
  const [fee, setFee] = useState("");

  // Step 2
  const [missedPickRule, setMissedPickRule] = useState("top_seed");
  const [commissionerPlaying, setCommissionerPlaying] = useState(true);
  const [commissionerLives, setCommissionerLives] = useState("1");

  // Step 3
  const [inviteEmails, setInviteEmails] = useState("");

  const feeNum = parseFloat(fee) || 0;
  const estimatedEarnings = Math.round(feeNum * 15 * 0.5 * 100) / 100;

  const goToStep2 = () => {
    if (!poolName.trim()) { setError("Pool name is required."); return; }
    if (!tournamentId) { setError("Select a tournament."); return; }
    if (fee === "" || isNaN(parseFloat(fee)) || parseFloat(fee) < 0) {
      setError("Enter a valid fee per life (0 for a free pool)."); return;
    }
    setError(null);
    setStep(2);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    const slug = slugify(poolName);
    const feeCents = Math.round(parseFloat(fee) * 100);

    // Create pool
    const { data: pool, error: poolErr } = await supabase
      .from("pools")
      .insert({
        name: poolName.trim(),
        slug,
        tournament_id: tournamentId,
        commissioner_id: userId,
        fee_per_life: feeCents,
        missed_pick_rule: missedPickRule,
        take_rate: 50,
        status: "active",
      })
      .select()
      .single();

    if (poolErr) {
      setError(poolErr.message.includes("unique") ? "A pool with that name already exists." : poolErr.message);
      setLoading(false);
      return;
    }

    // Add commissioner as player if opted in
    if (commissionerPlaying) {
      const lives = parseInt(commissionerLives);
      await supabase.from("pool_players").insert({
        pool_id: pool.id,
        user_id: userId,
        lives_purchased: lives,
        lives_remaining: lives,
        payment_status: "paid_external",
        status: "alive",
      });
    }

    // Update role to commissioner if still player
    await supabase
      .from("users")
      .update({ role: "commissioner" })
      .eq("id", userId)
      .eq("role", "player");

    // Create invite records
    const emails = inviteEmails
      .split(/[\s,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));

    if (emails.length > 0) {
      const invites = emails.map((email) => ({
        pool_id: pool.id,
        email,
        invite_token: crypto.randomUUID(),
        status: "pending",
      }));
      await supabase.from("pool_invites").insert(invites);
    }

    router.push(`/commissioner/managepool/${slug}`);
  };

  const steps = ["Pool Details", "Rules", "Invite Players"];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      <CommissionerNav username={username} isAdmin={isAdmin} />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          <Link href="/commissioner" style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>My Pools</Link>
          <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
          <span style={{ fontSize: "14px", color: c.charcoal, fontWeight: 600 }}>Start a Pool</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Start a Pool
        </h1>
        <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 32px" }}>
          Set up your pool in a few quick steps.
        </p>

        {/* Progress */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "36px" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{
                height: "4px", width: "100%", borderRadius: "2px",
                backgroundColor: i + 1 <= step ? c.green : c.grayLight,
              }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: i + 1 <= step ? c.green : c.gray }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: c.redMuted, border: `1px solid #FECACA`, color: c.red, fontSize: "14px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Step 1: Pool Details */}
        {step === 1 && (
          <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "32px", border: `1px solid ${c.grayLight}` }}>
            <FormField label="Pool Name" hint="Must be unique. Used in the pool URL.">
              <input
                type="text"
                placeholder="e.g., Roger's Wimbledon Pool"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                style={inputStyle()}
              />
            </FormField>

            <FormField label="Tournament">
              {tournaments.length === 0 ? (
                <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: c.grayLighter, fontSize: "14px", color: c.gray }}>
                  No tournaments available. Ask the Admin to create one first.
                </div>
              ) : (
                <select
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  style={{ ...inputStyle(), cursor: "pointer" }}
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField label="Fee per Life" hint="Players choose 1 or 2 lives when joining and pay this amount per life.">
              <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${c.grayLight}`, borderRadius: "10px", backgroundColor: c.white, overflow: "hidden" }}>
                <span style={{ padding: "12px 0 12px 14px", fontSize: "15px", color: c.gray }}>$</span>
                <input
                  type="number"
                  placeholder="4.00"
                  value={fee}
                  min="0"
                  step="0.50"
                  onChange={(e) => setFee(e.target.value)}
                  style={{ flex: 1, padding: "12px 14px 12px 4px", border: "none", outline: "none", fontSize: "15px", color: c.charcoal, backgroundColor: "transparent" }}
                />
              </div>
            </FormField>

            {feeNum > 0 && (
              <div style={{ padding: "14px 16px", borderRadius: "10px", backgroundColor: c.greenMuted, marginBottom: "24px" }}>
                <p style={{ fontSize: "13px", color: c.green, margin: 0, fontWeight: 500 }}>
                  With 10 players averaging 1.5 lives at ${fee}/life, you&apos;d earn <strong>${estimatedEarnings.toFixed(2)}</strong> after the platform cut.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={goToStep2}
              disabled={tournaments.length === 0}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                background: tournaments.length === 0 ? "#9CA3AF" : c.green,
                color: c.white, fontSize: "15px", fontWeight: 600,
                cursor: tournaments.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Rules */}
        {step === 2 && (
          <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "32px", border: `1px solid ${c.grayLight}` }}>
            <FormField label="Missed Pick Rule" hint="What happens if a player forgets to submit their pick before the deadline.">
              <ToggleOption
                options={[
                  { value: "top_seed", label: "Top Seed Remaining" },
                  { value: "random", label: "Random Athlete" },
                ]}
                selected={missedPickRule}
                onSelect={setMissedPickRule}
              />
            </FormField>

            <div style={{ borderTop: `1px solid ${c.grayLight}`, paddingTop: "24px" }}>
              <FormField label="Are you playing?" hint="Join your own pool as a player. No fee charged to you.">
                <ToggleOption
                  options={[
                    { value: "yes", label: "Yes, I'm in" },
                    { value: "no", label: "No, just managing" },
                  ]}
                  selected={commissionerPlaying ? "yes" : "no"}
                  onSelect={(v) => setCommissionerPlaying(v === "yes")}
                />
              </FormField>

              {commissionerPlaying && (
                <FormField label="How many lives?" hint="Choose your risk level.">
                  <ToggleOption
                    options={[
                      { value: "1", label: "1 — One and done" },
                      { value: "2", label: "2 — Second chance" },
                    ]}
                    selected={commissionerLives}
                    onSelect={setCommissionerLives}
                  />
                </FormField>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button type="button" onClick={() => setStep(1)} style={{
                flex: 1, padding: "14px", borderRadius: "10px",
                border: `1.5px solid ${c.grayLight}`, background: c.white,
                color: c.charcoal, fontSize: "15px", fontWeight: 600, cursor: "pointer",
              }}>Back</button>
              <button type="button" onClick={() => { setError(null); setStep(3); }} style={{
                flex: 2, padding: "14px", borderRadius: "10px", border: "none",
                background: c.green, color: c.white, fontSize: "15px", fontWeight: 600, cursor: "pointer",
              }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Invite */}
        {step === 3 && (
          <div style={{ backgroundColor: c.white, borderRadius: "16px", padding: "32px", border: `1px solid ${c.grayLight}` }}>
            <FormField label="Invite Players" hint="Enter email addresses separated by commas. Invites will be sent once you create the pool.">
              <textarea
                placeholder="friend1@email.com, friend2@email.com, ..."
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                rows={4}
                style={{
                  width: "100%", padding: "12px 14px",
                  border: `1.5px solid ${c.grayLight}`, borderRadius: "10px",
                  fontSize: "15px", color: c.charcoal, resize: "vertical",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </FormField>

            <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 24px" }}>
              You can invite more players later from the pool management page.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={() => setStep(2)} style={{
                flex: 1, padding: "14px", borderRadius: "10px",
                border: `1.5px solid ${c.grayLight}`, background: c.white,
                color: c.charcoal, fontSize: "15px", fontWeight: 600, cursor: "pointer",
              }}>Back</button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                style={{
                  flex: 2, padding: "14px", borderRadius: "10px", border: "none",
                  background: loading ? "#9CA3AF" : c.green, color: c.white,
                  fontSize: "15px", fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating..." : "Create Pool & Send Invites"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
