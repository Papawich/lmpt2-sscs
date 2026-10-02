import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "terminal_officer" | "ship_officer" | "viewer";
const roles = new Set<Role>(["terminal_officer", "ship_officer", "viewer"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization) return json({ ok: false, error: "Authentication required." }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: authData, error: authError } = await callerClient.auth.getUser();
    if (authError || !authData.user) return json({ ok: false, error: "Invalid session." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: callerProfile, error: profileError } = await admin
      .from("profiles")
      .select("id,is_admin")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!callerProfile?.is_admin) return json({ ok: false, error: "Administrator access required." }, 403);

    const body = await req.json();
    const action = String(body?.action ?? "");
    const userId = String(body?.userId ?? "").trim();
    if (!userId) return json({ ok: false, error: "User ID is required." }, 400);
    if (userId === authData.user.id) return json({ ok: false, error: "You cannot manage your own administrator account with this action." }, 400);

    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("id,is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return json({ ok: false, error: "User profile not found." }, 404);
    if (target.is_admin) return json({ ok: false, error: "Administrator accounts cannot be changed here." }, 403);

    if (action === "change-role") {
      const role = String(body?.role ?? "") as Role;
      if (!roles.has(role)) return json({ ok: false, error: "Invalid role." }, 400);
      const { error } = await admin.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", userId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete-user") {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ ok: false, error: "Unsupported action." }, 400);
  } catch (error) {
    console.error("[manage-user]", error);
    return json({ ok: false, error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
