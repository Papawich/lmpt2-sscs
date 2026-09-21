import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data, b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ ok: false, message: "Server configuration is incomplete." }, 500);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "request") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!email || !email.includes("@")) return json({ ok: false, message: "Invalid email address." }, 400);

      // Generate the browser-held reset secret before checking whether an account
      // exists. The public response remains generic to avoid account enumeration.
      const resetToken = randomToken();
      const tokenHash = await sha256(resetToken);
      const fakeRequestId = crypto.randomUUID();

      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id,email,account_status")
        .ilike("email", email)
        .maybeSingle();
      if (profileError) throw profileError;

      if (!profile || profile.account_status !== "approved") {
        return json({ ok: true, requestId: fakeRequestId, resetToken, status: "pending" });
      }

      // Keep only the newest request active for this user.
      await admin
        .from("password_reset_requests")
        .update({ status: "rejected" })
        .eq("user_id", profile.id)
        .in("status", ["pending", "approved"]);

      const { data: row, error: insertError } = await admin
        .from("password_reset_requests")
        .insert({
          user_id: profile.id,
          email: profile.email ?? email,
          token_hash: tokenHash,
          status: "pending",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      return json({ ok: true, requestId: row.id, resetToken, status: "pending" });
    }

    if (action === "status" || action === "complete") {
      const requestId = String(body?.requestId ?? "");
      const resetToken = String(body?.resetToken ?? "");
      if (!requestId || !resetToken) return json({ ok: false, message: "Reset request is missing." }, 400);

      const tokenHash = await sha256(resetToken);
      const { data: row, error: rowError } = await admin
        .from("password_reset_requests")
        .select("id,user_id,email,status,expires_at")
        .eq("id", requestId)
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (rowError) throw rowError;

      // A missing row is deliberately reported as pending so the endpoint does
      // not reveal whether a submitted email belongs to an account.
      if (!row) return json({ ok: true, status: "pending" });

      const expired = row.expires_at && new Date(row.expires_at).getTime() < Date.now();
      if (expired && row.status !== "completed") {
        await admin.from("password_reset_requests").update({ status: "rejected" }).eq("id", row.id);
        return json({ ok: true, status: "rejected" });
      }

      if (action === "status") {
        return json({ ok: true, status: row.status, expiresAt: row.expires_at });
      }

      const newPassword = String(body?.newPassword ?? "");
      if (row.status !== "approved") {
        return json({ ok: false, message: "This reset request has not been approved." });
      }
      if (!row.user_id) return json({ ok: false, message: "Account not found." });
      if (newPassword.length < 8) return json({ ok: false, message: "Password must be at least 8 characters." });

      const { error: authError } = await admin.auth.admin.updateUserById(row.user_id, {
        password: newPassword,
      });
      if (authError) throw authError;

      const { error: completeError } = await admin
        .from("password_reset_requests")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", row.id);
      if (completeError) throw completeError;

      return json({ ok: true, status: "completed" });
    }

    return json({ ok: false, message: "Unknown action." }, 400);
  } catch (error) {
    console.error("[password-reset]", error);
    return json({ ok: false, message: "Password reset service failed." }, 500);
  }
});
