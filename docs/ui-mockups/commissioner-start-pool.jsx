import { useState } from "react";

const colors = {
  green: "#4A7C59",
  greenLight: "#5E9E6E",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  grayLighter: "#F3F4F6",
};

function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill={colors.green} />
      <circle cx="20" cy="20" r="11" stroke={colors.cream} strokeWidth="1.8" fill="none" />
      <path d="M11.5 9.5 Q20 18, 11.5 30.5" stroke={colors.cream} strokeWidth="1.8" fill="none" />
      <path d="M28.5 9.5 Q20 18, 28.5 30.5" stroke={colors.cream} strokeWidth="1.8" fill="none" />
    </svg>
  );
}

function Nav() {
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 40px",
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.grayLight}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <LogoIcon size={36} />
        <span style={{ fontSize: "22px", fontWeight: 700, color: colors.charcoal, letterSpacing: "-0.5px" }}>
          Goat Pool
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: colors.greenMuted, color: colors.green, fontSize: "15px", fontWeight: 500, cursor: "pointer" }}>
          Manage Pools
        </button>
        <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "transparent", color: colors.gray, fontSize: "15px", fontWeight: 500, cursor: "pointer" }}>
          My Pools
        </button>
        <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "transparent", color: colors.gray, fontSize: "15px", fontWeight: 500, cursor: "pointer" }}>
          Profile
        </button>
        <div style={{ width: "1px", height: "24px", backgroundColor: colors.grayLight, margin: "0 8px" }} />
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%", backgroundColor: colors.greenMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: colors.green, cursor: "pointer",
        }}>BM</div>
      </div>
    </nav>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={{
        display: "block",
        fontSize: "14px",
        fontWeight: 600,
        color: colors.charcoal,
        marginBottom: "6px",
      }}>
        {label}
      </label>
      {hint && (
        <p style={{ fontSize: "13px", color: colors.gray, margin: "0 0 8px" }}>{hint}</p>
      )}
      {children}
    </div>
  );
}

function TextInput({ placeholder, prefix, value, onChange }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      border: `1.5px solid ${colors.grayLight}`,
      borderRadius: "10px",
      backgroundColor: colors.white,
      overflow: "hidden",
    }}>
      {prefix && (
        <span style={{
          padding: "12px 0 12px 14px",
          fontSize: "15px",
          color: colors.gray,
          fontWeight: 500,
        }}>
          {prefix}
        </span>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        style={{
          flex: 1,
          padding: prefix ? "12px 14px 12px 4px" : "12px 14px",
          border: "none",
          outline: "none",
          fontSize: "15px",
          color: colors.charcoal,
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}

function SelectInput({ options, value, onChange }) {
  return (
    <select
      value={value || ""}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "12px 14px",
        border: `1.5px solid ${colors.grayLight}`,
        borderRadius: "10px",
        fontSize: "15px",
        color: colors.charcoal,
        backgroundColor: colors.white,
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function ToggleOption({ options, selected, onSelect }) {
  return (
    <div style={{
      display: "flex",
      gap: "8px",
    }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: `1.5px solid ${selected === opt.value ? colors.green : colors.grayLight}`,
            backgroundColor: selected === opt.value ? colors.greenMuted : colors.white,
            color: selected === opt.value ? colors.green : colors.charcoal,
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function StartPool() {
  const [poolName, setPoolName] = useState("");
  const [tournament, setTournament] = useState("wimbledon-2026");
  const [fee, setFee] = useState("");
  const [missedPickRule, setMissedPickRule] = useState("top_seed");
  const [commissionerPlaying, setCommissionerPlaying] = useState(true);
  const [commissionerLives, setCommissionerLives] = useState("1");
  const [inviteEmails, setInviteEmails] = useState("");
  const [step, setStep] = useState(1);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }}>Manage Pools</span>
          <span style={{ fontSize: "14px", color: colors.grayLight }}>/</span>
          <span style={{ fontSize: "14px", color: colors.charcoal, fontWeight: 600 }}>Start a Pool</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Start a Pool
        </h1>
        <p style={{ fontSize: "15px", color: colors.gray, margin: "0 0 32px" }}>
          Set up your pool in a few quick steps.
        </p>

        {/* Progress Steps */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "36px" }}>
          {["Pool Details", "Rules", "Invite Players"].map((s, i) => (
            <div key={s} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                height: "4px",
                width: "100%",
                borderRadius: "2px",
                backgroundColor: i + 1 <= step ? colors.green : colors.grayLight,
                transition: "all 0.3s",
              }} />
              <span style={{
                fontSize: "12px",
                fontWeight: 600,
                color: i + 1 <= step ? colors.green : colors.gray,
              }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Pool Details */}
        {step === 1 && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: "16px",
            padding: "32px",
            border: `1px solid ${colors.grayLight}`,
          }}>
            <FormField label="Pool Name" hint="Must be unique. This will appear in the URL.">
              <TextInput
                placeholder="e.g., Roger's Wimbledon Pool"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
              />
            </FormField>

            <FormField label="Tournament">
              <SelectInput
                value={tournament}
                onChange={(e) => setTournament(e.target.value)}
                options={[
                  { value: "wimbledon-2026", label: "Wimbledon 2026" },
                  { value: "us-open-2026", label: "US Open 2026" },
                ]}
              />
            </FormField>

            <FormField label="Fee per Life" hint="Players choose 1 or 2 lives when joining. They pay this amount per life.">
              <TextInput
                placeholder="4.00"
                prefix="$"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </FormField>

            <div style={{
              padding: "14px 16px",
              borderRadius: "10px",
              backgroundColor: colors.greenMuted,
              marginBottom: "24px",
            }}>
              <p style={{ fontSize: "13px", color: colors.green, margin: 0, fontWeight: 500 }}>
                With 10 players averaging 1.5 lives at ${fee || "0"}/life, you'd earn <strong>${Math.round((Number(fee || 0) * 15 * 0.5) * 100) / 100}</strong> after the platform cut.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "none",
                background: colors.green,
                color: colors.white,
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Rules */}
        {step === 2 && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: "16px",
            padding: "32px",
            border: `1px solid ${colors.grayLight}`,
          }}>
            <FormField label="Missed Pick Rule" hint="What happens if a player forgets to submit a pick.">
              <ToggleOption
                options={[
                  { value: "top_seed", label: "Top Seed Remaining" },
                  { value: "random", label: "Random Athlete" },
                ]}
                selected={missedPickRule}
                onSelect={setMissedPickRule}
              />
            </FormField>

            {/* Commissioner Playing */}
            <div style={{ borderTop: `1px solid ${colors.grayLight}`, paddingTop: "24px" }}>
              <FormField label="Are you playing?" hint="Join your own pool as a player. No fee for you.">
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
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "10px",
                  border: `1.5px solid ${colors.grayLight}`,
                  background: colors.white,
                  color: colors.charcoal,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 2,
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: colors.green,
                  color: colors.white,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Invite */}
        {step === 3 && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: "16px",
            padding: "32px",
            border: `1px solid ${colors.grayLight}`,
          }}>
            <FormField label="Invite Players" hint="Enter email addresses separated by commas. They'll receive an invite with a link to join.">
              <textarea
                placeholder="friend1@email.com, friend2@email.com, friend3@email.com"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: `1.5px solid ${colors.grayLight}`,
                  borderRadius: "10px",
                  fontSize: "15px",
                  color: colors.charcoal,
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </FormField>

            <p style={{ fontSize: "13px", color: colors.gray, margin: "0 0 24px" }}>
              You can always invite more players later from your pool management page.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "10px",
                  border: `1.5px solid ${colors.grayLight}`,
                  background: colors.white,
                  color: colors.charcoal,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                style={{
                  flex: 2,
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: colors.green,
                  color: colors.white,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Create Pool & Send Invites
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
