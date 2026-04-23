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
            background: i === 2 ? colors.greenMuted : "transparent",
            color: i === 2 ? colors.green : colors.gray,
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

export default function Profile() {
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [username, setUsername] = useState("BillM");
  const [email, setEmail] = useState("bill.j.michels@gmail.com");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.charcoal, minHeight: "100vh", backgroundColor: colors.cream }}>
      <Nav />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: colors.charcoal, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          Profile
        </h1>
        <p style={{ fontSize: "15px", color: colors.gray, margin: "0 0 32px" }}>
          Manage your account details.
        </p>

        {/* Avatar + Name */}
        <div style={{
          display: "flex", alignItems: "center", gap: "20px",
          marginBottom: "32px",
        }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%", backgroundColor: colors.greenMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: 700, color: colors.green,
          }}>
            BM
          </div>
          <div>
            <p style={{ fontSize: "20px", fontWeight: 700, color: colors.charcoal, margin: "0 0 2px" }}>{username}</p>
            <p style={{ fontSize: "14px", color: colors.gray, margin: 0 }}>Member since April 2026</p>
          </div>
        </div>

        {/* Account Details */}
        <div style={{
          backgroundColor: colors.white, borderRadius: "14px",
          border: `1px solid ${colors.grayLight}`, overflow: "hidden",
          marginBottom: "24px",
        }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.grayLight}` }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: colors.charcoal, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "12px" }}>
              Account Details
            </p>
          </div>

          {/* Username row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "18px 24px", borderBottom: `1px solid ${colors.grayLight}`,
          }}>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Username</p>
              {editingUsername ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    fontSize: "15px", color: colors.charcoal, fontWeight: 500,
                    border: `1.5px solid ${colors.green}`, borderRadius: "8px",
                    padding: "6px 10px", outline: "none",
                  }}
                  autoFocus
                />
              ) : (
                <p style={{ fontSize: "15px", color: colors.charcoal, fontWeight: 500, margin: 0 }}>{username}</p>
              )}
            </div>
            <button
              onClick={() => setEditingUsername(!editingUsername)}
              style={{
                padding: "8px 16px", borderRadius: "8px",
                border: `1.5px solid ${editingUsername ? colors.green : colors.grayLight}`,
                background: editingUsername ? colors.greenMuted : colors.white,
                color: editingUsername ? colors.green : colors.gray,
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              {editingUsername ? "Save" : "Edit"}
            </button>
          </div>

          {/* Email row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "18px 24px", borderBottom: `1px solid ${colors.grayLight}`,
          }}>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</p>
              {editingEmail ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    fontSize: "15px", color: colors.charcoal, fontWeight: 500,
                    border: `1.5px solid ${colors.green}`, borderRadius: "8px",
                    padding: "6px 10px", outline: "none", width: "280px",
                  }}
                  autoFocus
                />
              ) : (
                <p style={{ fontSize: "15px", color: colors.charcoal, fontWeight: 500, margin: 0 }}>{email}</p>
              )}
            </div>
            <button
              onClick={() => setEditingEmail(!editingEmail)}
              style={{
                padding: "8px 16px", borderRadius: "8px",
                border: `1.5px solid ${editingEmail ? colors.green : colors.grayLight}`,
                background: editingEmail ? colors.greenMuted : colors.white,
                color: editingEmail ? colors.green : colors.gray,
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              {editingEmail ? "Save" : "Edit"}
            </button>
          </div>

          {/* Password row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "18px 24px",
          }}>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</p>
              <p style={{ fontSize: "15px", color: colors.charcoal, fontWeight: 500, margin: 0 }}>••••••••</p>
            </div>
            <button style={{
              padding: "8px 16px", borderRadius: "8px",
              border: `1.5px solid ${colors.grayLight}`, background: colors.white,
              color: colors.gray, fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>
              Change
            </button>
          </div>
        </div>

        {/* Stripe Connect */}
        <div style={{
          backgroundColor: colors.white, borderRadius: "14px",
          border: `1px solid ${colors.grayLight}`, overflow: "hidden",
          marginBottom: "24px",
        }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.grayLight}` }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.charcoal, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Payment
            </p>
          </div>

          <div style={{ padding: "18px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: colors.charcoal, margin: "0 0 4px" }}>Stripe Connect</p>
                <p style={{ fontSize: "13px", color: colors.gray, margin: 0 }}>
                  Required to receive Commissioner payouts.
                </p>
              </div>
              <span style={{
                padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                backgroundColor: colors.greenMuted, color: colors.green,
              }}>
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Pool Stats Summary */}
        <div style={{
          backgroundColor: colors.white, borderRadius: "14px",
          border: `1px solid ${colors.grayLight}`, overflow: "hidden",
          marginBottom: "24px",
        }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.grayLight}` }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.charcoal, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pool Activity
            </p>
          </div>

          <div style={{ display: "flex", padding: "20px 24px", gap: "40px" }}>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pools Played</p>
              <p style={{ fontSize: "24px", fontWeight: 800, color: colors.charcoal, margin: 0 }}>4</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pools Won</p>
              <p style={{ fontSize: "24px", fontWeight: 800, color: colors.green, margin: 0 }}>1</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: colors.gray, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pools Commissioned</p>
              <p style={{ fontSize: "24px", fontWeight: 800, color: colors.charcoal, margin: 0 }}>2</p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button style={{
          width: "100%", padding: "14px", borderRadius: "10px",
          border: `1.5px solid ${colors.grayLight}`, background: colors.white,
          color: colors.gray, fontSize: "15px", fontWeight: 600, cursor: "pointer",
        }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
