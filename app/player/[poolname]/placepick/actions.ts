"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function placePick(
  poolId: string,
  roundId: string,
  athleteId: string,
  poolSlug: string,
  existingPickId: string | null
): Promise<{ error: string } | never> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (existingPickId) {
    const { error } = await db
      .from("picks")
      .update({ athlete_id: athleteId })
      .eq("id", existingPickId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await db.from("picks").insert({
      pool_id: poolId,
      round_id: roundId,
      user_id: user.id,
      athlete_id: athleteId,
      is_auto_assigned: false,
    });
    if (error) return { error: error.message };
  }

  redirect(`/player/${poolSlug}`);
}
