import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import JoinPoolClient from "./JoinPoolClient";

const c = {
  cream: "#F5F3EF", white: "#FFFFFF", charcoal: "#2D2D2D",
  gray: "#6B7280", grayLight: "#E5E7EB",
};

export default async function JoinPoolPage({ params }: { params: { token: string } }) {
  const token = params.token;

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invite } = await adminClient
    .from("pool_invites")
    .select("id, status, pool_id, pools(id, name, slug, fee_per_life, tournaments(name))")
    .eq("invite_token", token)
    .single();

  if (!invite) {
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: c.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ backgroundColor: c.white, borderRadius: "20px", padding: "40px", border: `1px solid ${c.grayLight}`, textAlign: "center", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: c.charcoal, margin: "0 0 8px" }}>Invalid Invite</h1>
          <p style={{ fontSize: "15px", color: c.gray, margin: 0 }}>This invite link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const pool = invite.pools as any;
  const tournament = pool?.tournaments as any;

  if (invite.status === "accepted") {
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: c.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ backgroundColor: c.white, borderRadius: "20px", padding: "40px", border: `1px solid ${c.grayLight}`, textAlign: "center", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: c.charcoal, margin: "0 0 8px" }}>Already Used</h1>
          <p style={{ fontSize: "15px", color: c.gray, margin: "0 0 20px" }}>This invite has already been accepted.</p>
          <a href={`/player/${pool.slug}`} style={{
            display: "inline-block", padding: "10px 20px", borderRadius: "10px",
            background: "#4A7C59", color: c.white, fontSize: "14px", fontWeight: 600,
            textDecoration: "none",
          }}>Go to Pool</a>
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login`);

  const { data: existing } = await adminClient
    .from("pool_players")
    .select("id")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) redirect(`/player/${pool.slug}`);

  return (
    <JoinPoolClient
      token={token}
      poolName={pool.name}
      tournamentName={tournament?.name ?? "—"}
      feePerLife={pool.fee_per_life ?? 0}
    />
  );
}
