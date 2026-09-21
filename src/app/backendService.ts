import { requireSupabase, supabaseConfigured } from "./supabaseClient";

export { supabaseConfigured };

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
    imo: row.imo,
    callSign: row.call_sign ?? "—",
    flag: row.flag ?? "—",
    portOfRegistry: row.port_of_registry ?? "—",
    year: Number(row.year_built ?? new Date().getFullYear()),
    type: row.vessel_type ?? "LNG Carrier",
    capacity: row.capacity ?? "—",
    owner: row.owner ?? "—",
    operator: row.operator ?? "—",
    classification: row.classification ?? "—",
    gasMgmt1: row.gas_mgmt_1 ?? "—",
    gasMgmt2: row.gas_mgmt_2 ?? "N/A",
    status: row.status ?? "Active",
    createdById: row.created_by ?? undefined,
  };
}

function vesselToRow(vessel: AnyVessel) {
  return {
    ...(vessel.id ? { id: vessel.id } : {}),
    name: vessel.name,
    imo: vessel.imo,
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
 * Verify the 6-digit token generated by Supabase's Reset Password email.
 * The hosted project's Reset Password email template must render {{ .Token }}.
 * A successful recovery verification creates the temporary authenticated session
 * required by updateUser() to set the new password.
 */
export async function verifyPasswordRecoveryOtp(email: string, token: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return data;
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

export async function fetchStudies(defaults: Record<string, () => any>): Promise<AnyStudy[]> {
  const client = requireSupabase();
  const [{ data: studyRows, error: studyError }, { data: sectionRows, error: sectionError }] = await Promise.all([
    client.from("sscs_studies").select("*").order("initiated_at", { ascending: false }),
    client.from("study_sections").select("study_id, section_key, data"),
  ]);
  if (studyError) throw studyError;
  if (sectionError) throw sectionError;

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

export async function saveStudy(study: AnyStudy, updatedBy?: string) {
  const client = requireSupabase();
  const coreRow = studyCoreToRow(study);
  const sectionRows = SECTION_KEYS.map(([sectionKey, property]) => ({
    study_id: study.id,
    section_key: sectionKey,
    data: study[property] ?? {},
    updated_by: updatedBy ?? null,
    updated_at: new Date().toISOString(),
  }));

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
