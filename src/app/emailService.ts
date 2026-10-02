import { requireSupabase, supabaseConfigured } from "./supabaseClient";

// ─── Email transport ───────────────────────────────────────────────────────────
// Browser -> Supabase Edge Function -> Resend.
// RESEND_API_KEY stays only in Supabase Edge Function secrets.
const configured = supabaseConfigured;

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
  if (value.includes("corrections completed")) {
    return {
      headerColor: "#0F766E",
      headerTint: "#F0FDFA",
      statusLabel: "CORRECTED",
      categoryLabel: "READY FOR REVIEW",
      actionLabel: "Review Study",
    };
  }
  if (value.includes("feedback")) {
    return {
      headerColor: "#7C3AED",
      headerTint: "#F5F3FF",
      statusLabel: "FEEDBACK",
      categoryLabel: "CORRECTION REQUESTED",
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

const appUrl = ((import.meta.env.VITE_APP_URL as string | undefined)?.trim() || "https://sscs.marine-lmpt2.com");

function normalizeRecipients(value: string | string[]): string {
  const recipients = Array.isArray(value) ? value : value.split(/[;,]/);

  return Array.from(
    new Set(
      recipients
        .map((email) => String(email).trim())
        .filter(Boolean)
    )
  ).join(",");
}

const workflowCcEmail =
  ((import.meta.env.VITE_EMAILJS_CC_EMAIL as string | undefined)?.trim() ||
    "pttlng-marinelmpt2@pttlng.com");

async function send(
  toEmail: string | string[],
  subject: string,
  message: string,
  fromName = "LMPT2 SSCS System",
  includeWorkflowCc = false,
  approvalSummaryHtml = "",
): Promise<void> {
  const recipientEmail = normalizeRecipients(toEmail);
  if (!recipientEmail) {
    console.info("[LMPT2 Email — no recipient]", { subject, message });
    return;
  }

  if (!configured) {
    console.info("[LMPT2 Email — Supabase not configured]", {
      toEmail: recipientEmail,
      ccEmail: includeWorkflowCc ? workflowCcEmail : "",
      subject,
      message,
    });
    return;
  }

  const visual = resolveEmailVisualTheme(subject);
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("send-email", {
    body: {
      toEmail: recipientEmail,
      ccEmail: includeWorkflowCc ? workflowCcEmail : "",
      subject,
      message,
      fromName,
      appUrl,
      eventTime: formatEventTime(),
      visual,
      approvalSummaryHtml,
    },
  });

  if (error) {
    console.error("[LMPT2 Email send failed]", error);
    throw error;
  }
  if (!data?.ok) {
    const err = new Error(data?.message || "Unable to send email.");
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

export const adminNotificationEmails = Array.from(
  new Set(
    [
      ...String(
        (import.meta.env.VITE_ADMIN_NOTIFICATION_EMAILS as string | undefined) || ""
      )
        .split(/[;,]/)
        .map((email) => email.trim())
        .filter(Boolean),
      "narudech.s@pttlng.com",
    ]
  )
);

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

export async function notifyTerminalOfficersVesselAdded(opts: {
  vesselName: string;
  imo: string;
  addedByName: string;
  addedByEmail: string;
  sisterShip: boolean;
  terminalEmail: string | string[];
}) {
  return send(
    opts.terminalEmail,
    `Vessel Added — ${opts.vesselName}`,
    `A vessel has been added to the LMPT2 SSCS system.\n\nVessel       : ${opts.vesselName}\nIMO          : ${opts.imo}\nAdded by     : ${opts.addedByName} (${opts.addedByEmail})\nSister ship  : ${opts.sisterShip ? "Yes" : "No"}\n\n${opts.sisterShip ? "Action required: Please log in and verify or reject the Sister Ship Reference before the Ship Officer can enter SSCS data." : "Please log in to the LMPT2 SSCS system to review the vessel and any required follow-up actions."}`,
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
  approvalSummaryHtml?: string;
}) {
  await send(
    opts.shipEmail,
    `SSCS Study Approved — ${opts.vesselName}`,
    `Your SSCS compatibility study for ${opts.vesselName} has been approved by ${opts.approvedByName}.

The approved documents are now available in the SSCS system:
• Confirmation List Between Ship & Shore
• Ship Shore Compatibility Checklist

Please sign in to the SSCS system to view or download the approved documents.`,
    "LMPT2 SSCS System",
    true,
    opts.approvalSummaryHtml ?? "",
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

export async function notifyShipOfficerStudyFeedback(opts: {
  vesselName: string;
  requestedByName: string;
  parts: { section: string; assessment: "invalid" | "unacceptable" }[];
  message: string;
  shipEmail: string;
}) {
  const partLines = opts.parts
    .map(part => `- ${part.section}: ${part.assessment.toUpperCase()}`)
    .join("\n");
  await send(
    opts.shipEmail,
    `SSCS Feedback — ${opts.vesselName}`,
    `The Terminal Officer has sent feedback on your submitted SSCS study.\n\nVessel       : ${opts.vesselName}\nSent by      : ${opts.requestedByName}\n\nParts requiring correction:\n${partLines}\n\nFeedback:\n${opts.message}\n\nPlease log in to the LMPT2 SSCS system and correct the highlighted parts. The study remains Submitted; a formal Request Revision is not required.`,
  );
}

export async function notifyTerminalOfficerFeedbackCorrected(opts: {
  vesselName: string;
  shipOfficerName: string;
  terminalEmail: string;
  parts: { section: string; assessment: "invalid" | "unacceptable" }[];
}) {
  const partLines = opts.parts
    .map(part => `- ${part.section}: ${part.assessment.toUpperCase()}`)
    .join("\n");
  await send(
    opts.terminalEmail,
    `SSCS Feedback Corrections Completed — ${opts.vesselName}`,
    `The Ship Officer has reported that the requested feedback corrections are complete.\n\nVessel           : ${opts.vesselName}\nCorrected by     : ${opts.shipOfficerName}\n\nParts corrected:\n${partLines}\n\nPlease log in to the LMPT2 SSCS system and review the corrected information. The study remains Submitted until you approve it or send additional feedback.`,
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
