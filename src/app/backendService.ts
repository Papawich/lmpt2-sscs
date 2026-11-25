import { requireSupabase, supabaseConfigured } from "./supabaseClient";

export { supabaseConfigured };

/** Consistent password policy for registration and recovery forms. */
export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include at least 1 uppercase letter (A-Z).";
  if (!/[^A-Za-z0-9\s]/.test(password)) return "Password must include at least 1 special character (e.g. ! @ #).";
  return null;
}

function assertPasswordPolicy(password: string): void {
  const error = validatePasswordPolicy(password);
  if (error) throw new Error(error);
}


export type CloudProfile = {
  id: string;
  name: string;
  email: string;
  company: string;
  role?: "terminal_officer" | "ship_officer" | "viewer";
  status: "pending" | "approved" | "rejected";
  isAdmin: boolean;
  registeredAt: string;
};

export type CloudUploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string;
  storagePath?: string;
};



export type CloudVesselAccess = {
  id: string;
  vesselId: number;
  userId: string;
  requestType: "claim" | "additional" | "handover" | "legacy";
  status: "pending" | "approved" | "rejected" | "revoked";
  reason: string;
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  revokePrevious: boolean;
};

function vesselAccessFromRow(row: any): CloudVesselAccess {
  return {
    id: row.id,
    vesselId: Number(row.vessel_id),
    userId: row.user_id,
    requestType: row.request_type,
    status: row.status,
    reason: row.reason ?? "",
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at ?? null,
    reviewedBy: row.reviewed_by ?? null,
    revokePrevious: Boolean(row.revoke_previous),
  };
}

export type CloudPasswordResetRequest = {
  id: string;
  userId: string | null;
  email: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  completedAt?: string | null;
  expiresAt?: string | null;
};

function passwordResetFromRow(row: any): CloudPasswordResetRequest {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    email: row.email ?? "",
    status: row.status,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at ?? null,
    approvedBy: row.approved_by ?? null,
    completedAt: row.completed_at ?? null,
    expiresAt: row.expires_at ?? null,
  };
}

type AnyVessel = Record<string, any>;
type AnyStudy = Record<string, any>;

const SECTION_KEYS = [
  ["flat_body", "flatBodyData"],
  ["fender_reaction", "fenderReactionData"],
  ["berthing_energy", "berthingEnergyData"],
  ["mooring_arrangement", "mooringArrangementData"],
  ["gangway", "gangwayData"],
  ["unloading_arm", "unloadingArmData"],
  ["cargo_management", "cargoManagementData"],
  ["ship_shore_link", "shipShoreLinkData"],
  ["ctms", "ctmsData"],
  ["sdp", "sdpData"],
  ["utility", "utilityData"],
  ["required_documents", "requiredDocuments"],
  ["attachments", "attachmentData"],
  ["quality_assessment", "qualityAssessmentData"],
  ["workflow_meta", "workflowMetaData"],
  ["terminal_feedback", "feedbackData"],
] as const;

function profileFromRow(row: any): CloudProfile {
  return {
    id: row.id,
    name: row.full_name ?? "",
    email: row.email ?? "",
    company: row.company ?? "",
    role: row.role ?? undefined,
    status: row.account_status,
    isAdmin: Boolean(row.is_admin),
    registeredAt: row.registered_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function vesselFromRow(row: any): AnyVessel {
  return {
    id: Number(row.id),
    name: row.name,
    imo: row.imo ?? "",
    isPlaceholder: Boolean(row.is_placeholder),
    callSign: row.call_sign ?? "—",
    flag: row.flag ?? "—",
    portOfRegistry: row.port_of_registry ?? "—",
    year: row.year_built == null ? 0 : Number(row.year_built),
    type: row.vessel_type ?? "LNG Carrier",
    capacity: row.capacity ?? "—",
    owner: row.owner ?? "—",
    operator: row.operator ?? "—",
    classification: row.classification ?? "—",
    gasMgmt1: row.gas_mgmt_1 ?? "—",
    gasMgmt2: row.gas_mgmt_2 ?? "N/A",
    status: row.status ?? "Active",
    createdById: row.created_by ?? undefined,
    isSisterShip: Boolean(row.is_sister_ship),
    referenceVesselId: row.reference_vessel_id == null ? undefined : Number(row.reference_vessel_id),
    sisterShipStatus: row.sister_ship_status ?? "none",
    sisterShipVerifiedById: row.sister_ship_verified_by ?? undefined,
    sisterShipVerifiedAt: row.sister_ship_verified_at ?? undefined,
    sisterReferenceStudyId: row.sister_reference_study_id ?? undefined,
  };
}

function vesselToRow(vessel: AnyVessel) {
  return {
    ...(vessel.id ? { id: vessel.id } : {}),
    name: vessel.name,
    imo: vessel.imo || null,
    call_sign: vessel.callSign || null,
    flag: vessel.flag || null,
    port_of_registry: vessel.portOfRegistry || null,
    year_built: vessel.year || null,
    vessel_type: vessel.type || null,
    capacity: vessel.capacity || null,
    owner: vessel.owner || null,
    operator: vessel.operator || null,
    classification: vessel.classification || null,
    gas_mgmt_1: vessel.gasMgmt1 || null,
    gas_mgmt_2: vessel.gasMgmt2 || null,
    status: vessel.status || "Active",
    created_by: vessel.createdById || null,
    is_sister_ship: Boolean(vessel.isSisterShip),
    reference_vessel_id: vessel.referenceVesselId ?? null,
    sister_ship_status: vessel.sisterShipStatus ?? (vessel.isSisterShip ? "pending" : "none"),
    sister_ship_verified_by: vessel.sisterShipVerifiedById ?? null,
    sister_ship_verified_at: vessel.sisterShipVerifiedAt ?? null,
    sister_reference_study_id: vessel.sisterReferenceStudyId ?? null,
  };
}

function studyCoreToRow(study: AnyStudy) {
  return {
    id: study.id,
    vessel_id: study.vesselId,
    vessel_name: study.vesselName,
    status: study.status,
    initiated_by_id: study.initiatedById,
    initiated_by_name: study.initiatedByName,
    initiated_by_role: study.initiatedByRole ?? null,
    initiated_at: study.initiatedAt,
    submitted_at: study.submittedAt ?? null,
    submitted_by_id: study.submittedById ?? null,
    submitted_by_name: study.submittedByName ?? null,
    reviewed_by_id: study.reviewedById ?? null,
    reviewed_by_name: study.reviewedByName ?? null,
    approved_at: study.approvedAt ?? null,
    edit_requested_by_id: study.editRequestedById ?? null,
    edit_requested_by_name: study.editRequestedByName ?? null,
    edit_requested_at: study.editRequestedAt ?? null,
    items: study.items ?? [],
    ship_notes: study.shipNotes ?? "",
    terminal_notes: study.terminalNotes ?? "",
    updated_at: new Date().toISOString(),
  };
}

export async function getSession() {
  if (!supabaseConfigured) return null;
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const client = requireSupabase();
  return client.auth.onAuthStateChange(callback);
}

export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(opts: {
  email: string;
  password: string;
  fullName: string;
  company: string;
  role: "terminal_officer" | "ship_officer" | "viewer";
}) {
  assertPasswordPolicy(opts.password);
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: opts.email,
    password: opts.password,
    options: {
      data: {
        full_name: opts.fullName,
        company: opts.company,
        role: opts.role,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabaseConfigured) return;
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
}

/**
 * Verify the TokenHash from the custom Reset Password email only after the user
 * explicitly confirms the reset inside the application. This avoids corporate
 * email link scanners consuming Supabase's one-time ConfirmationURL on preview.
 */
export async function verifyPasswordRecoveryLink(tokenHash: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(password: string) {
  assertPasswordPolicy(password);
  const client = requireSupabase();
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

/**
 * Password recovery without SMTP/email. The request is created through a
 * Supabase Edge Function so no service-role credential is ever exposed in the
 * browser. An administrator must approve the request before the requester can
 * set a new password.
 */
export async function requestPasswordResetNoEmail(email: string) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("password-reset", {
    body: { action: "request", email },
  });
  if (error) throw error;
  if (!data?.requestId || !data?.resetToken) throw new Error("Unable to create password reset request.");
  return data as { requestId: string; resetToken: string; status: "pending" };
}

export async function checkPasswordResetStatus(requestId: string, resetToken: string) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("password-reset", {
    body: { action: "status", requestId, resetToken },
  });
  if (error) throw error;
  return data as { status: "pending" | "approved" | "rejected" | "completed"; expiresAt?: string | null };
}

export async function completePasswordReset(requestId: string, resetToken: string, newPassword: string) {
  assertPasswordPolicy(newPassword);
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("password-reset", {
    body: { action: "complete", requestId, resetToken, newPassword },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.message || "Unable to update password.");
  return data as { ok: true };
}

export async function fetchPasswordResetRequests(): Promise<CloudPasswordResetRequest[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("password_reset_requests")
    .select("id,user_id,email,status,requested_at,approved_at,approved_by,completed_at,expires_at")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(passwordResetFromRow);
}

export async function updatePasswordResetRequestStatus(id: string, status: "approved" | "rejected") {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Administrator session not found.");

  const patch: Record<string, any> = {
    status,
    approved_by: userData.user.id,
    approved_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from("password_reset_requests")
    .update(patch)
    .eq("id", id)
    .select("id,user_id,email,status,requested_at,approved_at,approved_by,completed_at,expires_at")
    .single();
  if (error) throw error;
  return passwordResetFromRow(data);
}

export async function fetchMyProfile(userId?: string): Promise<CloudProfile | null> {
  const client = requireSupabase();
  let id = userId;
  if (!id) {
    const { data } = await client.auth.getUser();
    id = data.user?.id;
  }
  if (!id) return null;
  const { data, error } = await client.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? profileFromRow(data) : null;
}

export async function fetchProfiles(): Promise<CloudProfile[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("profiles").select("*").order("registered_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(profileFromRow);
}

export async function updateProfileStatus(id: string, status: "approved" | "rejected") {
  const client = requireSupabase();
  const { error } = await client
    .from("profiles")
    .update({ account_status: status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export type ManagedUserRole = "terminal_officer" | "ship_officer" | "viewer";

async function invokeManageUser(body: Record<string, unknown>) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("manage-user", { body });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Unable to manage user account.");
  return data;
}

export async function updateProfileRole(id: string, role: ManagedUserRole) {
  await invokeManageUser({ action: "change-role", userId: id, role });
}

export async function deleteUserAccount(id: string) {
  await invokeManageUser({ action: "delete-user", userId: id });
}

export async function fetchVesselAccesses(): Promise<CloudVesselAccess[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("vessel_access")
    .select("id,vessel_id,user_id,request_type,status,reason,requested_at,reviewed_at,reviewed_by,revoke_previous")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(vesselAccessFromRow);
}

export async function requestVesselAccess(opts: {
  vesselId: number;
  userId: string;
  requestType: "claim" | "additional" | "handover";
  reason?: string;
}): Promise<CloudVesselAccess> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("vessel_access")
    .insert({
      vessel_id: opts.vesselId,
      user_id: opts.userId,
      request_type: opts.requestType,
      status: "pending",
      reason: opts.reason?.trim() || "",
    })
    .select("id,vessel_id,user_id,request_type,status,reason,requested_at,reviewed_at,reviewed_by,revoke_previous")
    .single();
  if (error) throw error;
  return vesselAccessFromRow(data);
}

export async function reviewVesselAccess(opts: {
  requestId: string;
  status: "approved" | "rejected";
  revokePrevious?: boolean;
}): Promise<CloudVesselAccess> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("review_vessel_access", {
    p_request_id: opts.requestId,
    p_status: opts.status,
    p_revoke_previous: Boolean(opts.revokePrevious),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Vessel access request was not found.");
  return vesselAccessFromRow(row);
}

export async function fetchVessels(): Promise<AnyVessel[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("vessels").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(vesselFromRow);
}

export async function createVessel(vessel: AnyVessel): Promise<AnyVessel> {
  const client = requireSupabase();
  const row = vesselToRow(vessel);
  // Let Postgres generate the ID unless the caller deliberately supplied one.
  if (String(vessel.id ?? "").startsWith("local-")) delete row.id;
  const { data, error } = await client.from("vessels").insert(row).select("*").single();
  if (error) throw error;
  return vesselFromRow(data);
}

export async function renameVesselEverywhere(vesselId: number, newName: string): Promise<AnyVessel> {
  const client = requireSupabase();
  const normalizedName = newName.trim();
  if (!normalizedName) throw new Error("Vessel name is required.");

  const { error: renameError } = await client.rpc("rename_vessel_everywhere", {
    p_vessel_id: vesselId,
    p_new_name: normalizedName,
  });
  if (renameError) throw renameError;

  const { data, error } = await client
    .from("vessels")
    .select("*")
    .eq("id", vesselId)
    .single();
  if (error) throw error;
  return vesselFromRow(data);
}

export async function updateSisterShipVerification(opts: {
  vesselId: number;
  status: "pending" | "verified" | "rejected";
  referenceStudyId?: string | null;
  verifiedById?: string | null;
}): Promise<AnyVessel> {
  const client = requireSupabase();
  const verified = opts.status === "verified";
  const { data, error } = await client
    .from("vessels")
    .update({
      sister_ship_status: opts.status,
      sister_reference_study_id: verified ? (opts.referenceStudyId ?? null) : null,
      sister_ship_verified_by: verified ? (opts.verifiedById ?? null) : null,
      sister_ship_verified_at: verified ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.vesselId)
    .select("*")
    .single();
  if (error) throw error;
  return vesselFromRow(data);
}

export async function fetchApprovedSisterReferenceVesselIds(): Promise<number[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("list_approved_sister_reference_vessels");
  if (error) throw error;
  return (data ?? []).map((row: any) => Number(row.vessel_id));
}


export async function fetchStudies(defaults: Record<string, () => any>): Promise<AnyStudy[]> {
  const client = requireSupabase();

  const { data: studyRows, error: studyError } = await client
    .from("sscs_studies")
    .select("*")
    .order("initiated_at", { ascending: false });

  if (studyError) throw studyError;

  // Load all study sections in pages to avoid the 1,000-row limit.
  const PAGE_SIZE = 500;
  const sectionRows: Array<{
    study_id: string;
    section_key: string;
    data: any;
  }> = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data: page, error: sectionError } = await client
      .from("study_sections")
      .select("study_id, section_key, data")
      .order("study_id", { ascending: true })
      .order("section_key", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (sectionError) throw sectionError;

    sectionRows.push(...(page ?? []));

    if ((page?.length ?? 0) < PAGE_SIZE) break;
  }

  console.info(
    `[SSCS] Loaded ${studyRows?.length ?? 0} studies and ${sectionRows.length} study sections`
  );

  const sectionsByStudy = new Map<string, Record<string, any>>();
  for (const row of sectionRows ?? []) {
    const current = sectionsByStudy.get(row.study_id) ?? {};
    current[row.section_key] = row.data;
    sectionsByStudy.set(row.study_id, current);
  }

  return (studyRows ?? []).map((row: any) => {
    const sections = sectionsByStudy.get(row.id) ?? {};
    const result: AnyStudy = {
      id: row.id,
      vesselId: Number(row.vessel_id),
      vesselName: row.vessel_name,
      status: row.status,
      initiatedById: row.initiated_by_id,
      initiatedByName: row.initiated_by_name,
      initiatedByRole: row.initiated_by_role ?? undefined,
      initiatedAt: row.initiated_at,
      submittedAt: row.submitted_at ?? undefined,
      submittedById: row.submitted_by_id ?? undefined,
      submittedByName: row.submitted_by_name ?? undefined,
      reviewedById: row.reviewed_by_id ?? undefined,
      reviewedByName: row.reviewed_by_name ?? undefined,
      approvedAt: row.approved_at ?? undefined,
      editRequestedById: row.edit_requested_by_id ?? undefined,
      editRequestedByName: row.edit_requested_by_name ?? undefined,
      editRequestedAt: row.edit_requested_at ?? undefined,
      items: Array.isArray(row.items) ? row.items : [],
      shipNotes: row.ship_notes ?? "",
      terminalNotes: row.terminal_notes ?? "",
    };
    for (const [sectionKey, property] of SECTION_KEYS) {
      result[property] = sections[sectionKey] ?? defaults[property]?.() ?? {};
    }
    return result;
  });
}

export async function markStudyFeedbackCorrected(studyId: string): Promise<Record<string, any>> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("ship_mark_feedback_corrected", {
    target_study_id: studyId,
  });
  if (error) throw error;
  return (data ?? {}) as Record<string, any>;
}

export async function saveStudy(
  study: AnyStudy,
  updatedBy?: string,
  options?: { sectionKeys?: string[]; updateCore?: boolean },
) {
  const client = requireSupabase();
  const coreRow = studyCoreToRow(study);
  const allSectionRows = SECTION_KEYS.map(([sectionKey, property]) => ({
    study_id: study.id,
    section_key: sectionKey,
    data: study[property] ?? {},
    updated_by: updatedBy ?? null,
    updated_at: new Date().toISOString(),
  }));
  const sectionRows = options?.sectionKeys
    ? allSectionRows.filter(row => options.sectionKeys!.includes(row.section_key))
    : allSectionRows;

  const { data: existing, error: lookupError } = await client
    .from("sscs_studies")
    .select("id, status")
    .eq("id", study.id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (!existing) {
    const { error: insertError } = await client.from("sscs_studies").insert(coreRow);
    if (insertError) throw insertError;
    const { error: sectionError } = await client.from("study_sections").insert(sectionRows);
    if (sectionError) throw sectionError;
    return;
  }

  // Submitted-feedback correction is a partial save: Ship Officer may only
  // change the parts selected by the Terminal Officer while the parent study
  // remains Submitted. RLS migration 009 enforces the same scope server-side.
  if (options) {
    if (options.updateCore) {
      const { error: updateError } = await client.from("sscs_studies").update(coreRow).eq("id", study.id);
      if (updateError) throw updateError;
    }
    if (sectionRows.length > 0) {
      const { error: sectionError } = await client.from("study_sections").upsert(sectionRows, { onConflict: "study_id,section_key" });
      if (sectionError) throw sectionError;
    }
    return;
  }

  // When a ship officer submits a study, write the section payload while the parent
  // is still editable, then transition the parent row to submitted. This keeps RLS
  // strict: a submitted study cannot be altered by the ship afterwards.
  const locksShipEditing = study.status === "submitted" && existing.status !== "submitted";
  if (locksShipEditing) {
    const { error: sectionError } = await client.from("study_sections").upsert(sectionRows, { onConflict: "study_id,section_key" });
    if (sectionError) throw sectionError;
    const { error: updateError } = await client.from("sscs_studies").update(coreRow).eq("id", study.id);
    if (updateError) throw updateError;
    return;
  }

  // Requesting edit from an approved study only changes workflow metadata. Once the
  // row becomes edit_requested the ship must not be allowed to rewrite section data.
  if (study.status === "edit_requested" && existing.status === "approved") {
    const { error: updateError } = await client.from("sscs_studies").update(coreRow).eq("id", study.id);
    if (updateError) throw updateError;
    return;
  }

  // Approval is the final content lock. Persist all review-time section changes
  // while the parent row is still Submitted/Editing, then move the parent to
  // Approved. Migration 010 makes Approved study content read-only for every role.
  // Returning an edit request to Approved does not rewrite section data.
  if (study.status === "approved" && existing.status !== "approved") {
    if (existing.status === "submitted" || existing.status === "editing") {
      const { error: sectionError } = await client.from("study_sections").upsert(sectionRows, { onConflict: "study_id,section_key" });
      if (sectionError) throw sectionError;
    }
    const { error: updateError } = await client.from("sscs_studies").update(coreRow).eq("id", study.id);
    if (updateError) throw updateError;
    return;
  }

  const { error: updateError } = await client.from("sscs_studies").update(coreRow).eq("id", study.id);
  if (updateError) throw updateError;
  const { error: sectionError } = await client.from("study_sections").upsert(sectionRows, { onConflict: "study_id,section_key" });
  if (sectionError) throw sectionError;
}

export async function uploadStudyDocument(opts: {
  studyId: string;
  docKey: string;
  file: File;
  userId: string;
}): Promise<CloudUploadedFile> {
  const client = requireSupabase();
  const id = crypto.randomUUID();
  const safeName = opts.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const storagePath = `${opts.studyId}/${opts.docKey}/${id}-${safeName}`;
  const { error: uploadError } = await client.storage
    .from("sscs-documents")
    .upload(storagePath, opts.file, { upsert: false, contentType: opts.file.type || undefined });
  if (uploadError) throw uploadError;

  const uploadedAt = new Date().toISOString();
  const { error: metadataError } = await client.from("documents").insert({
    id,
    study_id: opts.studyId,
    document_type: opts.docKey,
    file_name: opts.file.name,
    storage_path: storagePath,
    mime_type: opts.file.type || null,
    file_size: opts.file.size,
    uploaded_by: opts.userId,
    created_at: uploadedAt,
  });
  if (metadataError) {
    await client.storage.from("sscs-documents").remove([storagePath]);
    throw metadataError;
  }

  return {
    id,
    name: opts.file.name,
    size: opts.file.size,
    type: opts.file.type,
    uploadedAt,
    storagePath,
  };
}


export async function uploadGeneratedStudyDocument(opts: {
  studyId: string;
  docKey: string;
  fileName: string;
  bytes: Uint8Array;
  mimeType: string;
  userId: string;
}): Promise<CloudUploadedFile> {
  const file = new File(
    [opts.bytes],
    opts.fileName,
    { type: opts.mimeType }
  );

  return uploadStudyDocument({
    studyId: opts.studyId,
    docKey: opts.docKey,
    file,
    userId: opts.userId,
  });
}

export async function replaceSisterSharedDocument(opts: {
  vesselId: number;
  docKey: string;
  files: CloudUploadedFile[];
}): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc("replace_sister_shared_document", {
    target_vessel_id: opts.vesselId,
    target_document_type: opts.docKey,
    replacement_files: opts.files,
  });
  if (error) throw error;
}
export interface ApprovalDocument {
  id: string;
  studyId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
  createdAt?: string;
}

export async function fetchApprovalDocuments(
  studyId: string
): Promise<ApprovalDocument[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("documents")
    .select(
      "id, study_id, document_type, file_name, storage_path, mime_type, file_size, created_at"
    )
    .eq("study_id", studyId)
    .in("document_type", [
      "approval_confirmation_list",
      "approval_compatibility_checklist",
    ])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    studyId: row.study_id,
    documentType: row.document_type,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  }));
}
export async function getStudyDocumentUrl(storagePath: string) {
  const client = requireSupabase();
  const { data, error } = await client.storage.from("sscs-documents").createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteStudyDocument(file: CloudUploadedFile) {
  if (!file.storagePath) return;
  const client = requireSupabase();
  const [{ error: storageError }, { error: metadataError }] = await Promise.all([
    client.storage.from("sscs-documents").remove([file.storagePath]),
    client.from("documents").delete().eq("id", file.id),
  ]);
  if (storageError) throw storageError;
  if (metadataError) throw metadataError;
}


// Ship Series are independent of the legacy sister-ship verification/approval workflow.
export type ShipSeries = { id: string; name: string; representativeVesselId: number; notes: string; members: number[] };
export type SeriesDocument = CloudUploadedFile & { seriesId: string; docKey: string; sourceDocumentId?: string | null };
export type RepresentativeDocument = CloudUploadedFile & { studyId: string; docKey: string };

export async function fetchShipSeries(): Promise<ShipSeries[]> {
  const client = requireSupabase();
  const [{ data: groups, error: groupError }, { data: members, error: memberError }] = await Promise.all([
    client.from('ship_series').select('id,name,representative_vessel_id,notes').order('name'),
    client.from('ship_series_members').select('series_id,vessel_id'),
  ]);
  if (groupError) throw groupError;
  if (memberError) throw memberError;
  return (groups ?? []).map((g: any) => ({
    id: g.id, name: g.name, representativeVesselId: Number(g.representative_vessel_id),
    notes: g.notes ?? '',
    members: (members ?? []).filter((m: any) => m.series_id === g.id).map((m: any) => Number(m.vessel_id)),
  }));
}

export async function createShipSeries(opts: { name: string; representativeVesselId: number; notes?: string }): Promise<void> {
  const { error } = await requireSupabase().rpc('admin_create_ship_series', {
    p_name: opts.name.trim(), p_representative_vessel_id: opts.representativeVesselId,
    p_notes: opts.notes?.trim() ?? '',
  });
  if (error) throw error;
}

export async function updateShipSeriesMembers(seriesId: string, vesselIds: number[]): Promise<void> {
  const { error } = await requireSupabase().rpc('admin_set_ship_series_members', {
    p_series_id: seriesId, p_vessel_ids: vesselIds,
  });
  if (error) throw error;
}


/** Admin-only atomic import. Existing vessels are reused by IMO / normalized name. */
export async function importShipSeriesVessels(seriesId: string, rows: Array<{name:string;imo?:string}>): Promise<void> {
  if (!rows.length) throw new Error('Enter at least one vessel.');
  const { error } = await requireSupabase().rpc('admin_import_ship_series_vessels', {
    p_series_id: seriesId, p_rows: rows,
  });
  if (error) throw error;
}

/** Fills an incomplete vessel without creating or modifying its Study. */
export async function completeSeriesPlaceholderVessel(vesselId: number, details: {
  imo:string;flag:string;capacity:string;yearBuilt:number;
}): Promise<void> {
  const { error } = await requireSupabase().rpc('admin_complete_series_placeholder_vessel', {
    p_vessel_id: vesselId, p_imo: details.imo, p_flag: details.flag,
    p_capacity: details.capacity, p_year_built: details.yearBuilt,
  });
  if (error) throw error;
}

/** Admin confirms a placeholder by IMO alone; all other vessel fields and Studies remain untouched. */
export async function confirmSeriesPlaceholderImo(vesselId: number, imo: string): Promise<void> {
  const normalizedImo = imo.trim().replace(/^IMO\s*/i, "");
  if (!/^\d{7}$/.test(normalizedImo)) throw new Error("IMO must contain exactly 7 digits.");
  const { error } = await requireSupabase().rpc("admin_confirm_series_placeholder_imo", {
    p_vessel_id: vesselId,
    p_imo: normalizedImo,
  });
  if (error) {
    if (error.code === "PGRST202" || error.code === "42883" || /could not find the function|does not exist/i.test(error.message ?? "")) {
      throw new Error("Supabase SQL function admin_confirm_series_placeholder_imo is missing. Run 01_confirm_imo_only.sql in Supabase SQL Editor, then retry.");
    }
    throw error;
  }
}

export async function renameShipSeries(seriesId: string, name: string, notes: string): Promise<void> {
  const { error } = await requireSupabase().from('ship_series')
    .update({ name: name.trim(), notes: notes.trim() }).eq('id', seriesId);
  if (error) throw error;
}

export async function fetchSeriesDocuments(): Promise<SeriesDocument[]> {
  const { data, error } = await requireSupabase().from('ship_series_documents')
    .select('id,series_id,doc_key,file_name,file_size,mime_type,storage_path,created_at,source_document_id')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d: any) => ({
    id: d.id, seriesId: d.series_id, docKey: d.doc_key, name: d.file_name,
    size: d.file_size ?? 0, type: d.mime_type ?? '', uploadedAt: d.created_at,
    storagePath: d.storage_path, sourceDocumentId: d.source_document_id ?? null,
  }));
}

export async function uploadSeriesDocument(seriesId: string, docKey: string, file: File, statementConfirmed = false): Promise<void> {
  if (docKey === 'd_6_1' && !statementConfirmed) throw new Error('Admin must confirm the statement covers the series before upload.');
  const client = requireSupabase();
  const id = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
  const path = `ship-series/${seriesId}/${docKey}/${id}-${safeName}`;
  const { error: uploadError } = await client.storage.from('sscs-documents')
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (uploadError) throw uploadError;
  const { error } = await client.from('ship_series_documents').insert({
    id, series_id: seriesId, doc_key: docKey, file_name: file.name,
    file_size: file.size, mime_type: file.type || null, storage_path: path,
    ...(docKey === 'd_6_1' ? { statement_coverage_confirmed: statementConfirmed } : {}),
  });
  if (error) {
    await client.storage.from('sscs-documents').remove([path]);
    throw error;
  }
}

// Remove only the reference; the original Storage blob is deliberately retained for audit.
export async function unlinkSeriesDocument(id: string): Promise<void> {
  const { error } = await requireSupabase().from('ship_series_documents').delete().eq('id', id);
  if (error) throw error;
}

// Reuse an existing document from an APPROVED study of the series representative.
// No storage copies, no updates to old approved studies.
const APPROVED_SERIES_DOC_KEYS = ["d_2_1","d_2_2","d_2_3","d_2_4","d_2_5","d_3_1","d_3_2","d_3_3","d_3_4","d_4_1","d_4_2","d_6_1"];
export async function fetchRepresentativeApprovedDocuments(representativeVesselId: number): Promise<RepresentativeDocument[]> {
  const client = requireSupabase();
  const { data: studies, error: studiesError } = await client.from('sscs_studies')
    .select('id').eq('vessel_id', representativeVesselId).eq('status', 'approved');
  if (studiesError) throw studiesError;
  const studyIds = (studies ?? []).map((s: any) => s.id);
  if (!studyIds.length) return [];
  const { data, error } = await client.from('documents')
    .select('id,study_id,document_type,file_name,file_size,mime_type,storage_path,created_at')
    .in('study_id', studyIds).in('document_type', APPROVED_SERIES_DOC_KEYS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d: any) => ({
    id: d.id, studyId: d.study_id, docKey: d.document_type, name: d.file_name,
    size: Number(d.file_size ?? 0), type: d.mime_type ?? '',
    uploadedAt: d.created_at, storagePath: d.storage_path,
  }));
}

export async function linkExistingSeriesDocument(seriesId: string, documentId: string): Promise<void> {
  // The RPC validates admin rights, approved status, representative vessel, and allowed doc key.
  const { error } = await requireSupabase().rpc('admin_link_series_reference_document', {
    p_series_id: seriesId, p_document_id: documentId,
  });
  if (error) throw error;
}

/** Link shared slots from the representative's latest approved Study in one action. */
export async function linkAvailableRepresentativeDocuments(seriesId: string): Promise<number> {
  const { data, error } = await requireSupabase().rpc('admin_link_all_series_reference_documents', {
    p_series_id: seriesId,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

/** 6.1 is deliberately excluded from bulk links: each Statement needs explicit Admin approval. */
export async function linkConfirmedSeriesStatement(seriesId: string, documentId: string, confirmed: boolean): Promise<void> {
  if (!confirmed) throw new Error('Confirm that this Sister Ship Statement covers all series members.');
  const { error } = await requireSupabase().rpc('admin_link_confirmed_series_statement', {
    p_series_id: seriesId, p_document_id: documentId, p_confirm_coverage: confirmed,
  });
  if (error) throw error;
}

// Vessel approval history V6: only real transitions into approved from existing audit_logs.
export interface VesselApprovalEvent {
  id: number;
  vesselId: number;
  studyId: string;
  approvedAt: string;
  userId: string | null;
}

export async function fetchVesselApprovalEvents(): Promise<VesselApprovalEvent[]> {
  const client = requireSupabase();
  const events: VesselApprovalEvent[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("audit_logs")
      .select("id,user_id,entity_id,details,created_at")
      .eq("action", "study_status_changed")
      .order("id", { ascending: true })
      .range(offset, offset + 499);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.details?.new_status !== "approved") continue;
      const vesselId = Number(row.details?.vessel_id);
      if (!Number.isSafeInteger(vesselId)) continue;
      events.push({ id: Number(row.id), vesselId, studyId: row.entity_id ?? "",
        approvedAt: row.created_at, userId: row.user_id ?? null });
    }
    if ((data?.length ?? 0) < 500) break;
  }
  return events;
}

export async function fetchVesselFirstApprovalOverrides(): Promise<Record<number, string>> {
  const { data, error } = await requireSupabase()
    .from("vessel_first_approval_overrides")
    .select("vessel_id,first_approval_date");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map(row => [Number(row.vessel_id), String(row.first_approval_date)]));
}

export async function saveVesselFirstApprovalOverride(vesselId: number, date: string, userId: string): Promise<void> {
  if (!Number.isSafeInteger(vesselId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid vessel or approval date.");
  const { error } = await requireSupabase().from("vessel_first_approval_overrides").upsert({
    vessel_id: vesselId, first_approval_date: date, updated_at: new Date().toISOString(), updated_by: userId,
  }, { onConflict: "vessel_id" });
  if (error) throw error;
}
