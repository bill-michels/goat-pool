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

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: colors.charcoal,
      minHeight: "100vh",
      backgroundColor: colors.cream,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        marginBottom: "40px", cursor: "pointer",
      }}>
        <LogoIcon size={44} />
        <span style={{ fontSize: "28px", fontWeight: 700, color: colors.charcoal, letterSpacing: "-0.5px" }}>
          Goat Pool
        </span>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "420px",
        backgroundColor: colors.white, borderRadius: "16px",
        padding: "36px", border: `1px solid ${colors.grayLight}`,
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: colors.charcoal, margin: "0 0 6px", letterSpacing: "-0.5px", textAlign: "center" }}>
          {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
        </h1>
        <p style={{ fontSize: "14px", color: colors.gray, margin: "0 0 28px", textAlign: "center" }}>
          {mode === "login"
            ? "Sign in to your Goat Pool account."
            : mode === "signup"
            ? "Join the pool. Pick athletes. Survive."
            : "We'll send you a link to reset your password."}
        </p>

        {/* Google Sign In */}
        {mode !== "forgot" && (
          <>
            <button style={{
              width: "100%", padding: "12px", borderRadius: "10px",
              border: `1.5px solid ${colors.grayLight}`, background: colors.white,
              fontSize: "15px", fontWeight: 600, color: colors.charcoal,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "10px",
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{
              display: "flex", alignItems: "center", gap: "16px",
              margin: "24px 0",
            }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: colors.grayLight }} />
              <span style={{ fontSize: "13px", color: colors.gray, fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: colors.grayLight }} />
            </div>
          </>
        )}

        {/* Username field (sign up only) */}
        {mode === "signup" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: colors.charcoal, marginBottom: "6px" }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px",
                border: `1.5px solid ${colors.grayLight}`, borderRadius: "10px",
                fontSize: "15px", color: colors.charcoal, boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Email field */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: colors.charcoal, marginBottom: "6px" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px",
              border: `1.5px solid ${colors.grayLight}`, borderRadius: "10px",
              fontSize: "15px", color: colors.charcoal, boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password field (not on forgot) */}
        {mode !== "forgot" && (
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: colors.charcoal, marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px",
                border: `1.5px solid ${colors.grayLight}`, borderRadius: "10px",
                fontSize: "15px", color: colors.charcoal, boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Forgot password link (login only) */}
        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: "24px" }}>
            <button
              onClick={() => setMode("forgot")}
              style={{
                background: "none", border: "none", padding: 0,
                fontSize: "13px", color: colors.green, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {mode !== "login" && <div style={{ height: "24px" }} />}

        {/* Submit button */}
        <button style={{
          width: "100%", padding: "14px", borderRadius: "10px",
          border: "none", background: colors.green, color: colors.white,
          fontSize: "15px", fontWeight: 600, cursor: "pointer",
        }}>
          {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
        </button>

        {/* Toggle between login/signup */}
        <p style={{ fontSize: "14px", color: colors.gray, textAlign: "center", margin: "20px 0 0" }}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setMode("signup")} style={{
                background: "none", border: "none", padding: 0,
                color: colors.green, fontWeight: 600, fontSize: "14px", cursor: "pointer",
              }}>
                Sign up
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")} style={{
                background: "none", border: "none", padding: 0,
                color: colors.green, fontWeight: 600, fontSize: "14px", cursor: "pointer",
              }}>
                Sign in
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setMode("login")} style={{
                background: "none", border: "none", padding: 0,
                color: colors.green, fontWeight: 600, fontSize: "14px", cursor: "pointer",
              }}>
                Back to sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
