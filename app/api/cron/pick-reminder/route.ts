import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyPickReminder } from "@/app/admin/tournamentsetup/actions";

export const runtime = "nodejs";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active rounds whose lock deadline is within the next 24 hours
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: rounds } = await db()
    .from("rounds")
    .select("id")
    .eq("status", "active")
    .gt("lock_deadline", now.toISOString())
    .lte("lock_deadline", in24h.toISOString());

  if (!rounds?.length) {
    return NextResponse.json({ sent: 0 });
  }

  await Promise.allSettled(rounds.map((r) => notifyPickReminder(r.id)));

  return NextResponse.json({ sent: rounds.length });
}
