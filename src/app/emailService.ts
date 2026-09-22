import emailjs from "@emailjs/browser";

// ─── EmailJS config from env vars ─────────────────────────────────────────────
// Set these in your project's environment variables:
//   VITE_EMAILJS_SERVICE_ID   — your EmailJS Service ID
//   VITE_EMAILJS_PUBLIC_KEY   — your EmailJS Public (User) Key
//   VITE_EMAILJS_TEMPLATE_ID  — a template with the LMPT2 visual variables documented in EMAILJS_TEMPLATE.html
//   VITE_EMAILJS_CC_EMAIL      — CC recipient used only for the SSCS Study Approved email

const SERVICE_ID  = ((import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined)?.trim() || "service_9f81sqq") as string | undefined;
const PUBLIC_KEY  = ((import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined)?.trim() || "AAzjcb2oDP4JGVqnb") as string | undefined;
const TEMPLATE_ID = ((import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined)?.trim() || "template_9i9tyr4") as string | undefined;

const configured = !!(SERVICE_ID && PUBLIC_KEY && TEMPLATE_ID);

export const workflowCcEmail = ((import.meta.env.VITE_EMAILJS_CC_EMAIL as string | undefined)?.trim() || "pttlng-marinelmpt2@pttlng.com");

const configuredAdminEmails = ((import.meta.env.VITE_ADMIN_NOTIFICATION_EMAILS as string | undefined) ?? "")
  .split(",")
  .map(v => v.trim())
  .filter(Boolean);

// Narudech must always receive admin registration notifications in addition to
// any recipients configured in VITE_ADMIN_NOTIFICATION_EMAILS.
export const adminNotificationEmails = Array.from(new Set([
  ...configuredAdminEmails,
  "narudech.s@pttlng.com",
]));

function normalizeRecipients(value: string | string[]): string {
  const raw = Array.isArray(value) ? value : [value];
  return Array.from(new Set(raw
    .flatMap(item => item.split(/[;,]/g))
    .map(item => item.trim())
    .filter(Boolean)))
    .join(", ");
}

type EmailVisualTheme = {
  headerColor: string;
  headerTint: string;
  statusLabel: string;
  categoryLabel: string;
  actionLabel: string;
};

function resolveEmailVisualTheme(subject: string): EmailVisualTheme {
  const value = subject.toLowerCase();

  if (value.includes("verification code")) {
    return {
      headerColor: "#4F46E5",
      headerTint: "#EEF2FF",
      statusLabel: "VERIFICATION",
      categoryLabel: "SECURITY",
      actionLabel: "Open LMPT2 SSCS",
    };
  }
  if (value.includes("rejected")) {
    return {
      headerColor: "#DC2626",
      headerTint: "#FEF2F2",
      statusLabel: "REJECTED",
      categoryLabel: "STATUS UPDATE",
      actionLabel: "Open LMPT2 SSCS",
    };
  }
  if (value.includes("revision")) {
    return {
      headerColor: "#EA580C",
      headerTint: "#FFF7ED",
      statusLabel: "REVISION REQUIRED",
      categoryLabel: "ACTION REQUIRED",
      actionLabel: "Open Study",
    };
  }
  if (value.includes("approved") || value.includes("granted")) {
    return {
      headerColor: "#15803D",
      headerTint: "#F0FDF4",
      statusLabel: "APPROVED",
      categoryLabel: "STATUS UPDATE",
      actionLabel: "Open LMPT2 SSCS",
    };
  }
  if (value.includes("submitted")) {
    return {
      headerColor: "#2563EB",
      headerTint: "#EFF6FF",
      statusLabel: "SUBMITTED",
      categoryLabel: "REVIEW REQUIRED",
      actionLabel: "Review Study",
    };
  }
  if (value.includes("request")) {
    return {
      headerColor: "#D97706",
      headerTint: "#FFFBEB",
      statusLabel: "ACTION REQUIRED",
      categoryLabel: "REQUEST",
      actionLabel: "Review Request",
    };
  }

  return {
    headerColor: "#334155",
    headerTint: "#F8FAFC",
    statusLabel: "NOTIFICATION",
    categoryLabel: "LMPT2 SSCS",
    actionLabel: "Open LMPT2 SSCS",
  };
}

function formatEventTime(): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date()) + " ICT";
  } catch {
    return new Date().toISOString();
  }
}

const appUrl = ((import.meta.env.VITE_APP_URL as string | undefined)?.trim() || "https://lmpt2-sscs.vercel.app");

async function send(
  toEmail: string | string[],
  subject: string,
  message: string,
  fromName = "LMPT2 SSCS System",
  includeWorkflowCc = false,
): Promise<void> {
  const recipientEmail = normalizeRecipients(toEmail);
  if (!recipientEmail) {
    console.info("[LMPT2 Email — no recipient]", { subject, message });
    return;
  }
  if (!configured) {
    console.info("[LMPT2 Email — not configured]", { toEmail: recipientEmail, ccEmail: includeWorkflowCc ? workflowCcEmail : "", subject, message });
    return;
  }
  try {
    const visual = resolveEmailVisualTheme(subject);
    await emailjs.send(
      SERVICE_ID!,
      TEMPLATE_ID!,
      {
        to_email: recipientEmail,                               // → To Email: {{to_email}} (supports multi-recipient list)
        cc_email: includeWorkflowCc ? workflowCcEmail : "",     // → Cc: {{cc_email}}
        title: subject,                                         // → Subject: {{title}}
        name: fromName,                                         // → From Name: {{name}}
        email: recipientEmail,                                  // → Reply To: {{email}}
        message,                                                // → Main content: {{message}}
        header_color: visual.headerColor,                       // → Notification header accent
        header_tint: visual.headerTint,                         // → Light accent background
        status_label: visual.statusLabel,                       // → APPROVED / ACTION REQUIRED / etc.
        category_label: visual.categoryLabel,                   // → Small label above the title
        action_label: visual.actionLabel,                       // → CTA button text
        action_url: appUrl,                                     // → CTA destination
        event_time: formatEventTime(),                          // → Event time in ICT
        preheader: `${visual.statusLabel}: ${subject}`,          // → Inbox preview text
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


export async function notifyUserAccountApproved(opts: {
  userName: string;
  userEmail: string;
  approvedByName: string;
}) {
  await send(
    opts.userEmail,
    "Account Approved — LMPT2 SSCS",
    `Hello ${opts.userName},\n\nYour LMPT2 SSCS account has been approved.\n\nApproved by : ${opts.approvedByName}\n\nYou can now sign in and access the system.`,
    "LMPT2 SSCS — Account Approval",
  );
}

export async function notifyTerminalOfficerAccessRequest(opts: {
  vesselName: string;
  requesterName: string;
  requesterEmail: string;
  terminalEmail: string | string[];
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
  terminalEmail: string | string[];
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
    "LMPT2 SSCS System",
    true,
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

export async function notifyShipOfficerRevisionRequested(opts: {
  vesselName: string;
  requestedByName: string;
  shipEmail: string;
}) {
  await send(
    opts.shipEmail,
    `SSCS Revision Requested — ${opts.vesselName}`,
    `The Terminal Officer has requested a revision to your submitted SSCS study.\n\nVessel       : ${opts.vesselName}\nRequested by : ${opts.requestedByName}\n\nThe study has been returned to Draft. Please log in, review the Terminal Officer comments, make the required corrections, and submit the study again.`,
  );
}

export async function notifyTerminalOfficerEditRequested(opts: {
  vesselName: string;
  requesterName: string;
  requesterEmail: string;
  terminalEmail: string | string[];
}) {
  await send(
    opts.terminalEmail,
    `SSCS Edit Request — ${opts.vesselName}`,
    `A Ship Officer has requested permission to edit an approved SSCS study.\n\nVessel       : ${opts.vesselName}\nRequested by : ${opts.requesterName} (${opts.requesterEmail})\n\nPlease log in to the LMPT2 SSCS system to approve or reject this edit request.`,
  );
}

export async function notifyShipOfficerEditRejected(opts: {
  vesselName: string;
  rejectedByName: string;
  shipEmail: string;
}) {
  await send(
    opts.shipEmail,
    `Edit Request Rejected — ${opts.vesselName}`,
    `Your request to edit the approved SSCS study has been rejected.\n\nVessel      : ${opts.vesselName}\nRejected by : ${opts.rejectedByName}\n\nThe approved study remains locked. Please contact the Terminal Officer if further clarification is required.`,
  );
}


export async function notifyTerminalOfficerVesselAccessRequest(opts: {
  vesselName: string;
  requesterName: string;
  requesterEmail: string;
  requestType: "claim" | "additional" | "handover";
  reason?: string;
  terminalEmail: string | string[];
}) {
  const typeLabel = opts.requestType === "claim"
    ? "Claim Existing Vessel"
    : opts.requestType === "handover"
      ? "Ship Officer Handover"
      : "Additional Ship Officer Access";
  await send(
    opts.terminalEmail,
    `Vessel Access Request — ${opts.vesselName}`,
    `A Ship Officer has requested vessel access.\n\nVessel       : ${opts.vesselName}\nRequest type : ${typeLabel}\nRequested by : ${opts.requesterName} (${opts.requesterEmail})${opts.reason ? `\nReason        : ${opts.reason}` : ""}\n\nPlease log in to the LMPT2 SSCS system to approve or reject this request.`,
  );
}

export async function notifyShipOfficerVesselAccessReviewed(opts: {
  vesselName: string;
  status: "approved" | "rejected";
  reviewedByName: string;
  shipEmail: string;
}) {
  const approved = opts.status === "approved";
  await send(
    opts.shipEmail,
    `Vessel Access ${approved ? "Approved" : "Rejected"} — ${opts.vesselName}`,
    `${approved ? "Your vessel access request has been approved." : "Your vessel access request has been rejected."}\n\nVessel      : ${opts.vesselName}\nReviewed by : ${opts.reviewedByName}\n\n${approved ? "You can now open the vessel and work on its SSCS study according to the current study status." : "Please contact the Terminal Officer if further clarification is required."}`,
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
    false, // Never CC authentication codes to a shared mailbox.
  );
}

export { configured as emailConfigured };
