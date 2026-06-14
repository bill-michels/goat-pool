"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateUsername, updateEmail, updatePassword, createStripeConnectLink } from "./actions";

const c = {
  green: "#4A7C59", greenMuted: "#E8F0EA", cream: "#F5F3EF",
  white: "#FFFFFF", charcoal: "#2D2D2D", gray: "#6B7280",
  grayLight: "#E5E7EB", grayLighter: "#F3F4F6",
  red: "#EF4444", redMuted: "#FEF2F2",
  amber: "#D97706",
};

function LogoIcon() {
  return (
    <svg width={36} height={36} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill={c.green} />
      <circle cx="20" cy="20" r="11" stroke={c.cream} strokeWidth="1.8" fill="none" />
      <path d="M11.5 9.5 Q20 18, 11.5 30.5" stroke={c.cream} strokeWidth="1.8" fill="none" />
      <path d="M28.5 9.5 Q20 18, 28.5 30.5" stroke={c.cream} strokeWidth="1.8" fill="none" />
    </svg>
  );
}

function EditableRow({
  label, value, type = "text", onSave,
}: {
  label: string;
  value: string;
  type?: string;
  onSave: (val: string) => Promise<{ error?: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (input.trim() === value) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    const result = await onSave(input);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "18px 24px", borderBottom: `1px solid ${c.grayLight}`,
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </p>
        {editing ? (
          <input
            type={type}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
            style={{
              fontSize: "15px", color: c.charcoal, fontWeight: 500,
              border: `1.5px solid ${c.green}`, borderRadius: "8px",
              padding: "6px 10px", outline: "none", width: "280px",
            }}
          />
        ) : (
          <p style={{ fontSize: "15px", color: c.charcoal, fontWeight: 500, margin: 0 }}>
            {value}
            {saved && <span style={{ fontSize: "12px", color: c.green, fontWeight: 600, marginLeft: "8px" }}>Saved</span>}
          </p>
        )}
        {error && <p style={{ fontSize: "12px", color: c.red, margin: "4px 0 0" }}>{error}</p>}
      </div>
      <button
        onClick={() => editing ? handleSave() : (setEditing(true), setInput(value), setError(null))}
        disabled={saving}
        style={{
          padding: "8px 16px", borderRadius: "8px", marginLeft: "16px",
          border: `1.5px solid ${editing ? c.green : c.grayLight}`,
          background: editing ? c.greenMuted : c.white,
          color: editing ? c.green : c.gray,
          fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving..." : editing ? "Save" : "Edit"}
      </button>
      {editing && (
        <button
          onClick={() => setEditing(false)}
          style={{ padding: "8px 12px", borderRadius: "8px", marginLeft: "8px", border: "none", background: "none", color: c.gray, fontSize: "13px", cursor: "pointer" }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function PasswordRow() {
  const [open, setOpen] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (newPass !== confirm) { setError("Passwords don't match."); return; }
    setSaving(true);
    setError(null);
    const result = await updatePassword(newPass);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setOpen(false);
      setNewPass("");
      setConfirm("");
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div style={{ padding: "18px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</p>
          <p style={{ fontSize: "15px", color: c.charcoal, fontWeight: 500, margin: 0 }}>
            ••••••••
            {saved && <span style={{ fontSize: "12px", color: c.green, fontWeight: 600, marginLeft: "8px" }}>Updated</span>}
          </p>
        </div>
        <button
          onClick={() => { setOpen((v) => !v); setError(null); }}
          style={{
            padding: "8px 16px", borderRadius: "8px",
            border: `1.5px solid ${c.grayLight}`, background: c.white,
            color: c.gray, fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}
        >
          Change
        </button>
      </div>

      {open && (
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="password"
            placeholder="New password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            style={{
              padding: "10px 12px", border: `1.5px solid ${c.grayLight}`, borderRadius: "8px",
              fontSize: "14px", color: c.charcoal, outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{
              padding: "10px 12px", border: `1.5px solid ${c.grayLight}`, borderRadius: "8px",
              fontSize: "14px", color: c.charcoal, outline: "none",
            }}
          />
          {error && <p style={{ fontSize: "12px", color: c.red, margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSave}
              disabled={saving || !newPass || !confirm}
              style={{
                padding: "9px 20px", borderRadius: "8px", border: "none",
                background: saving || !newPass || !confirm ? "#9CA3AF" : c.green,
                color: c.white, fontSize: "13px", fontWeight: 600,
                cursor: saving || !newPass || !confirm ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Update Password"}
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{ padding: "9px 16px", borderRadius: "8px", border: `1.5px solid ${c.grayLight}`, background: c.white, color: c.gray, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfileClient({
  username, email, memberSince, poolsPlayed, poolsWon, poolsCommissioned,
  stripeConnected, stripeAccountId,
}: {
  username: string;
  email: string;
  memberSince: string | null;
  poolsPlayed: number;
  poolsWon: number;
  poolsCommissioned: number;
  stripeConnected: boolean;
  stripeAccountId: string | null;
}) {
  const router = useRouter();
  const initials = username.slice(0, 2).toUpperCase();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const handleConnectStripe = async () => {
    setStripeLoading(true);
    setStripeError(null);
    const result = await createStripeConnectLink();
    if (result.error) {
      setStripeError(result.error);
      setStripeLoading(false);
    } else if (result.url) {
      window.location.href = result.url;
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px", backgroundColor: c.white, borderBottom: `1px solid ${c.grayLight}`,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <Link href="/player" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <LogoIcon />
          <span style={{ fontSize: "22px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.5px" }}>Goat Pool</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/player" style={{ padding: "8px 16px", borderRadius: "8px", textDecoration: "none", color: c.gray, fontSize: "15px", fontWeight: 500 }}>
            My Pools
          </Link>
          <div style={{ width: "1px", height: "24px", backgroundColor: c.grayLight, margin: "0 8px" }} />
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%", backgroundColor: c.greenMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 700, color: c.green,
          }}>
            {initials}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: c.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Profile</h1>
        <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 32px" }}>Manage your account details.</p>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%", backgroundColor: c.greenMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: 700, color: c.green,
          }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: "20px", fontWeight: 700, color: c.charcoal, margin: "0 0 2px" }}>{username}</p>
            {memberSince && <p style={{ fontSize: "14px", color: c.gray, margin: 0 }}>Member since {memberSince}</p>}
          </div>
        </div>

        {/* Account Details */}
        <div style={{ backgroundColor: c.white, borderRadius: "14px", border: `1px solid ${c.grayLight}`, overflow: "hidden", marginBottom: "24px" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${c.grayLight}` }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: c.charcoal, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Account Details</p>
          </div>
          <EditableRow label="Username" value={username} onSave={updateUsername} />
          <EditableRow
            label="Email"
            value={email}
            type="email"
            onSave={async (val) => {
              const result = await updateEmail(val);
              if (!result.error) {
                return { error: undefined };
              }
              return result;
            }}
          />
          <PasswordRow />
        </div>

        {/* Pool Activity */}
        <div style={{ backgroundColor: c.white, borderRadius: "14px", border: `1px solid ${c.grayLight}`, overflow: "hidden", marginBottom: "24px" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${c.grayLight}` }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: c.charcoal, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pool Activity</p>
          </div>
          <div style={{ display: "flex", padding: "20px 24px", gap: "40px" }}>
            {[
              { label: "Pools Played", value: poolsPlayed, color: c.charcoal },
              { label: "Pools Won", value: poolsWon, color: c.green },
              { label: "Commissioned", value: poolsCommissioned, color: c.charcoal },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontSize: "12px", color: c.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
                <p style={{ fontSize: "24px", fontWeight: 800, color, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stripe Payouts */}
        <div style={{ backgroundColor: c.white, borderRadius: "14px", border: `1px solid ${c.grayLight}`, overflow: "hidden", marginBottom: "24px" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${c.grayLight}` }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: c.charcoal, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Payouts — Commissioner</p>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {stripeConnected ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: c.green, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: c.charcoal, margin: "0 0 2px" }}>Stripe Connected</p>
                  <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>You&apos;re set up to receive payouts when your pools conclude.</p>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "14px", color: c.gray, margin: "0 0 16px", lineHeight: 1.6 }}>
                  Connect a Stripe account to receive your earnings when a pool you commissioned concludes. Takes about 2 minutes.
                </p>
                {stripeError && (
                  <p style={{ fontSize: "13px", color: c.red, margin: "0 0 12px" }}>{stripeError}</p>
                )}
                <button
                  onClick={handleConnectStripe}
                  disabled={stripeLoading}
                  style={{
                    padding: "10px 20px", borderRadius: "8px", border: "none",
                    background: stripeLoading ? "#9CA3AF" : c.green,
                    color: c.white, fontSize: "14px", fontWeight: 600,
                    cursor: stripeLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}
                >
                  {stripeLoading ? "Redirecting..." : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Connect Stripe Account
                    </>
                  )}
                </button>
                {stripeAccountId && !stripeConnected && (
                  <p style={{ fontSize: "12px", color: c.amber, margin: "10px 0 0" }}>
                    Setup incomplete — click above to finish connecting.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          style={{
            width: "100%", padding: "14px", borderRadius: "10px",
            border: `1.5px solid ${c.grayLight}`, background: c.white,
            color: c.gray, fontSize: "15px", fontWeight: 600, cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
