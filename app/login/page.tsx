"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const c = {
  green: "#4A7C59",
  greenMuted: "#E8F0EA",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
};

type Mode = "login" | "signup" | "forgot";

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

function inputStyle(focused: boolean) {
  return {
    width: "100%",
    padding: "12px 14px",
    border: `1.5px solid ${focused ? c.green : c.grayLight}`,
    borderRadius: "10px",
    fontSize: "15px",
    color: c.charcoal,
    boxSizing: "border-box" as const,
    outline: "none",
    backgroundColor: c.white,
  };
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/auth/redirect");
        router.refresh();
      }
    } else if (mode === "signup") {
      if (!username.trim()) {
        setError("Username is required.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Password reset link sent — check your email.");
      }
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: c.charcoal,
      minHeight: "100vh",
      backgroundColor: c.cream,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px", textDecoration: "none" }}>
        <LogoIcon size={44} />
        <span style={{ fontSize: "28px", fontWeight: 700, color: c.charcoal, letterSpacing: "-0.5px" }}>
          Goat Pool
        </span>
      </Link>

      <div style={{
        width: "100%",
        maxWidth: "420px",
        backgroundColor: c.white,
        borderRadius: "16px",
        padding: "36px",
        border: `1px solid ${c.grayLight}`,
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: c.charcoal, margin: "0 0 6px", letterSpacing: "-0.5px", textAlign: "center" }}>
          {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
        </h1>
        <p style={{ fontSize: "14px", color: c.gray, margin: "0 0 28px", textAlign: "center" }}>
          {mode === "login"
            ? "Sign in to your Goat Pool account."
            : mode === "signup"
            ? "Join the pool. Pick athletes. Survive."
            : "We'll send you a link to reset your password."}
        </p>

        {error && (
          <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "14px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: c.greenMuted, border: `1px solid ${c.green}`, color: c.green, fontSize: "14px", marginBottom: "20px" }}>
            {message}
          </div>
        )}

        {mode !== "forgot" && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              style={{
                width: "100%", padding: "12px", borderRadius: "10px",
                border: `1.5px solid ${c.grayLight}`, background: c.white,
                fontSize: "15px", fontWeight: 600, color: c.charcoal,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "10px",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: c.grayLight }} />
              <span style={{ fontSize: "13px", color: c.gray, fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: c.grayLight }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocused("username")}
                onBlur={() => setFocused(null)}
                style={inputStyle(focused === "username")}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              style={inputStyle(focused === "email")}
              required
            />
          </div>

          {mode !== "forgot" && (
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: c.charcoal, marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                style={inputStyle(focused === "password")}
                required
              />
            </div>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: "24px" }}>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                style={{ background: "none", border: "none", padding: 0, fontSize: "13px", color: c.green, fontWeight: 600, cursor: "pointer" }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {mode !== "login" && <div style={{ height: "24px" }} />}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: "10px",
              border: "none", background: loading ? "#9CA3AF" : c.green,
              color: c.white, fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
          </button>
        </form>

        <p style={{ fontSize: "14px", color: c.gray, textAlign: "center", margin: "20px 0 0" }}>
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button onClick={() => switchMode("signup")} style={{ background: "none", border: "none", padding: 0, color: c.green, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                Sign up
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", padding: 0, color: c.green, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                Sign in
              </button>
            </>
          ) : (
            <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", padding: 0, color: c.green, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
              Back to sign in
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
