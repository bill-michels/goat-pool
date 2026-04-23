import { useState } from "react";

const colors = {
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
        <span style={{ fontSize: "22px", fontWeight: 700, color: colors.charcoal, letterSpacing: "-0.5px" }}>Goat Pool</span>
        <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: colors.amberMuted, color: colors.amber, marginLeft: "4px" }}>ADMIN</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {["Overview", "Tournaments", "Metrics"].map((tab) => (
          <button key={tab} style={{
            padding: "8px 16px", borderRadius: "8px", border: "none",
            background: tab === "Tournaments" ? colors.greenMuted : "transparent",
            color: tab === "Tournaments" ? colors.green : colors.gray,
            fontSize: "15px", fontWeight: 500, cursor: "pointer",
          }}>{tab}</button>
        ))}
        <div style={{ width: "1px", height: "24px", backgroundColor: colors.grayLight, margin: "0 8px" }} />
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%", backgroundColor: colors.amberMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: colors.amber, cursor: "pointer",
        }}>A</div>
      </div>
    </nav>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: colors.charcoal, marginBottom: "6px" }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: "13px", color: colors.gray, margin: "0 0 8px" }}>{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ placeholder, value, onChange, type }) {
  return (
    <input
      type={type || "text"}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "12px 14px",
        border: `1.5px solid ${colors.grayLight}`,
        borderRadius: "10px",
        fontSize: "15px",
        color: colors.charcoal,
        boxSizing: "border-box",
      }}
    />
  );
}

// View 1: Create Tournament
function CreateTournament({ onSwitch }) {
  const [name, setName] = useState("");
  const [numRounds, setNumRounds] = useState("7");

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
        <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }}>Admin</span>
        <span style={{ fontSize: "14px", color: colors.grayLight }}>/</span>
        <span style={{ fontSize: "14px", color: colors.charcoal, fontWeight: 600 }}>New Tournament</span>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        Create Tournament
      </h1>
      <p style={{ fontSize: "15px", color: colors.gray, margin: "0 0 32px" }}>
        Set up a new tournament. You'll add athletes and round deadlines next.
      </p>

      <div style={{ backgroundColor: colors.white, borderRadius: "16px", padding: "32px", border: `1px solid ${colors.grayLight}` }}>
        <FormField label="Tournament Name">
          <TextInput placeholder='e.g., Wimbledon 2026' value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField label="Number of Rounds" hint="For Grand Slams this is typically 7 (128-draw).">
          <TextInput placeholder="7" type="number" value={numRounds} onChange={(e) => setNumRounds(e.target.value)} />
        </FormField>

        <FormField label="Round Lock Deadlines" hint="Set the pick submission deadline for each round.">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Array.from({ length: Number(numRounds) || 0 }, (_, i) => {
              const labels = ["Round 1", "Round 2", "Round 3", "Round 4", "QF", "SF", "Final"];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: colors.charcoal, minWidth: "70px" }}>
                    {labels[i] || `Round ${i + 1}`}
                  </span>
                  <input
                    type="datetime-local"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: `1.5px solid ${colors.grayLight}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.charcoal,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </FormField>

        <button
          onClick={() => onSwitch("athletes")}
          style={{
            width: "100%", padding: "14px", borderRadius: "10px", border: "none",
            background: colors.green, color: colors.white, fontSize: "15px", fontWeight: 600, cursor: "pointer",
          }}
        >
          Continue — Add Athletes
        </button>
      </div>
    </div>
  );
}

// View 2: Add Athletes
function AddAthletes({ onSwitch }) {
  const sampleAthletes = [
    { name: "Jannik Sinner", seed: 1, bye: true },
    { name: "Carlos Alcaraz", seed: 2, bye: true },
    { name: "Novak Djokovic", seed: 3, bye: true },
    { name: "Alexander Zverev", seed: 4, bye: true },
    { name: "Daniil Medvedev", seed: 5, bye: false },
    { name: "Andrey Rublev", seed: 6, bye: false },
    { name: "Taylor Fritz", seed: 7, bye: false },
    { name: "Casper Ruud", seed: 8, bye: false },
  ];

  return (
    <div style={{ maxWidth: "740px", margin: "0 auto", padding: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
        <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }}>Admin</span>
        <span style={{ fontSize: "14px", color: colors.grayLight }}>/</span>
        <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }} onClick={() => onSwitch("create")}>Wimbledon 2026</span>
        <span style={{ fontSize: "14px", color: colors.grayLight }}>/</span>
        <span style={{ fontSize: "14px", color: colors.charcoal, fontWeight: 600 }}>Athletes</span>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        Add Athletes
      </h1>
      <p style={{ fontSize: "15px", color: colors.gray, margin: "0 0 24px" }}>
        Wimbledon 2026 — Add athletes with their seed and bye status.
      </p>

      {/* Bulk Add */}
      <div style={{ backgroundColor: colors.white, borderRadius: "16px", padding: "24px", border: `1px solid ${colors.grayLight}`, marginBottom: "20px" }}>
        <FormField label="Quick Add" hint="Paste a comma-separated list: Name (Seed), Name (Seed), ... Athletes with top seeds will be flagged for bye review.">
          <textarea
            placeholder="Jannik Sinner (1), Carlos Alcaraz (2), Novak Djokovic (3), ..."
            rows={3}
            style={{
              width: "100%", padding: "12px 14px", border: `1.5px solid ${colors.grayLight}`,
              borderRadius: "10px", fontSize: "14px", color: colors.charcoal,
              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </FormField>
        <button style={{
          padding: "10px 20px", borderRadius: "8px", border: "none",
          background: colors.green, color: colors.white, fontSize: "14px", fontWeight: 600, cursor: "pointer",
        }}>
          Add Athletes
        </button>
      </div>

      {/* Athlete List */}
      <div style={{
        backgroundColor: colors.white,
        borderRadius: "14px",
        overflow: "hidden",
        border: `1px solid ${colors.grayLight}`,
        marginBottom: "20px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "0.5fr 2fr 0.8fr 0.8fr",
          padding: "12px 20px",
          backgroundColor: colors.grayLighter,
          fontSize: "12px",
          fontWeight: 600,
          color: colors.gray,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          <span>Seed</span>
          <span>Athlete</span>
          <span>Bye (R1)</span>
          <span></span>
        </div>

        {sampleAthletes.map((a) => (
          <div key={a.seed} style={{
            display: "grid",
            gridTemplateColumns: "0.5fr 2fr 0.8fr 0.8fr",
            padding: "14px 20px",
            fontSize: "14px",
            borderTop: `1px solid ${colors.grayLight}`,
            alignItems: "center",
          }}>
            <span style={{ fontWeight: 700, color: colors.green }}>{a.seed}</span>
            <span style={{ fontWeight: 600, color: colors.charcoal }}>{a.name}</span>
            <span>
              {a.bye ? (
                <span style={{
                  fontSize: "12px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px",
                  backgroundColor: colors.amberMuted, color: colors.amber,
                }}>
                  Bye
                </span>
              ) : (
                <span style={{ fontSize: "13px", color: colors.gray }}>—</span>
              )}
            </span>
            <span style={{ fontSize: "13px", color: colors.gray, cursor: "pointer", textAlign: "right" }}>Edit</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "13px", color: colors.gray, marginBottom: "20px" }}>
        Showing 8 of 128 athletes. Continue adding to complete the draw.
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={() => onSwitch("create")} style={{
          flex: 1, padding: "14px", borderRadius: "10px",
          border: `1.5px solid ${colors.grayLight}`, background: colors.white,
          color: colors.charcoal, fontSize: "15px", fontWeight: 600, cursor: "pointer",
        }}>
          Back
        </button>
        <button onClick={() => onSwitch("manage")} style={{
          flex: 2, padding: "14px", borderRadius: "10px", border: "none",
          background: colors.green, color: colors.white, fontSize: "15px", fontWeight: 600, cursor: "pointer",
        }}>
          Save & Go to Tournament
        </button>
      </div>
    </div>
  );
}

// View 3: Manage Tournament (Round Results)
function ManageTournament({ onSwitch }) {
  const [activeRound, setActiveRound] = useState(3);

  const rounds = [
    { num: 1, label: "Round 1", status: "completed" },
    { num: 2, label: "Round 2", status: "completed" },
    { num: 3, label: "Round 3", status: "active" },
    { num: 4, label: "Round 4", status: "upcoming" },
    { num: 5, label: "QF", status: "upcoming" },
    { num: 6, label: "SF", status: "upcoming" },
    { num: 7, label: "Final", status: "upcoming" },
  ];

  const round3Athletes = [
    { name: "Jannik Sinner", seed: 1, result: null },
    { name: "Carlos Alcaraz", seed: 2, result: null },
    { name: "Novak Djokovic", seed: 3, result: null },
    { name: "Alexander Zverev", seed: 4, result: null },
    { name: "Daniil Medvedev", seed: 5, result: null },
    { name: "Holger Rune", seed: 9, result: null },
    { name: "Ben Shelton", seed: 12, result: null },
    { name: "Tommy Paul", seed: 14, result: null },
  ];

  const [results, setResults] = useState({});

  const markResult = (name, result) => {
    setResults((prev) => ({ ...prev, [name]: prev[name] === result ? null : result }));
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
        <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }} onClick={() => onSwitch("create")}>Admin</span>
        <span style={{ fontSize: "14px", color: colors.grayLight }}>/</span>
        <span style={{ fontSize: "14px", color: colors.charcoal, fontWeight: 600 }}>Wimbledon 2026</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: 0, letterSpacing: "-0.5px" }}>
              Wimbledon 2026
            </h1>
            <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, backgroundColor: colors.greenMuted, color: colors.green }}>
              Active
            </span>
          </div>
          <p style={{ fontSize: "15px", color: colors.gray, margin: 0 }}>128 athletes — 8 pools — 53 players</p>
        </div>
        <button onClick={() => onSwitch("athletes")} style={{
          padding: "10px 20px", borderRadius: "10px",
          border: `1.5px solid ${colors.grayLight}`, background: colors.white,
          color: colors.charcoal, fontSize: "14px", fontWeight: 600, cursor: "pointer",
        }}>
          View Athletes
        </button>
      </div>

      {/* Round Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
        {rounds.map((r) => (
          <button
            key={r.num}
            onClick={() => r.status !== "upcoming" && setActiveRound(r.num)}
            style={{
              flex: 1, padding: "10px 4px", borderRadius: "8px", border: "none", textAlign: "center",
              fontSize: "12px", fontWeight: 700, cursor: r.status !== "upcoming" ? "pointer" : "default",
              backgroundColor:
                activeRound === r.num ? colors.green :
                r.status === "completed" ? colors.greenMuted :
                colors.grayLighter,
              color:
                activeRound === r.num ? colors.white :
                r.status === "completed" ? colors.green :
                colors.gray,
              opacity: r.status === "upcoming" ? 0.5 : 1,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Round Results Entry */}
      <div style={{
        backgroundColor: colors.white,
        borderRadius: "16px",
        padding: "24px",
        border: `1px solid ${colors.grayLight}`,
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: colors.charcoal, margin: "0 0 4px" }}>
              Round 3 — Enter Results
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <p style={{ fontSize: "13px", color: colors.gray, margin: 0 }}>
                Lock deadline: Jul 4, 2026 at 2:00 PM
              </p>
              <button
                onClick={() => {}}
                style={{
                  padding: "2px 8px", borderRadius: "6px", border: `1px solid ${colors.grayLight}`,
                  background: colors.white, color: colors.gray, fontSize: "12px", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
            <p style={{ fontSize: "13px", color: colors.gray, margin: "4px 0 0" }}>
              {Object.keys(results).length} of {round3Athletes.length} results entered
            </p>
          </div>
          <span style={{
            padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
            backgroundColor: colors.amberMuted, color: colors.amber,
          }}>
            In Progress
          </span>
        </div>

        <div style={{
          backgroundColor: colors.grayLighter,
          borderRadius: "10px",
          overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "0.4fr 2fr 1.2fr 0.6fr",
            padding: "10px 20px",
            fontSize: "12px",
            fontWeight: 600,
            color: colors.gray,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            <span>Seed</span>
            <span>Athlete</span>
            <span>Result</span>
            <span></span>
          </div>

          {round3Athletes.map((a) => (
            <div key={a.name} style={{
              display: "grid",
              gridTemplateColumns: "0.4fr 2fr 1.2fr 0.6fr",
              padding: "12px 20px",
              fontSize: "14px",
              backgroundColor: results[a.name] ? (results[a.name] === "win" ? "#F0FAF3" : "#FEF8F8") : colors.white,
              borderTop: `1px solid ${colors.grayLight}`,
              alignItems: "center",
            }}>
              <span style={{ fontWeight: 700, color: colors.green }}>{a.seed}</span>
              <span style={{ fontWeight: 600, color: colors.charcoal }}>{a.name}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => markResult(a.name, "win")}
                  style={{
                    padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    border: results[a.name] === "win" ? "none" : `1.5px solid ${colors.grayLight}`,
                    backgroundColor: results[a.name] === "win" ? colors.green : colors.white,
                    color: results[a.name] === "win" ? colors.white : colors.charcoal,
                  }}
                >
                  Win
                </button>
                <button
                  onClick={() => markResult(a.name, "loss")}
                  style={{
                    padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    border: results[a.name] === "loss" ? "none" : `1.5px solid ${colors.grayLight}`,
                    backgroundColor: results[a.name] === "loss" ? colors.red : colors.white,
                    color: results[a.name] === "loss" ? colors.white : colors.charcoal,
                  }}
                >
                  Loss
                </button>
              </div>
              <span style={{ fontSize: "12px", color: results[a.name] ? colors.green : "transparent", fontWeight: 600, textAlign: "right" }}>
                {results[a.name] ? "Saved" : ""}
              </span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: "13px", color: colors.gray, margin: "16px 0 0", lineHeight: 1.5 }}>
          Results are saved and visible to players as you enter them. Finalize the round when all results are in to trigger eliminations and missed pick assignments.
        </p>
      </div>

      <button style={{
        width: "100%", padding: "14px", borderRadius: "10px", border: "none",
        background: Object.keys(results).length === round3Athletes.length ? colors.green : colors.grayLight,
        color: Object.keys(results).length === round3Athletes.length ? colors.white : colors.gray,
        fontSize: "15px", fontWeight: 600,
        cursor: Object.keys(results).length === round3Athletes.length ? "pointer" : "default",
      }}>
        Finalize Round 3 ({Object.keys(results).length}/{round3Athletes.length} results entered)
      </button>
    </div>
  );
}

export default function TournamentSetup() {
  const [view, setView] = useState("create");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav />
      {view === "create" && <CreateTournament onSwitch={setView} />}
      {view === "athletes" && <AddAthletes onSwitch={setView} />}
      {view === "manage" && <ManageTournament onSwitch={setView} />}
    </div>
  );
}
