import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using Goat Pool.",
};

const c = {
  green: "#4A7C59",
  cream: "#F5F3EF",
  white: "#FFFFFF",
  charcoal: "#2D2D2D",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: "14px", color: c.gray, margin: "0 0 48px" }}>
          Last updated: May 30, 2026
        </p>

        <Section title="1. Agreement">
          <p>By accessing or using Goat Pool at goat-pool.com (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users including players, commissioners, and administrators.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least 18 years old to use Goat Pool. By using the Service, you represent that you meet this requirement. Entry fees and payouts involve real money; you are responsible for ensuring participation is lawful in your jurisdiction.</p>
        </Section>

        <Section title="3. Accounts">
          <p>You are responsible for keeping your account credentials secure. You are responsible for all activity that occurs under your account. Do not share your password. Notify us immediately at <a href="mailto:support@goat-pool.com" style={{ color: c.green }}>support@goat-pool.com</a> if you suspect unauthorized access.</p>
        </Section>

        <Section title="4. Pools and Picks">
          <p>Each pool is created and managed by a Commissioner. Pool rules (entry fee, missed pick rule, number of lives) are set by the Commissioner and visible before you join. By joining a pool, you agree to that pool&apos;s rules.</p>
          <p>Picks are due before the round lock deadline. Missed picks are handled automatically per the pool&apos;s configured rule (top seed remaining or random). We are not responsible for picks you fail to submit on time.</p>
          <p>Tournament data (athlete results, round outcomes) is entered manually by platform administrators. We make reasonable efforts for accuracy but do not guarantee real-time correctness.</p>
        </Section>

        <Section title="5. Payments and Refunds">
          <p>Entry fees are processed by Stripe at the time you join a pool. By paying, you agree to Stripe&apos;s terms of service. Commissioner payouts are disbursed at pool conclusion after platform fees are deducted.</p>
          <p>Refunds are issued only in cases of tournament cancellation and are processed at the discretion of platform administrators. We do not issue refunds for dissatisfaction with pool outcomes, missed picks, or athlete performance.</p>
          <p>The platform takes a percentage of entry fee revenue (the &quot;take rate&quot;) to cover operating costs. The current take rate is displayed at pool creation time.</p>
        </Section>

        <Section title="6. Commissioner Responsibilities">
          <p>Commissioners are responsible for managing their pool fairly, inviting players, and not misrepresenting pool rules. Commissioners who receive payouts must complete Stripe identity verification as required by financial regulations. Commissioners are not employees or agents of Goat Pool.</p>
        </Section>

        <Section title="7. Acceptable Use">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to manipulate pool outcomes through collusion or automated means</li>
            <li>Create multiple accounts to circumvent pool rules</li>
            <li>Harass, threaten, or harm other users</li>
            <li>Attempt to access systems or data you are not authorized to access</li>
            <li>Use the Service in any way that could damage or overburden our infrastructure</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these rules without notice or refund.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted access, error-free operation, or that pool results will be processed without delay. To the maximum extent permitted by law, Goat Pool&apos;s liability for any claim arising from use of the Service is limited to the amount you paid in entry fees in the 12 months preceding the claim.</p>
        </Section>

        <Section title="9. Intellectual Property">
          <p>All content, design, and code on Goat Pool is owned by or licensed to us. You may not copy, reproduce, or distribute any part of the Service without our written permission.</p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>We may update these terms at any time. Continued use of the Service after changes constitutes acceptance. We will update the &quot;Last updated&quot; date at the top. For material changes, we may send an email notification to registered users.</p>
        </Section>

        <Section title="11. Contact">
          <p>Questions about these terms? Email us at <a href="mailto:support@goat-pool.com" style={{ color: c.green }}>support@goat-pool.com</a>.</p>
        </Section>
      </div>

      <footer style={{ borderTop: `1px solid ${c.grayLight}`, padding: "24px 40px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: c.gray, margin: 0 }}>
          © {new Date().getFullYear()} Goat Pool &nbsp;·&nbsp;{" "}
          <Link href="/terms" style={{ color: c.green }}>Terms of Service</Link>
          {" "}&nbsp;·&nbsp;{" "}
          <Link href="/privacy" style={{ color: c.gray }}>Privacy Policy</Link>
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
