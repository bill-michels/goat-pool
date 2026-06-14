import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Goat Pool collects, uses, and protects your personal information.",
};

const c = {
  green: "#4A7C59",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
};

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: c.charcoal, minHeight: "100vh", backgroundColor: c.cream }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", backgroundColor: c.white, borderBottom: `1px solid ${c.grayLight}` }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" fill={c.green} />
            <circle cx="20" cy="20" r="11" stroke={c.cream} strokeWidth="1.8" fill="none" />
            <path d="M11.5 9.5 Q20 18, 11.5 30.5" stroke={c.cream} strokeWidth="1.8" fill="none" />
            <path d="M28.5 9.5 Q20 18, 28.5 30.5" stroke={c.cream} strokeWidth="1.8" fill="none" />
          </svg>
          <span style={{ fontSize: "20px", fontWeight: 700, color: c.charcoal }}>Goat Pool</span>
        </Link>
        <Link href="/" style={{ fontSize: "14px", color: c.gray, textDecoration: "none" }}>← Back to Home</Link>
      </nav>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 40px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: c.charcoal, letterSpacing: "-0.8px", margin: "0 0 8px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "14px", color: c.gray, margin: "0 0 48px" }}>
          Last updated: May 30, 2026
        </p>

        <Section title="1. Who We Are">
          <p>Goat Pool (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the website at goat-pool.com, a platform for running tennis survivor pools. If you have questions about this policy, contact us at <a href="mailto:support@goat-pool.com" style={{ color: c.green }}>support@goat-pool.com</a>.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p><strong>Account information.</strong> When you sign up, we collect your email address and username. If you sign in with Google, we receive your name and email from Google.</p>
          <p><strong>Payment information.</strong> Entry fees are processed through Stripe. We do not store your card details — Stripe handles all payment data under their own privacy policy and PCI compliance program. Commissioners who receive payouts connect a Stripe Express account; Stripe collects any identity verification data required.</p>
          <p><strong>Pool activity.</strong> We store the picks you make each round, your pool membership status, and game history.</p>
          <p><strong>Usage data.</strong> We may collect standard web server logs (IP address, browser type, pages visited) for security and performance purposes.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul>
            <li>To operate your account and run the pool game</li>
            <li>To process entry fee payments and commissioner payouts</li>
            <li>To send you transactional emails (pick reminders, round results, invites)</li>
            <li>To respond to support requests</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>
          <p>We do not sell your personal information to third parties. We do not use your data for advertising.</p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>We use the following services, each with their own privacy policies:</p>
          <ul>
            <li><strong>Supabase</strong> — database and authentication hosting</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Resend</strong> — transactional email delivery</li>
            <li><strong>Vercel</strong> — website hosting</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>We retain your account and pool history for as long as your account is active. You may request deletion of your account and associated data by emailing <a href="mailto:support@goat-pool.com" style={{ color: c.green }}>support@goat-pool.com</a>. We will process deletion requests within 30 days, except where retention is required by law (e.g., financial records).</p>
        </Section>

        <Section title="6. Cookies">
          <p>We use a session cookie to keep you signed in. We do not use tracking or advertising cookies. You can clear cookies in your browser settings at any time, which will sign you out.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your location, you may have rights to access, correct, or delete your personal data. To exercise any of these rights, contact us at <a href="mailto:support@goat-pool.com" style={{ color: c.green }}>support@goat-pool.com</a>.</p>
        </Section>

        <Section title="8. Children">
          <p>Goat Pool is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with their information, contact us and we will delete it.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this policy from time to time. We&apos;ll update the &quot;Last updated&quot; date at the top. Continued use of Goat Pool after changes constitutes acceptance of the updated policy.</p>
        </Section>
      </div>

      <footer style={{ borderTop: `1px solid ${c.grayLight}`, padding: "24px 40px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>
          © {new Date().getFullYear()} Goat Pool &nbsp;·&nbsp;{" "}
          <Link href="/terms" style={{ color: c.gray }}>Terms of Service</Link>
          {" "}&nbsp;·&nbsp;{" "}
          <Link href="/privacy" style={{ color: c.green }}>Privacy Policy</Link>
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "36px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#2D2D2D", margin: "0 0 12px", letterSpacing: "-0.3px" }}>
        {title}
      </h2>
      <div style={{ fontSize: "15px", color: "#6B7280", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}
