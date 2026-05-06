import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import StartPoolClient from "./StartPoolClient";

export default async function StartPoolPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: userData }, { data: tournaments }] = await Promise.all([
    adminClient.from("users").select("username, role").eq("id", user.id).single(),
    adminClient
      .from("tournaments")
      .select("id, name")
      .in("status", ["upcoming", "active"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <StartPoolClient
      userId={user.id}
      username={userData?.username ?? "?"}
      isAdmin={userData?.role === "admin"}
      tournaments={tournaments ?? []}
    />
  );
}
