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
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {["My Pools", "Manage Pools", "Profile"].map((tab, i) => (
          <button key={tab} style={{
            padding: "8px 16px", borderRadius: "8px", border: "none",
            background: i === 0 ? colors.greenMuted : "transparent",
            color: i === 0 ? colors.green : colors.gray,
            fontSize: "15px", fontWeight: 500, cursor: "pointer",
          }}>{tab}</button>
        ))}
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

export default function PlacePick() {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [hoveredAthlete, setHoveredAthlete] = useState(null);

  const lives = 2;
  const livesRemaining = 1;
  const currentLife = lives - livesRemaining + 1;

  const previousPicks = ["Djokovic", "Rune"];

  const availableAthletes = [
    { name: "Jannik Sinner", seed: 1 },
    { name: "Carlos Alcaraz", seed: 2 },
    { name: "Alexander Zverev", seed: 4 },
    { name: "Daniil Medvedev", seed: 5 },
    { name: "Taylor Fritz", seed: 7 },
    { name: "Casper Ruud", seed: 8 },
    { name: "Ben Shelton", seed: 12 },
    { name: "Tommy Paul", seed: 14 },
    { name: "Felix Auger-Aliassime", seed: 16 },
    { name: "Lorenzo Musetti", seed: 18 },
    { name: "Ugo Humbert", seed: 20 },
    { name: "Sebastian Korda", seed: 22 },
  ];

  const filtered = availableAthletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (confirmed) {
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
        <Nav />
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "80px 40px", textAlign: "center" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%", backgroundColor: colors.greenMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke={colors.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            Pick Locked In
          </h1>
          <p style={{ fontSize: "17px", color: colors.gray, margin: "0 0 8px" }}>
            You picked <strong style={{ color: colors.charcoal }}>{selectedAthlete}</strong> for Round 3.
          </p>
          <p style={{ fontSize: "15px", color: colors.gray, margin: "0 0 8px" }}>
            Life {currentLife} of {lives}
          </p>
          <p style={{ fontSize: "14px", color: colors.gray, margin: "0 0 32px" }}>
            Your pick is hidden from other players until the round locks.
          </p>
          <button
            onClick={() => setConfirmed(false)}
            style={{
              padding: "12px 24px", borderRadius: "10px", border: `1.5px solid ${colors.grayLight}`,
              background: colors.white, color: colors.charcoal, fontSize: "15px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Back to Pool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }}>My Pools</span>
          <span style={{ fontSize: "14px", color: colors.grayLight }}>/</span>
          <span style={{ fontSize: "14px", color: colors.gray, cursor: "pointer" }}>Roger's Wimbledon Pool</span>
          <span style={{ fontSize: "14px", color: colors.grayLight }}>/</span>
          <span style={{ fontSize: "14px", color: colors.charcoal, fontWeight: 600 }}>Place Pick</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          Round 3 — Place Your Pick
        </h1>
        <p style={{ fontSize: "15px", color: colors.gray, margin: "0 0 24px" }}>
          Choose one athlete to win this round.
        </p>

        {/* Life + Deadline Bar */}
        <div style={{
          display: "flex", gap: "12px", marginBottom: "24px",
        }}>
          <div style={{
            flex: 1, padding: "14px 16px", borderRadius: "10px",
            backgroundColor: colors.white, border: `1px solid ${colors.grayLight}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: colors.charcoal }}>
              Life {currentLife} of {lives}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              {Array.from({ length: lives }, (_, i) => (
                <span key={i} style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  backgroundColor: i < livesRemaining ? colors.green : colors.red,
                }} />
              ))}
            </div>
          </div>
          <div style={{
            flex: 1, padding: "14px 16px", borderRadius: "10px",
            backgroundColor: colors.amberMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: colors.amber }}>
              Due: Jul 4 at 2:00 PM
            </span>
          </div>
        </div>

        {/* Previous Picks */}
        <div style={{
          backgroundColor: colors.white, borderRadius: "12px", padding: "14px 20px",
          border: `1px solid ${colors.grayLight}`, marginBottom: "24px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: colors.gray, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
            Previous Picks:
          </span>
          <span style={{ fontSize: "14px", color: colors.charcoal, fontWeight: 500 }}>
            {previousPicks.join(", ")}
          </span>
          <span style={{ fontSize: "12px", color: colors.gray, whiteSpace: "nowrap" }}>
            (unavailable)
          </span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "8px" }}>
          <input
            type="text"
            placeholder="Search athletes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px",
              border: `1.5px solid ${colors.grayLight}`, borderRadius: "10px",
              fontSize: "15px", color: colors.charcoal, boxSizing: "border-box",
            }}
          />
        </div>

        <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 12px" }}>
          Click an athlete to select your pick.
        </p>

        {/* Athlete List */}
        <div style={{
          backgroundColor: colors.white, borderRadius: "14px",
          overflow: "hidden", border: `1px solid ${colors.grayLight}`,
          marginBottom: "24px",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "0.5fr 2fr 0.5fr",
            padding: "10px 20px", backgroundColor: colors.grayLighter,
            fontSize: "12px", fontWeight: 600, color: colors.gray,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            <span>Seed</span>
            <span>Athlete</span>
            <span></span>
          </div>

          {filtered.map((a) => {
            const isSelected = selectedAthlete === a.name;
            const isHovered = hoveredAthlete === a.name;
            return (
              <div
                key={a.name}
                onClick={() => setSelectedAthlete(a.name)}
                onMouseEnter={() => setHoveredAthlete(a.name)}
                onMouseLeave={() => setHoveredAthlete(null)}
                style={{
                  display: "grid", gridTemplateColumns: "0.5fr 2fr 0.5fr",
                  padding: "14px 20px", fontSize: "14px",
                  borderTop: `1px solid ${colors.grayLight}`,
                  alignItems: "center", cursor: "pointer",
                  backgroundColor: isSelected ? colors.greenMuted : isHovered ? colors.grayLighter : "transparent",
                  transition: "all 0.1s",
                }}
              >
                <span style={{ fontWeight: 700, color: colors.green }}>{a.seed}</span>
                <span style={{ fontWeight: 600, color: colors.charcoal }}>{a.name}</span>
                <span style={{ textAlign: "right" }}>
                  {isSelected ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill={colors.green} />
                      <path d="M6 10.5 L9 13.5 L14.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isHovered ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="9" stroke={colors.grayLight} strokeWidth="2" fill="none" />
                    </svg>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => selectedAthlete && setConfirmed(true)}
          style={{
            width: "100%", padding: "14px", borderRadius: "10px", border: "none",
            background: selectedAthlete ? colors.green : colors.grayLight,
            color: selectedAthlete ? colors.white : colors.gray,
            fontSize: "16px", fontWeight: 600,
            cursor: selectedAthlete ? "pointer" : "default",
          }}
        >
          {selectedAthlete ? `Confirm Pick: ${selectedAthlete}` : "Select an athlete above"}
        </button>

        <p style={{ fontSize: "13px", color: colors.gray, textAlign: "center", margin: "12px 0 0" }}>
          You can change your pick until the round locks.
        </p>
      </div>
    </div>
  );
}
