"use client";

import { useState } from "react";
import Link from "next/link";

const c = {
  green: "#4A7C59",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
  grayLighter: "#F3F4F6",
};

type OpenPool = {
  id: string;
  name: string;
  slug: string;
  feePerLife: number;
  tournamentName: string;
  playerCount: number;
};

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

function TennisBallIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={c.green} strokeWidth="1.5" fill="none" />
      <path d="M6 3.5 Q12 10, 6 20.5" stroke={c.green} strokeWidth="1.5" fill="none" />
      <path d="M18 3.5 Q12 10, 18 20.5" stroke={c.green} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill={c.green} />
      <path d="M6 10.5 L9 13.5 L14.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Nav() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const scrollTo = (id: string, tab: string) => {
    setActiveTab(tab);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 40px",
      backgroundColor: c.white,
      borderBottom: `1px solid ${c.grayLight}`,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <LogoIcon size={36} />
        <span style={{ fontSize: "22px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.5px" }}>
          Goat Pool
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {[
          { label: "How It Works", id: "how-it-works" },
          { label: "Pricing", id: "pricing" },
        ].map(({ label, id }) => (
          <button
            key={label}
            onClick={() => scrollTo(id, label)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === label ? c.greenMuted : "transparent",
              color: activeTab === label ? c.green : c.gray,
              fontSize: "15px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}

        <Link href="/pools" style={{
          padding: "8px 16px",
          borderRadius: "8px",
          background: "transparent",
          color: c.gray,
          fontSize: "15px",
          fontWeight: 500,
          textDecoration: "none",
        }}>
          Find a Pool
        </Link>

        <div style={{ width: "1px", height: "24px", backgroundColor: c.grayLight, margin: "0 8px" }} />

        <Link href="/login" style={{
          padding: "8px 16px",
          borderRadius: "8px",
          background: "transparent",
          color: c.charcoal,
          fontSize: "15px",
          fontWeight: 500,
          textDecoration: "none",
        }}>
          Log In
        </Link>

        <Link href="/login?mode=signup" style={{
          padding: "10px 20px",
          borderRadius: "10px",
          background: c.green,
          color: c.white,
          fontSize: "15px",
          fontWeight: 600,
          textDecoration: "none",
        }}>
          Sign Up
        </Link>
      </div>
    </nav>
  );
}

function Hero({ hasOpenPools }: { hasOpenPools: boolean }) {
  return (
    <section style={{ padding: "80px 40px", textAlign: "center", backgroundColor: c.cream }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "20px",
          backgroundColor: c.greenMuted,
          color: c.green,
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
          color: c.charcoal,
          lineHeight: 1.1,
          letterSpacing: "-1.5px",
          margin: "0 0 20px",
        }}>
          Pick. Survive. <span style={{ color: c.green }}>Win.</span>
        </h1>

        <div style={{
          fontSize: "18px",
          color: c.gray,
          lineHeight: 1.7,
          margin: "0 0 12px",
          maxWidth: "520px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          <p style={{ margin: 0 }}>Create a survivor pool for a pro tennis tournament.</p>
          <p style={{ margin: 0 }}>Friends compete to pick athletes to win each round.</p>
          <p style={{ margin: 0 }}>Stay alive when they win.</p>
          <p style={{ margin: 0 }}>Last one standing is the GOAT.</p>
        </div>

        <p style={{ fontSize: "15px", color: c.green, fontWeight: 600, margin: "0 0 36px" }}>
          Totally free to run a pool — earn a little $ for doing it!
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href="/commissioner/startpool" style={{
            padding: "14px 28px",
            borderRadius: "12px",
            background: c.green,
            color: c.white,
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(74,124,89,0.3)",
          }}>
            Start a Pool
          </Link>
          <Link href="/pools" style={{
            padding: "14px 28px",
            borderRadius: "12px",
            border: `1.5px solid ${c.grayLight}`,
            background: c.white,
            color: c.charcoal,
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
          }}>
            {hasOpenPools ? "Find an Open Pool" : "Find a Pool"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function OpenPoolsSection({ pools }: { pools: OpenPool[] }) {
  if (pools.length === 0) return null;

  return (
    <section style={{ padding: "56px 40px", backgroundColor: c.green }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>
              Pools Open Now
            </p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: c.white, margin: 0, letterSpacing: "-0.5px" }}>
              {pools.length === 1
                ? "1 pool is accepting players"
                : `${pools.length} pools are accepting players`}
            </h2>
          </div>
          <Link href="/pools" style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: c.white,
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}>
            See all pools →
          </Link>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(pools.length, 3)}, 1fr)`,
          gap: "12px",
        }}>
          {pools.slice(0, 3).map((pool) => (
            <div key={pool.id} style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "14px",
              padding: "20px 24px",
            }}>
              <p style={{ fontSize: "16px", fontWeight: 700, color: c.white, margin: "0 0 4px" }}>{pool.name}</p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0 0 16px" }}>{pool.tournamentName}</p>
              <div style={{ display: "flex", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 2px" }}>Players</p>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: c.white, margin: 0 }}>{pool.playerCount}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 2px" }}>Entry</p>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: c.white, margin: 0 }}>
                    {pool.feePerLife > 0 ? `$${(pool.feePerLife / 100).toFixed(2)}/life` : "Free"}
                  </p>
                </div>
              </div>
              <Link href="/pools" style={{
                display: "block",
                padding: "9px 16px",
                borderRadius: "8px",
                background: c.white,
                color: c.green,
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                textAlign: "center",
              }}>
                Request to Join
              </Link>
            </div>
          ))}
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
      desc: "Pick a tournament, set the entry fee, configure a few simple pool rules. It takes 30 seconds.",
    },
    {
      num: "02",
      title: "Invite your friends",
      desc: "Email invites with a link to join. Players sign up, pay an entry fee which you set and earn a cut of.",
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
    <section id="how-it-works" style={{ padding: "80px 40px", backgroundColor: c.white }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, color: c.charcoal, textAlign: "center", letterSpacing: "-0.8px", margin: "0 0 12px" }}>
          How it works
        </h2>
        <p style={{ fontSize: "17px", color: c.gray, textAlign: "center", margin: "0 0 48px" }}>
          Simple to set up, fun to play.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {steps.map((step) => (
            <div key={step.num} style={{
              padding: "28px",
              borderRadius: "16px",
              backgroundColor: c.cream,
              border: `1px solid ${c.grayLight}`,
            }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: c.green, letterSpacing: "1px" }}>
                STEP {step.num}
              </span>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: c.charcoal, margin: "8px 0", letterSpacing: "-0.3px" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: "15px", color: c.gray, lineHeight: 1.6, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
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
    { name: "Sarah M.", alive: true, lives: 2, pick: "Sinner" },
    { name: "Jake T.", alive: true, lives: 2, pick: "Alcaraz" },
    { name: "You", alive: true, lives: 1, pick: "Djokovic" },
    { name: "Mike R.", alive: false, lives: 0, pick: "Rublev" },
  ];

  return (
    <section style={{ padding: "80px 40px", backgroundColor: c.white }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, color: c.charcoal, textAlign: "center", letterSpacing: "-0.8px", margin: "0 0 12px" }}>
          See it in action
        </h2>
        <p style={{ fontSize: "17px", color: c.gray, textAlign: "center", margin: "0 0 40px" }}>
          Here&apos;s what a live pool looks like.
        </p>

        <div style={{ backgroundColor: c.cream, borderRadius: "20px", padding: "32px", border: `1px solid ${c.grayLight}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: c.charcoal, margin: "0 0 4px" }}>
                Roger&apos;s Wimbledon Pool
              </h3>
              <span style={{ fontSize: "14px", color: c.gray }}>Wimbledon 2026 — 8 players</span>
            </div>
            <span style={{ padding: "6px 12px", borderRadius: "8px", backgroundColor: c.greenMuted, color: c.green, fontSize: "13px", fontWeight: 600 }}>
              Live — Round 3
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
            {rounds.map((r) => (
              <div key={r.name} style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: "8px",
                textAlign: "center",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: r.status === "active" ? c.green : r.status === "completed" ? c.greenMuted : c.grayLighter,
                color: r.status === "active" ? c.white : r.status === "completed" ? c.green : c.gray,
              }}>
                {r.name}
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: c.white, borderRadius: "12px", overflow: "hidden", border: `1px solid ${c.grayLight}` }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
              padding: "12px 16px",
              backgroundColor: c.grayLighter,
              fontSize: "12px",
              fontWeight: 600,
              color: c.gray,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              <span>Player</span>
              <span>Status</span>
              <span>Lives</span>
              <span>Current Pick</span>
            </div>

            {players.map((p) => (
              <div key={p.name} style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
                padding: "14px 16px",
                fontSize: "14px",
                color: c.charcoal,
                borderTop: `1px solid ${c.grayLight}`,
                backgroundColor: p.name === "You" ? c.greenMuted : "transparent",
              }}>
                <span style={{ fontWeight: p.name === "You" ? 700 : 500 }}>{p.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.alive ? c.green : "#EF4444", display: "inline-block" }} />
                  <span style={{ color: p.alive ? c.green : "#EF4444", fontWeight: 500, fontSize: "13px" }}>
                    {p.alive ? "Alive" : "Out"}
                  </span>
                </span>
                <span style={{ fontWeight: 500 }}>{p.alive ? `${p.lives} left` : "—"}</span>
                <span style={{ color: c.gray }}>{p.pick}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const features = [
    "Free to create and configure pools",
    "Set your own player entry fee",
    "Invite unlimited players",
    "Automatic payouts at pool conclusion",
    "In-app or external payment options",
  ];

  return (
    <section id="pricing" style={{ padding: "80px 40px", backgroundColor: c.cream }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.8px", margin: "0 0 12px" }}>
          Simple pricing
        </h2>
        <p style={{ fontSize: "17px", color: c.gray, margin: "0 0 40px" }}>
          Free to create a pool. Players pay to play.
        </p>

        <div style={{ backgroundColor: c.white, borderRadius: "20px", padding: "36px", border: `1px solid ${c.grayLight}`, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
            <span style={{ fontSize: "42px", fontWeight: 800, color: c.charcoal, letterSpacing: "-1px" }}>$0</span>
            <span style={{ fontSize: "16px", color: c.gray, fontWeight: 500 }}>to start a pool</span>
          </div>

          <p style={{ fontSize: "15px", color: c.gray, lineHeight: 1.6, margin: "0 0 28px" }}>
            Commissioners set the entry fee per player, typically a few bucks. The platform takes a cut and the rest goes to you.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {features.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckIcon />
                <span style={{ fontSize: "15px", color: c.charcoal, fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>

          <Link href="/commissioner/startpool" style={{
            display: "block",
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            background: c.green,
            color: c.white,
            fontSize: "16px",
            fontWeight: 600,
            textAlign: "center",
            textDecoration: "none",
            marginTop: "28px",
          }}>
            Start Your Pool
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const muted = "rgba(255,255,255,0.5)";
  const linkStyle = {
    color: muted,
    textDecoration: "none" as const,
    fontSize: "14px",
    lineHeight: "1.8",
    display: "block" as const,
  };
  return (
    <footer style={{ backgroundColor: c.charcoal, padding: "60px 40px 32px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px", marginBottom: "48px" }}>
          <div style={{ maxWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <LogoIcon size={28} />
              <span style={{ fontSize: "18px", fontWeight: 700, color: c.white }}>Goat Pool</span>
            </div>
            <p style={{ fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 12px" }}>
              Tennis survivor pools with your friends. Pick athletes, survive each round, win the pot.
            </p>
            <a href="mailto:support@goat-pool.com" style={{ ...linkStyle, color: "rgba(255,255,255,0.7)" }}>
              support@goat-pool.com
            </a>
          </div>

          <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: c.white, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 14px" }}>
                Product
              </p>
              <Link href="/#how-it-works" style={linkStyle}>How It Works</Link>
              <Link href="/#pricing" style={linkStyle}>Pricing</Link>
              <Link href="/pools" style={linkStyle}>Find a Pool</Link>
              <Link href="/commissioner/startpool" style={linkStyle}>Start a Pool</Link>
              <Link href="/login" style={linkStyle}>Sign In</Link>
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: c.white, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 14px" }}>
                Legal
              </p>
              <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
              <Link href="/terms" style={linkStyle}>Terms of Service</Link>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: muted, margin: 0 }}>
            © {new Date().getFullYear()} Goat Pool. All rights reserved.
          </p>
          <p style={{ fontSize: "13px", color: muted, margin: 0 }}>
            Built for tennis fans, by tennis fans.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function HomeClient({ openPools }: { openPools: OpenPool[] }) {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#2D2D2D", minHeight: "100vh" }}>
      <Nav />
      <Hero hasOpenPools={openPools.length > 0} />
      <OpenPoolsSection pools={openPools} />
      <HowItWorks />
      <ExamplePool />
      <Pricing />
      <Footer />
    </div>
  );
}
