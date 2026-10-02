const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("SSCS_FROM_EMAIL") || "no-reply@sscs.marine-lmpt2.com";
const FROM_NAME = Deno.env.get("SSCS_FROM_NAME") || "LMPT2 SSCS System";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function messageHtml(message: string) {
  return escapeHtml(message).replaceAll("\n", "<br>");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return Response.json({ ok: false, message: "Method not allowed." }, { status: 405, headers: corsHeaders });
  }
  if (!RESEND_API_KEY) {
    return Response.json({ ok: false, message: "RESEND_API_KEY is not configured." }, { status: 500, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      toEmail, ccEmail = "", subject, message, fromName = FROM_NAME,
      appUrl = "https://sscs.marine-lmpt2.com",
      eventTime = "", visual = {}, approvalSummaryHtml = "",
    } = body ?? {};

    if (!toEmail || !subject || !message) {
      return Response.json({ ok: false, message: "toEmail, subject and message are required." }, { status: 400, headers: corsHeaders });
    }

    const to = String(toEmail).split(/[;,]/).map((x) => x.trim()).filter(Boolean);
    const cc = String(ccEmail).split(/[;,]/).map((x) => x.trim()).filter(Boolean);
    if (!to.length) {
      return Response.json({ ok: false, message: "No valid recipient." }, { status: 400, headers: corsHeaders });
    }

    const headerColor = escapeHtml(visual.headerColor || "#334155");
    const headerTint = escapeHtml(visual.headerTint || "#F8FAFC");
    const statusLabel = escapeHtml(visual.statusLabel || "NOTIFICATION");
    const categoryLabel = escapeHtml(visual.categoryLabel || "LMPT2 SSCS");
    const actionLabel = escapeHtml(visual.actionLabel || "Open LMPT2 SSCS");

    const html = `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="padding:22px 28px;background:${headerTint};border-top:6px solid ${headerColor}">
<div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:${headerColor}">${categoryLabel}</div>
<div style="font-size:24px;font-weight:700;margin-top:6px">${escapeHtml(subject)}</div>
<div style="display:inline-block;margin-top:12px;padding:5px 9px;border-radius:999px;background:${headerColor};color:#fff;font-size:11px;font-weight:700">${statusLabel}</div>
</td></tr>
<tr><td style="padding:28px;line-height:1.6;font-size:15px">
${messageHtml(String(message))}
${approvalSummaryHtml || ""}
<div style="margin-top:26px"><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:${headerColor};color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:700">${actionLabel}</a></div>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px">
Sent by ${escapeHtml(fromName)}${eventTime ? ` • ${escapeHtml(eventTime)}` : ""}
</td></tr>
</table></td></tr></table></body></html>`;

    const payload: Record<string, unknown> = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: String(subject),
      html,
      text: String(message),
    };
    if (cc.length) payload.cc = cc;

    const resend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await resend.json();
    if (!resend.ok) {
      console.error("Resend error", result);
      return Response.json({ ok: false, message: result?.message || "Resend rejected the email." }, { status: resend.status, headers: corsHeaders });
    }

    return Response.json({ ok: true, id: result.id }, { headers: corsHeaders });
  } catch (error) {
    console.error("send-email failed", error);
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Unexpected error." }, { status: 500, headers: corsHeaders });
  }
});
