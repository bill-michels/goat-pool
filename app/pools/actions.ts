"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { resend, FROM, appUrl } from "@/lib/resend";
import { joinRequestEmail } from "@/lib/emails";

const db = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function requestToJoin(poolId: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to request to join." };

  const admin = db();

  const { data: userData } = await admin
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  const { data: pool } = await admin
    .from("pools")
    .select("id, name, slug, allow_join_requests, commissioner_id, users(email)")
    .eq("id", poolId)
    .single();

  if (!pool) return { error: "Pool not found." };
  if (!pool.allow_join_requests) return { error: "This pool is not accepting join requests." };

  const { error } = await admin.from("join_requests").insert({
    pool_id: poolId,
    user_id: user.id,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already requested to join this pool." };
    return { error: error.message };
  }

  const commissionerEmail = (pool.users as any)?.email;
  if (commissionerEmail) {
    const base = appUrl();
    await resend.emails.send({
      from: FROM,
      to: commissionerEmail,
      subject: `${userData?.username ?? "Someone"} wants to join ${pool.name}`,
      html: joinRequestEmail({
        requesterUsername: userData?.username ?? "A user",
        poolName: pool.name,
        manageUrl: `${base}/commissioner/managepool/${pool.slug}`,
      }),
    });
  }

  return {};
}
