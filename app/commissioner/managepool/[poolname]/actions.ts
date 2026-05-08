"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { resend, FROM, appUrl } from "@/lib/resend";
import { inviteEmail } from "@/lib/emails";

const db = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function sendInvites(
  emails: string[],
  poolId: string,
  poolName: string,
  tournamentName: string,
  commissionerUsername: string,
  feePerLife: number
): Promise<{ data?: { id: string; email: string; status: string; sent_at: string }[]; error?: string }> {
  const newInvites = emails.map((email) => ({
    pool_id: poolId,
    email,
    invite_token: crypto.randomUUID(),
    status: "pending",
  }));

  const { data, error } = await db()
    .from("pool_invites")
    .insert(newInvites)
    .select("id, email, status, sent_at, invite_token");

  if (error) return { error: error.message };

  const base = appUrl();
  await Promise.allSettled(
    (data ?? []).map((invite) =>
      resend.emails.send({
        from: FROM,
        to: invite.email,
        subject: `You're invited to join ${poolName}`,
        html: inviteEmail({
          poolName,
          tournamentName,
          commissionerUsername,
          joinUrl: `${base}/join/${invite.invite_token}`,
          feePerLife,
        }),
      })
    )
  );

  return {
    data: (data ?? []).map(({ id, email, status, sent_at }) => ({ id, email, status, sent_at })),
  };
}

export async function resendInvite(
  inviteId: string
): Promise<{ error?: string }> {
  const admin = db();

  const { data: invite } = await admin
    .from("pool_invites")
    .select("id, email, invite_token, pool_id")
    .eq("id", inviteId)
    .single();

  if (!invite) return { error: "Invite not found." };

  const { data: pool } = await admin
    .from("pools")
    .select("name, fee_per_life, tournaments(name), users(username)")
    .eq("id", invite.pool_id)
    .single();

  if (!pool) return { error: "Pool not found." };

  const poolName = pool.name;
  const tournamentName = (pool.tournaments as any)?.name ?? "";
  const commissionerUsername = (pool.users as any)?.username ?? "";
  const feePerLife = pool.fee_per_life ?? 0;
  const base = appUrl();

  const { error } = await resend.emails.send({
    from: FROM,
    to: invite.email,
    subject: `You're invited to join ${poolName}`,
    html: inviteEmail({
      poolName,
      tournamentName,
      commissionerUsername,
      joinUrl: `${base}/join/${invite.invite_token}`,
      feePerLife,
    }),
  });

  if (error) return { error: error.message };
  return {};
}
