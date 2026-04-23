import { useState } from "react";

const colors = {
  green: "#4A7C59",
  greenLight: "#5E9E6E",
  greenDark: "#3A6147",
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

function TennisBallIcon({ size = 24, color = colors.green }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M6 3.5 Q12 10, 6 20.5" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M18 3.5 Q12 10, 18 20.5" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill={colors.green} />
      <path d="M6 10.5 L9 13.5 L14.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Nav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 40px",
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.grayLight}`,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <LogoIcon size={36} />
        <span style={{
          fontSize: "22px",
          fontWeight: 700,
          color: colors.charcoal,
          letterSpacing: "-0.5px",
        }}>
          Goat Pool
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {["How It Works", "Pricing"].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab ? colors.greenMuted : "transparent",
              color: activeTab === tab ? colors.green : colors.gray,
              fontSize: "15px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}

        <div style={{ width: "1px", height: "24px", backgroundColor: colors.grayLight, margin: "0 8px" }} />

        <button style={{
          padding: "8px 16px",
          borderRadius: "8px",
          border: "none",
          background: "transparent",
          color: colors.charcoal,
          fontSize: "15px",
          fontWeight: 500,
          cursor: "pointer",
        }}>
          Log In
        </button>

        <button style={{
          padding: "10px 20px",
          borderRadius: "10px",
          border: "none",
          background: colors.green,
          color: colors.white,
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
        }}>
          Sign Up
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{
      padding: "80px 40px",
      textAlign: "center",
      backgroundColor: colors.cream,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", position: "relative" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "20px",
          backgroundColor: colors.greenMuted,
          color: colors.green,
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "24px",
        }}>
          <TennisBallIcon size={16} />
          Tennis Survivor Pools
        </div>

        <h1 style={{
          fontSize: "52px",
          fontWeight: 800,
          color: colors.charcoal,
          lineHeight: 1.1,
          letterSpacing: "-1.5px",
          margin: "0 0 20px",
        }}>
          Pick. Survive. <span style={{ color: colors.green }}>Win.</span>
        </h1>

        <div style={{
          fontSize: "18px",
          color: colors.gray,
          lineHeight: 1.7,
          margin: "0 0 12px",
          maxWidth: "520px",
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}>
          <p style={{ margin: 0 }}>Create a survivor pool for a pro tennis tournament.</p>
          <p style={{ margin: 0 }}>Friends compete to pick athletes to win each round.</p>
          <p style={{ margin: 0 }}>Stay alive when they win.</p>
          <p style={{ margin: 0 }}>Last one standing is the GOAT.</p>
        </div>

        <p style={{
          fontSize: "15px",
          color: colors.green,
          fontWeight: 600,
          margin: "0 0 36px",
        }}>
          Totally free to run a pool, earn a little $ for doing it!
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button style={{
            padding: "14px 28px",
            borderRadius: "12px",
            border: "none",
            background: colors.green,
            color: colors.white,
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(74, 124, 89, 0.3)",
          }}>
            Start a Pool
          </button>

          <button style={{
            padding: "14px 28px",
            borderRadius: "12px",
            border: `1.5px solid ${colors.grayLight}`,
            background: colors.white,
            color: colors.charcoal,
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}>
            Join a Pool
          </button>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Create a pool",
      desc: "Pick a tournament, set the entry fee (what you charge each player, not a bet!), configure a few simple pool rules. It takes 30 seconds.",
    },
    {
      num: "02",
      title: "Invite your friends",
      desc: "Email invites with a link to join. Players sign up, pay an entry fee (which you set, and earn a cut of).",
    },
    {
      num: "03",
      title: "Compete",
      desc: "Players pick one athlete to win each round. You can only use each athlete once — choose wisely.",
    },
    {
      num: "04",
      title: "Last one standing wins",
      desc: "If your athlete loses, the pick is gone. Run out of picks and you're eliminated. Survive to win.",
    },
  ];

  return (
    <section style={{
      padding: "80px 40px",
      backgroundColor: colors.white,
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontSize: "36px",
          fontWeight: 700,
          color: colors.charcoal,
          textAlign: "center",
          letterSpacing: "-0.8px",
          margin: "0 0 12px",
        }}>
          How it works
        </h2>
        <p style={{
          fontSize: "17px",
          color: colors.gray,
          textAlign: "center",
          margin: "0 0 48px",
        }}>
          Simple to set up, fun to play.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}>
          {steps.map((step) => (
            <div key={step.num} style={{
              padding: "28px",
              borderRadius: "16px",
              backgroundColor: colors.cream,
              border: `1px solid ${colors.grayLight}`,
              transition: "all 0.2s",
            }}>
              <span style={{
                fontSize: "13px",
                fontWeight: 700,
                color: colors.green,
                letterSpacing: "1px",
              }}>
                STEP {step.num}
              </span>
              <h3 style={{
                fontSize: "20px",
                fontWeight: 700,
                color: colors.charcoal,
                margin: "8px 0",
                letterSpacing: "-0.3px",
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: "15px",
                color: colors.gray,
                lineHeight: 1.6,
                margin: 0,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section style={{
      padding: "80px 40px",
      backgroundColor: colors.cream,
    }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{
          fontSize: "36px",
          fontWeight: 700,
          color: colors.charcoal,
          letterSpacing: "-0.8px",
          margin: "0 0 12px",
        }}>
          Simple pricing
        </h2>
        <p style={{
          fontSize: "17px",
          color: colors.gray,
          margin: "0 0 40px",
        }}>
          Free to create a pool. Players pay to play.
        </p>

        <div style={{
          backgroundColor: colors.white,
          borderRadius: "20px",
          padding: "36px",
          border: `1px solid ${colors.grayLight}`,
          textAlign: "left",
        }}>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: "4px",
            marginBottom: "6px",
          }}>
            <span style={{
              fontSize: "42px",
              fontWeight: 800,
              color: colors.charcoal,
              letterSpacing: "-1px",
            }}>
              $0
            </span>
            <span style={{
              fontSize: "16px",
              color: colors.gray,
              fontWeight: 500,
            }}>
              to start a pool
            </span>
          </div>

          <p style={{
            fontSize: "15px",
            color: colors.gray,
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}>
            Commissioners set the entry fee per player, typically a few bucks. The platform takes a cut and the rest goes to you.
          </p>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}>
            {[
              "Free to create and configure pools",
              "Set your own player entry fee",
              "Invite unlimited players",
              "Automatic payouts at pool conclusion",
              "In-app or external payment options",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckIcon />
                <span style={{ fontSize: "15px", color: colors.charcoal, fontWeight: 500 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          <button style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: colors.green,
            color: colors.white,
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            marginTop: "28px",
            transition: "all 0.2s",
          }}>
            Start Your Pool
          </button>
        </div>
      </div>
    </section>
  );
}

function ExamplePool() {
  const rounds = [
    { name: "Round 1", status: "completed" },
    { name: "Round 2", status: "completed" },
    { name: "Round 3", status: "active" },
    { name: "Round 4", status: "upcoming" },
    { name: "QF", status: "upcoming" },
    { name: "SF", status: "upcoming" },
    { name: "Final", status: "upcoming" },
  ];

  const players = [
    { name: "Sarah M.", status: "alive", picks: 2, currentPick: "Sinner" },
    { name: "Jake T.", status: "alive", picks: 2, currentPick: "Alcaraz" },
    { name: "You", status: "alive", picks: 1, currentPick: "Djokovic" },
    { name: "Mike R.", status: "eliminated", picks: 0, currentPick: "Rublev" },
  ];

  return (
    <section style={{
      padding: "80px 40px",
      backgroundColor: colors.white,
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontSize: "36px",
          fontWeight: 700,
          color: colors.charcoal,
          textAlign: "center",
          letterSpacing: "-0.8px",
          margin: "0 0 12px",
        }}>
          See it in action
        </h2>
        <p style={{
          fontSize: "17px",
          color: colors.gray,
          textAlign: "center",
          margin: "0 0 40px",
        }}>
          Here's what a live pool looks like.
        </p>

        <div style={{
          backgroundColor: colors.cream,
          borderRadius: "20px",
          padding: "32px",
          border: `1px solid ${colors.grayLight}`,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}>
            <div>
              <h3 style={{
                fontSize: "20px",
                fontWeight: 700,
                color: colors.charcoal,
                margin: "0 0 4px",
              }}>
                Roger's Wimbledon Pool
              </h3>
              <span style={{ fontSize: "14px", color: colors.gray }}>Wimbledon 2026 — 8 players</span>
            </div>
            <span style={{
              padding: "6px 12px",
              borderRadius: "8px",
              backgroundColor: colors.greenMuted,
              color: colors.green,
              fontSize: "13px",
              fontWeight: 600,
            }}>
              Live — Round 3
            </span>
          </div>

          <div style={{
            display: "flex",
            gap: "6px",
            marginBottom: "24px",
          }}>
            {rounds.map((r) => (
              <div key={r.name} style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: "8px",
                textAlign: "center",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: r.status === "active" ? colors.green : r.status === "completed" ? colors.greenMuted : colors.grayLighter,
                color: r.status === "active" ? colors.white : r.status === "completed" ? colors.green : colors.gray,
              }}>
                {r.name}
              </div>
            ))}
          </div>

          <div style={{
            backgroundColor: colors.white,
            borderRadius: "12px",
            overflow: "hidden",
            border: `1px solid ${colors.grayLight}`,
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
              padding: "12px 16px",
              backgroundColor: colors.grayLighter,
              fontSize: "12px",
              fontWeight: 600,
              color: colors.gray,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              <span>Player</span>
              <span>Status</span>
              <span>Lives</span>
              <span>Current Round Pick</span>
            </div>

            {players.map((p) => (
              <div key={p.name} style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
                padding: "14px 16px",
                fontSize: "14px",
                color: colors.charcoal,
                borderTop: `1px solid ${colors.grayLight}`,
                backgroundColor: p.name === "You" ? colors.greenMuted : "transparent",
              }}>
                <span style={{ fontWeight: p.name === "You" ? 700 : 500 }}>
                  {p.name}
                </span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: p.status === "alive" ? colors.green : "#EF4444",
                    display: "inline-block",
                  }} />
                  <span style={{
                    color: p.status === "alive" ? colors.green : "#EF4444",
                    fontWeight: 500,
                    fontSize: "13px",
                  }}>
                    {p.status === "alive" ? "Alive" : "Out"}
                  </span>
                </span>
                <span style={{ fontWeight: 500 }}>
                  {p.status === "alive" ? `${p.picks} left` : "\u2014"}
                </span>
                <span style={{ color: colors.gray }}>{p.currentPick}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: "40px",
      backgroundColor: colors.charcoal,
      textAlign: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
        <LogoIcon size={28} />
        <span style={{ fontSize: "18px", fontWeight: 700, color: colors.white }}>Goat Pool</span>
      </div>
      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
        Tennis survivor pools with friends.
      </p>
    </footer>
  );
}

export default function Homepage() {
  const [activeTab, setActiveTab] = useState(null);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh" }}>
      <Nav activeTab={activeTab} onTabChange={setActiveTab} />
      <Hero />
      <HowItWorks />
      <ExamplePool />
      <Pricing />
      <Footer />
    </div>
  );
}
