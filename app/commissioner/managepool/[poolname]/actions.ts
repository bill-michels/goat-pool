"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { resend, FROM, appUrl } from "@/lib/resend";
import { inviteEmail } from "@/lib/emails";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe";

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

export async function approveJoinRequest(
  requestId: string,
  poolSlug: string
): Promise<{ error?: string }> {
  const admin = db();

  const { data: request } = await admin
    .from("join_requests")
    .select("id, pool_id, user_id, users(email, username)")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "Request not found." };

  const { data: pool } = await admin
    .from("pools")
    .select("id, name, fee_per_life, tournaments(name), users(username)")
    .eq("id", request.pool_id)
    .single();

  if (!pool) return { error: "Pool not found." };

  const userEmail = (request.users as any)?.email;
  if (!userEmail) return { error: "User email not found." };

  const inviteToken = crypto.randomUUID();
  const { error: inviteErr } = await admin.from("pool_invites").insert({
    pool_id: request.pool_id,
    email: userEmail,
    invite_token: inviteToken,
    status: "pending",
  });

  if (inviteErr) return { error: inviteErr.message };

  const base = appUrl();
  await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `You're invited to join ${pool.name}`,
    html: inviteEmail({
      poolName: pool.name,
      tournamentName: (pool.tournaments as any)?.name ?? "",
      commissionerUsername: (pool.users as any)?.username ?? "",
      joinUrl: `${base}/join/${inviteToken}`,
      feePerLife: pool.fee_per_life ?? 0,
    }),
  });

  await admin.from("join_requests").update({ status: "approved" }).eq("id", requestId);

  revalidatePath(`/commissioner/managepool/${poolSlug}`);
  return {};
}

export async function declineJoinRequest(
  requestId: string,
  poolSlug: string
): Promise<{ error?: string }> {
  const { error } = await db()
    .from("join_requests")
    .update({ status: "declined" })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath(`/commissioner/managepool/${poolSlug}`);
  return {};
}

export async function updateAllowJoinRequests(
  poolId: string,
  allow: boolean,
  poolSlug: string
): Promise<{ error?: string }> {
  const { error } = await db()
    .from("pools")
    .update({ allow_join_requests: allow })
    .eq("id", poolId);

  if (error) return { error: error.message };
  revalidatePath(`/commissioner/managepool/${poolSlug}`);
  return {};
}

export async function processPayout(
  poolId: string,
  poolSlug: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pool } = await admin
    .from("pools")
    .select("id, name, take_rate, commissioner_id, users(stripe_connect_account_id, stripe_connect_onboarded)")
    .eq("id", poolId)
    .single();

  if (!pool) return { error: "Pool not found." };
  if (pool.commissioner_id !== user.id) return { error: "Not authorized." };

  const commissioner = pool.users as any;
  if (!commissioner?.stripe_connect_account_id || !commissioner?.stripe_connect_onboarded) {
    return { error: "Please connect your Stripe account in your profile before requesting a payout." };
  }

  const { data: existingPayout } = await admin
    .from("payouts")
    .select("id, status")
    .eq("pool_id", poolId)
    .maybeSingle();

  if (existingPayout?.status === "completed") {
    return { error: "Payout has already been processed for this pool." };
  }

  const { data: payments } = await admin
    .from("payments")
    .select("amount")
    .eq("pool_id", poolId)
    .eq("status", "completed");

  const total = (payments ?? []).reduce((sum: number, p: any) => sum + p.amount, 0);
  if (total === 0) return { error: "No completed payments to pay out." };

  const platformAmount = Math.floor(total * pool.take_rate / 100);
  const commissionerAmount = total - platformAmount;

  const transfer = await stripe.transfers.create({
    amount: commissionerAmount,
    currency: "usd",
    destination: commissioner.stripe_connect_account_id,
    transfer_group: poolId,
    metadata: { pool_id: poolId, pool_name: pool.name },
  });

  await admin.from("payouts").upsert(
    {
      pool_id: poolId,
      commissioner_id: user.id,
      amount: commissionerAmount,
      platform_amount: platformAmount,
      stripe_transfer_id: transfer.id,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "pool_id" }
  );

  revalidatePath(`/commissioner/managepool/${poolSlug}`);
  return {};
}
