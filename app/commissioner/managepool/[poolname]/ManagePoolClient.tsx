"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CommissionerNav from "../../CommissionerNav";

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
  amber: "#D97706",
  amberMuted: "#FFFBEB",
};

type Round = {
  id: string;
  round_number: number;
  lock_deadline: string | null;
  status: string;
};

type Pick = {
  id: string;
  user_id: string;
  result: string | null;
  is_auto_assigned: boolean;
  rounds: { round_number: number } | null;
  athletes: { name: string } | null;
};

type Player = {
  id: string;
  user_id: string;
  status: string;
  lives_purchased: number;
  lives_remaining: number;
  payment_status: string;
  users: { username: string; email: string } | null;
  picks: Pick[];
};

type Invite = {
  id: string;
  email: string;
  status: string;
  sent_at: string;
};

type Pool = {
  id: string;
  name: string;
  slug: string;
  status: string;
  feePerLife: number;
  missedPickRule: string;
  takeRate: number;
  tournamentName: string;
};

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: c.white,
        borderRadius: "14px",
        padding: "20px",
        border: `1px solid ${c.grayLight}`,
        flex: 1,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: c.gray,
          margin: "0 0 6px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: color ?? c.charcoal,
          margin: 0,
          letterSpacing: "-1px",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isLive = status === "active" || status === "open";
  const label =
    status === "active" ? "Live" : status === "open" ? "Open" : "Concluded";
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: isLive ? c.greenMuted : c.grayLighter,
        color: isLive ? c.green : c.gray,
      }}
    >
      {label}
    </span>
  );
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return "TBD";
  return new Date(deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function roundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "SF";
  if (fromEnd === 2) return "QF";
  return `Round ${roundNumber}`;
}

export default function ManagePoolClient({
  userId,
  username,
  isAdmin,
  pool,
  rounds,
  players,
  invites: initialInvites,
  totalFees,
  earnings,
  payout,
}: {
  userId: string;
  username: string;
  isAdmin: boolean;
  pool: Pool;
  rounds: Round[];
  players: Player[];
  invites: Invite[];
  totalFees: number;
  earnings: number;
  payout: { amount: number; status: string } | null;
}) {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("players");
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const completedAndActiveRounds = rounds.filter(
    (r) => r.status !== "upcoming"
  );
  const aliveCount = players.filter((p) => p.status === "alive").length;

  const handleInviteMore = async () => {
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);

    const emails = inviteEmails
      .split(/[\s,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));

    if (emails.length === 0) {
      setInviteError("Enter at least one valid email address.");
      setInviteLoading(false);
      return;
    }

    const newInvites = emails.map((email) => ({
      pool_id: pool.id,
      email,
      invite_token: crypto.randomUUID(),
      status: "pending",
    }));

    const { data, error } = await supabase
      .from("pool_invites")
      .insert(newInvites)
      .select("id, email, status, sent_at");

    if (error) {
      setInviteError(error.message);
      setInviteLoading(false);
      return;
    }

    setInvites((prev) => [...(data ?? []), ...prev]);
    setInviteEmails("");
    setInviteSuccess(true);
    setInviteLoading(false);
    setTimeout(() => {
      setShowInviteForm(false);
      setInviteSuccess(false);
    }, 1500);
  };

  const missedPickLabel =
    pool.missedPickRule === "top_seed" ? "Top Seed Remaining" : "Random Athlete";

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: c.charcoal,
        minHeight: "100vh",
        backgroundColor: c.cream,
      }}
    >
      <CommissionerNav username={username} isAdmin={isAdmin} />

      <div
        style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 40px" }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <Link
            href="/commissioner"
            style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}
          >
            My Pools
          </Link>
          <span style={{ fontSize: "14px", color: c.grayLight }}>/</span>
          <span
            style={{ fontSize: "14px", color: c.charcoal, fontWeight: 600 }}
          >
            {pool.name}
          </span>
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "4px",
              }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: c.charcoal,
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                {pool.name}
              </h1>
              <StatusBadge status={pool.status} />
            </div>
            <p style={{ fontSize: "15px", color: c.gray, margin: 0 }}>
              {pool.tournamentName}
              {rounds.length > 0 && (
                <>
                  {" "}
                  —{" "}
                  {(() => {
                    const active = rounds.find((r) => r.status === "active");
                    if (active)
                      return `${roundLabel(active.round_number, rounds.length)} of ${rounds.length}`;
                    const completed = rounds.filter(
                      (r) => r.status === "completed"
                    ).length;
                    if (completed === rounds.length) return "Completed";
                    return `${rounds.length} rounds`;
                  })()}
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowInviteForm((v) => !v);
              setInviteError(null);
              setInviteSuccess(false);
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: `1.5px solid ${c.grayLight}`,
              background: showInviteForm ? c.grayLighter : c.white,
              color: c.charcoal,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Invite More
          </button>
        </div>

        {/* Inline Invite Form */}
        {showInviteForm && (
          <div
            style={{
              backgroundColor: c.white,
              borderRadius: "14px",
              padding: "24px",
              border: `1px solid ${c.grayLight}`,
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: c.charcoal,
                margin: "0 0 8px",
              }}
            >
              Invite More Players
            </p>
            <p style={{ fontSize: "13px", color: c.gray, margin: "0 0 12px" }}>
              Enter email addresses separated by commas.
            </p>
            <textarea
              placeholder="friend@email.com, another@email.com, ..."
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1.5px solid ${c.grayLight}`,
                borderRadius: "10px",
                fontSize: "14px",
                color: c.charcoal,
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
                marginBottom: "12px",
              }}
            />
            {inviteError && (
              <p
                style={{
                  fontSize: "13px",
                  color: c.red,
                  margin: "0 0 12px",
                }}
              >
                {inviteError}
              </p>
            )}
            {inviteSuccess && (
              <p
                style={{
                  fontSize: "13px",
                  color: c.green,
                  fontWeight: 600,
                  margin: "0 0 12px",
                }}
              >
                Invites sent!
              </p>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: `1.5px solid ${c.grayLight}`,
                  background: c.white,
                  color: c.charcoal,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInviteMore}
                disabled={inviteLoading}
                style={{
                  flex: 1,
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: inviteLoading ? "#9CA3AF" : c.green,
                  color: c.white,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: inviteLoading ? "not-allowed" : "pointer",
                }}
              >
                {inviteLoading ? "Sending..." : "Send Invites"}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div
          style={{ display: "flex", gap: "12px", marginBottom: "24px" }}
        >
          <StatCard label="Players" value={String(players.length)} />
          <StatCard
            label="Alive"
            value={String(aliveCount)}
            color={aliveCount > 0 ? c.green : c.gray}
          />
          <StatCard
            label="Invites Sent"
            value={String(invites.length)}
          />
          <StatCard
            label="Fees Collected"
            value={
              totalFees > 0 ? `$${(totalFees / 100).toFixed(0)}` : "$0"
            }
          />
          <StatCard
            label="Your Earnings"
            value={earnings > 0 ? `$${(earnings / 100).toFixed(0)}` : "$0"}
            color={earnings > 0 ? c.green : c.charcoal}
          />
        </div>

        {/* Pool Rules Summary */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            padding: "16px 20px",
            backgroundColor: c.white,
            borderRadius: "12px",
            border: `1px solid ${c.grayLight}`,
            marginBottom: "24px",
            fontSize: "13px",
            color: c.gray,
            flexWrap: "wrap",
          }}
        >
          <span>
            <strong style={{ color: c.charcoal }}>Fee per Life:</strong>{" "}
            ${(pool.feePerLife / 100).toFixed(2)}
          </span>
          <span>
            <strong style={{ color: c.charcoal }}>Lives:</strong> 1 or 2
            (player&apos;s choice)
          </span>
          <span>
            <strong style={{ color: c.charcoal }}>Missed Pick:</strong>{" "}
            {missedPickLabel}
          </span>
        </div>

        {/* Round Lock Dates */}
        {rounds.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: c.charcoal, margin: 0 }}>
                Rounds &amp; Lock Dates
              </p>
              <p style={{ fontSize: "11px", color: c.gray, margin: 0 }}>
                Dates may shift based on match times
              </p>
            </div>
            <div style={{ backgroundColor: c.white, borderRadius: "12px", border: `1px solid ${c.grayLight}`, overflow: "hidden" }}>
              {rounds.map((r, i) => {
                const isActive = r.status === "active";
                const isCompleted = r.status === "completed" || r.status === "locked";
                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 16px",
                      borderTop: i > 0 ? `1px solid ${c.grayLight}` : "none",
                      backgroundColor: isActive ? c.greenMuted : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "13px", fontWeight: isActive ? 700 : 500, color: isActive ? c.green : isCompleted ? c.gray : c.charcoal }}>
                        {roundLabel(r.round_number, rounds.length)}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "5px", backgroundColor: c.green, color: c.white }}>
                          Active
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{ fontSize: "11px", color: c.gray }}>Completed</span>
                      )}
                    </div>
                    <span style={{ fontSize: "13px", color: isCompleted ? c.gray : c.charcoal, textDecoration: isCompleted ? "line-through" : "none" }}>
                      {formatDeadline(r.lock_deadline)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
          {[
            { key: "players", label: `Players (${players.length})` },
            { key: "invites", label: `Invites (${invites.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background:
                  activeTab === tab.key ? c.charcoal : "transparent",
                color: activeTab === tab.key ? c.white : c.gray,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Players Tab */}
        {activeTab === "players" && (
          <div
            style={{
              backgroundColor: c.white,
              borderRadius: "14px",
              overflow: "hidden",
              border: `1px solid ${c.grayLight}`,
            }}
          >
            {players.length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: c.gray,
                  fontSize: "15px",
                }}
              >
                No players have joined yet. Share your invite link!
              </div>
            ) : (
              <>
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `2fr 1fr 1fr 1fr ${completedAndActiveRounds.length > 0 ? "2fr" : ""}`,
                    padding: "12px 20px",
                    backgroundColor: c.grayLighter,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: c.gray,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    gap: "8px",
                  }}
                >
                  <span>Player</span>
                  <span>Status</span>
                  <span>Lives</span>
                  <span>Paid</span>
                  {completedAndActiveRounds.length > 0 && (
                    <span>
                      Picks (
                      {completedAndActiveRounds
                        .map((r) => roundLabel(r.round_number, rounds.length))
                        .join(", ")}
                      )
                    </span>
                  )}
                </div>

                {players.map((player) => {
                  const userInfo = player.users as any;
                  const isAlive = player.status === "alive";
                  const isWinner = player.status === "winner";

                  const pickSummary = completedAndActiveRounds
                    .map((round) => {
                      const pick = player.picks.find(
                        (p) =>
                          (p.rounds as any)?.round_number ===
                          round.round_number
                      );
                      if (!pick) return "—";
                      const name = (pick.athletes as any)?.name ?? "?";
                      if (pick.result === "win") return `${name} ✓`;
                      if (pick.result === "loss") return `${name} ✗`;
                      return name;
                    })
                    .join(" → ");

                  return (
                    <div
                      key={player.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: `2fr 1fr 1fr 1fr ${completedAndActiveRounds.length > 0 ? "2fr" : ""}`,
                        padding: "14px 20px",
                        fontSize: "14px",
                        borderTop: `1px solid ${c.grayLight}`,
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: c.charcoal,
                          }}
                        >
                          {userInfo?.username ?? "—"}
                          {player.user_id === userId && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: c.green,
                                marginLeft: "6px",
                                fontWeight: 500,
                              }}
                            >
                              (you)
                            </span>
                          )}
                        </span>
                        <br />
                        <span style={{ fontSize: "12px", color: c.gray }}>
                          {userInfo?.email ?? ""}
                        </span>
                      </div>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: isWinner
                              ? c.amber
                              : isAlive
                              ? c.green
                              : c.red,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: isWinner
                              ? c.amber
                              : isAlive
                              ? c.green
                              : c.red,
                          }}
                        >
                          {isWinner ? "Winner" : isAlive ? "Alive" : "Out"}
                        </span>
                      </span>

                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            player.lives_remaining > 0
                              ? c.charcoal
                              : c.gray,
                        }}
                      >
                        {player.lives_remaining > 0
                          ? `${player.lives_remaining} of ${player.lives_purchased}`
                          : "—"}
                      </span>

                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          backgroundColor:
                            player.payment_status === "paid_stripe"
                              ? c.greenMuted
                              : player.payment_status === "paid_external"
                              ? c.grayLighter
                              : c.redMuted,
                          color:
                            player.payment_status === "paid_stripe"
                              ? c.green
                              : player.payment_status === "paid_external"
                              ? c.gray
                              : c.red,
                          display: "inline-block",
                          width: "fit-content",
                        }}
                      >
                        {player.payment_status === "paid_stripe"
                          ? "Stripe"
                          : player.payment_status === "paid_external"
                          ? "External"
                          : "Unpaid"}
                      </span>

                      {completedAndActiveRounds.length > 0 && (
                        <span style={{ fontSize: "13px", color: c.gray }}>
                          {pickSummary || "No picks yet"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Invites Tab */}
        {activeTab === "invites" && (
          <div
            style={{
              backgroundColor: c.white,
              borderRadius: "14px",
              overflow: "hidden",
              border: `1px solid ${c.grayLight}`,
            }}
          >
            {invites.length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: c.gray,
                  fontSize: "15px",
                }}
              >
                No invites sent yet.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    padding: "12px 20px",
                    backgroundColor: c.grayLighter,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: c.gray,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span>Email</span>
                  <span>Status</span>
                  <span>Sent</span>
                </div>

                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr",
                      padding: "14px 20px",
                      fontSize: "14px",
                      borderTop: `1px solid ${c.grayLight}`,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{ color: c.charcoal, fontWeight: 500 }}
                    >
                      {inv.email}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor:
                          inv.status === "accepted"
                            ? c.greenMuted
                            : c.grayLighter,
                        color:
                          inv.status === "accepted" ? c.green : c.gray,
                        display: "inline-block",
                        width: "fit-content",
                      }}
                    >
                      {inv.status === "accepted" ? "Accepted" : "Pending"}
                    </span>
                    <span style={{ fontSize: "13px", color: c.gray }}>
                      {new Date(inv.sent_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Payout Info */}
        {pool.status === "concluded" && payout ? (
          <div
            style={{
              marginTop: "28px",
              padding: "20px",
              borderRadius: "14px",
              backgroundColor:
                payout.status === "completed" ? c.greenMuted : c.amberMuted,
              border: `1px solid ${c.grayLight}`,
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color:
                  payout.status === "completed" ? c.green : c.amber,
                margin: 0,
                fontWeight: 600,
              }}
            >
              {payout.status === "completed"
                ? `Your payout of $${(payout.amount / 100).toFixed(2)} has been transferred to your Stripe account.`
                : `Your payout of $${(payout.amount / 100).toFixed(2)} is being processed.`}
            </p>
          </div>
        ) : earnings > 0 ? (
          <div
            style={{
              marginTop: "28px",
              padding: "20px",
              borderRadius: "14px",
              backgroundColor: c.greenMuted,
              border: `1px solid ${c.grayLight}`,
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: c.green,
                margin: 0,
                fontWeight: 600,
              }}
            >
              Your payout of ${(earnings / 100).toFixed(2)} will be
              transferred to your connected Stripe account when this pool
              concludes.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
