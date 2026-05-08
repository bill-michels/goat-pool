"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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
