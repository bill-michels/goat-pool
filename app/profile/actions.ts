"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/resend";

const db = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function updateUsername(
  username: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = username.trim();
  if (!trimmed) return { error: "Username cannot be empty." };

  const { error } = await db()
    .from("users")
    .update({ username: trimmed })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("unique") || error.message.includes("duplicate")) {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }
  return {};
}

export async function updateEmail(
  email: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return { error: "Invalid email address." };

  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) return { error: error.message };
  return {};
}

export async function updatePassword(
  newPassword: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (newPassword.length < 6) return { error: "Password must be at least 6 characters." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return {};
}

// Creates (or reuses) a Stripe Express account and returns an onboarding link URL
export async function createStripeConnectLink(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const admin = db();
  const { data: profile } = await admin
    .from("users")
    .select("email, stripe_connect_account_id")
    .eq("id", user.id)
    .single();

  let accountId = profile?.stripe_connect_account_id as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: profile?.email ?? user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await admin.from("users").update({ stripe_connect_account_id: accountId }).eq("id", user.id);
  }

  const base = appUrl();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/profile?stripe_refresh=1`,
    return_url: `${base}/profile?stripe_return=1`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}
