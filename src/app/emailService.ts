import emailjs from "@emailjs/browser";

// ─── EmailJS config from env vars ─────────────────────────────────────────────
// Set these in your project's environment variables:
//   VITE_EMAILJS_SERVICE_ID   — your EmailJS Service ID
//   VITE_EMAILJS_PUBLIC_KEY   — your EmailJS Public (User) Key
//   VITE_EMAILJS_TEMPLATE_ID  — a template with: {{to_email}}, {{subject}}, {{message}}

const SERVICE_ID  = ((import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined)?.trim() || "service_9f81sqq") as string | undefined;
const PUBLIC_KEY  = ((import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined)?.trim() || "AAzjcb2oDP4JGVqnb") as string | undefined;
const TEMPLATE_ID = ((import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined)?.trim() || "template_9i9tyr4") as string | undefined;

const configured = !!(SERVICE_ID && PUBLIC_KEY && TEMPLATE_ID);

export const adminNotificationEmails = ((import.meta.env.VITE_ADMIN_NOTIFICATION_EMAILS as string | undefined) ?? "")
  .split(",")
  .map(v => v.trim())
  .filter(Boolean);

async function send(toEmail: string, subject: string, message: string, fromName = "LMPT2 SSCS System"): Promise<void> {
  if (!configured) {
    console.info("[LMPT2 Email — not configured]", { toEmail, subject, message });
    return;
  }
  try {
    await emailjs.send(
      SERVICE_ID!,
      TEMPLATE_ID!,
      {
        to_email: toEmail,   // → To Email field (must be {{to_email}} in template)
        title:    subject,   // → Subject: "Contact Us: {{title}}"
        name:     fromName,  // → From Name: {{name}}, and shown in content
        email:    toEmail,   // → Reply To: {{email}}
        message,             // → Content: {{message}}
      },
      PUBLIC_KEY!,
    );
  } catch (err) {
  console.error("[LMPT2 Email send failed]", err);
  throw err;
}
}

// ─── Notification helpers ──────────────────────────────────────────────────────

export async function notifyAdminNewRegistration(opts: {
  userName: string;
  userEmail: string;
  userCompany: string;
  userRole: string;
  adminEmail: string;
}) {
  await send(
    opts.adminEmail,
    "New Registration Request — LMPT2 SSCS",
    `A new user has registered and is pending your approval.\n\nName    : ${opts.userName}\nEmail   : ${opts.userEmail}\nCompany : ${opts.userCompany}\nRole    : ${opts.userRole}\n\nPlease log in to the Admin Panel to approve or reject this account.`,
    "LMPT2 SSCS — Registration",
  );
}

export async function notifyTerminalOfficerAccessRequest(opts: {
  vesselName: string;
  requesterName: string;
  requesterEmail: string;
  terminalEmail: string;
}) {
  await send(
    opts.terminalEmail,
    `SSCS Access Request — ${opts.vesselName}`,
    `A ship officer has requested access to start an SSCS study.\n\nVessel       : ${opts.vesselName}\nRequested by : ${opts.requesterName} (${opts.requesterEmail})\n\nPlease log in to the LMPT2 SSCS system to approve or reject this request.`,
  );
}

export async function notifyShipOfficerAccessApproved(opts: {
  vesselName: string;
  approvedByName: string;
  shipEmail: string;
}) {
  await send(
    opts.shipEmail,
    `SSCS Access Granted — ${opts.vesselName}`,
    `Your SSCS study access request has been approved.\n\nVessel      : ${opts.vesselName}\nApproved by : ${opts.approvedByName}\n\nYou may now log in and begin filling the study.`,
  );
}

export async function notifyShipOfficerAccessRejected(opts: {
  vesselName: string;
  rejectedByName: string;
  shipEmail: string;
}) {
  await send(
    opts.shipEmail,
    `SSCS Access Rejected — ${opts.vesselName}`,
    `Your SSCS study access request has been rejected.\n\nVessel      : ${opts.vesselName}\nRejected by : ${opts.rejectedByName}\n\nPlease contact the terminal officer for more information.`,
  );
}

export async function notifyTerminalOfficerStudySubmitted(opts: {
  vesselName: string;
  submitterName: string;
  terminalEmail: string;
}) {
  await send(
    opts.terminalEmail,
    `SSCS Study Submitted for Review — ${opts.vesselName}`,
    `A ship officer has submitted an SSCS study for your review.\n\nVessel       : ${opts.vesselName}\nSubmitted by : ${opts.submitterName}\n\nPlease log in to the LMPT2 SSCS system to review and approve.`,
  );
}

export async function notifyShipOfficerStudyApproved(opts: {
  vesselName: string;
  approvedByName: string;
  shipEmail: string;
}) {
  await send(
    opts.shipEmail,
    `SSCS Study Approved — ${opts.vesselName}`,
    `Your SSCS compatibility study has been approved.\n\nVessel      : ${opts.vesselName}\nApproved by : ${opts.approvedByName}\n\nThe study is now locked and on record.`,
  );
}

export async function notifyShipOfficerEditApproved(opts: {
  vesselName: string;
  approvedByName: string;
  shipEmail: string;
}) {
  await send(
    opts.shipEmail,
    `Edit Request Approved — ${opts.vesselName}`,
    `Your edit request for the SSCS study has been approved.\n\nVessel      : ${opts.vesselName}\nApproved by : ${opts.approvedByName}\n\nYou may now log in and make your corrections.`,
  );
}

export async function sendOTPEmail(opts: {
  toEmail: string;
  userName: string;
  otp: string;
}) {
  await send(
    opts.toEmail,
    "Your LMPT2 SSCS Verification Code",
    `Hello ${opts.userName},\n\nYour one-time verification code is:\n\n${opts.otp}\n\nThis code is valid for this session only. Do not share it with anyone.\n\nIf you did not request this, please ignore this email.`,
    "LMPT2 SSCS — Verification",
  );
}

export { configured as emailConfigured };
