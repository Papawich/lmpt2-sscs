import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, Upload, X } from "lucide-react";
import type { RequiredDocumentsData, UploadedFile } from "./RequiredDocumentsSection";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CertificateAssessmentRow {
  issueDate: string;
  validDate: string;
}

export interface InspectionAssessmentRow {
  date: string;
  place: string;
  by: string;
  notApplicable?: boolean;
}

export interface QualityCertificateEvidence {
  shipSanitation: UploadedFile[];
  /** Expired date that opened the current P&I replacement cycle. */
  pAndIInvalidValidDate?: string;
  /** Expired date that opened the current Ship Sanitation replacement cycle. */
  shipSanitationInvalidValidDate?: string;
  pAndIReplacementRequired?: boolean;
  shipSanitationReplacementRequired?: boolean;
}

export interface QualityAssessmentData {
  certificates: {
    registry: CertificateAssessmentRow;
    classCertificate: CertificateAssessmentRow;
    pAndI: CertificateAssessmentRow;
    certificateOfFitness: CertificateAssessmentRow;
    documentOfCompliance: CertificateAssessmentRow;
    safetyManagement: CertificateAssessmentRow;
    tonnage: CertificateAssessmentRow;
    loadLine: CertificateAssessmentRow;
    cargoShipSafety: CertificateAssessmentRow;
    pollutionPrevention: CertificateAssessmentRow;
    shipSecurity: CertificateAssessmentRow;
    shipSanitation: CertificateAssessmentRow;
  };
  inspections: {
    portState: InspectionAssessmentRow;
    flagState: InspectionAssessmentRow;
    sire: InspectionAssessmentRow;
  };
  certificateEvidence?: QualityCertificateEvidence;
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

const MONTH_INDEX: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Normalize stored/legacy values to ISO YYYY-MM-DD.
 * New entries from the date picker are already saved in this format.
 */
function normalizeDateValue(value: string): string {
  const raw = value.trim();
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return isValidCalendarDate(year, month, day) ? `${year}-${pad2(month)}-${pad2(day)}` : "";
  }

  // Legacy values such as "23 Aug 2024".
  const namedMonth = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (namedMonth) {
    const day = Number(namedMonth[1]);
    const month = MONTH_INDEX[namedMonth[2].toLowerCase()];
    const year = Number(namedMonth[3]);
    if (month && isValidCalendarDate(year, month, day)) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  // Legacy numeric values such as DD/MM/YYYY or DD-MM-YYYY.
  const numeric = raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    const year = Number(numeric[3]);
    if (isValidCalendarDate(year, month, day)) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return "";
}

function todayLocalISO(): string {
  const today = new Date();
  return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
}

/** A certificate is invalid once its Valid Date is before today. */
function isExpiredDate(value: string): boolean {
  const iso = normalizeDateValue(value);
  return !!iso && iso < todayLocalISO();
}

function formatDisplayDate(value: string): string {
  const iso = normalizeDateValue(value);
  if (!iso) return value || "—";
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

// ─── Defaults / completion ────────────────────────────────────────────────────

const blankCertificate = (): CertificateAssessmentRow => ({ issueDate: "", validDate: "" });
const blankInspection = (): InspectionAssessmentRow => ({ date: "", place: "", by: "", notApplicable: false });

export function defaultQualityAssessmentData(): QualityAssessmentData {
  return {
    certificates: {
      registry: blankCertificate(),
      classCertificate: blankCertificate(),
      pAndI: blankCertificate(),
      certificateOfFitness: blankCertificate(),
      documentOfCompliance: blankCertificate(),
      safetyManagement: blankCertificate(),
      tonnage: blankCertificate(),
      loadLine: blankCertificate(),
      cargoShipSafety: blankCertificate(),
      pollutionPrevention: blankCertificate(),
      shipSecurity: blankCertificate(),
      shipSanitation: blankCertificate(),
    },
    inspections: {
      portState: blankInspection(),
      flagState: blankInspection(),
      sire: blankInspection(),
    },
    certificateEvidence: { shipSanitation: [] },
  };
}

const PERMANENT_KEYS = new Set<CertificateKey>(["registry", "tonnage"]);

/** Return the number of non-permanent certificates whose Valid Date is before today. */
export function getInvalidCertificateCount(data: QualityAssessmentData | undefined): number {
  if (!data) return 0;
  return (Object.keys(data.certificates) as CertificateKey[]).filter(key => {
    if (PERMANENT_KEYS.has(key)) return false;
    return isExpiredDate(data.certificates[key]?.validDate ?? "");
  }).length;
}

/** Return the number of non-permanent certificates expiring from today through N days ahead. */
export function getExpiringCertificateCount(data: QualityAssessmentData | undefined, daysAhead = 90): number {
  if (!data) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + daysAhead);

  return (Object.keys(data.certificates) as CertificateKey[]).filter(key => {
    if (PERMANENT_KEYS.has(key)) return false;
    const iso = normalizeDateValue(data.certificates[key]?.validDate ?? "");
    if (!iso) return false;
    const [year, month, day] = iso.split("-").map(Number);
    const expiry = new Date(year, month - 1, day);
    return expiry >= today && expiry <= limit;
  }).length;
}

export function isQualityAssessmentComplete(
  data: QualityAssessmentData | undefined,
  requiredDocuments?: RequiredDocumentsData,
): boolean {
  const d = data ?? defaultQualityAssessmentData();
  const certificateComplete = (Object.keys(d.certificates) as CertificateKey[]).every(key => {
    const row = d.certificates[key];
    if (!row.issueDate.trim()) return false;
    if (PERMANENT_KEYS.has(key)) return true;
    return !!row.validDate.trim() && !isExpiredDate(row.validDate);
  });
  const inspectionComplete = (Object.values(d.inspections) as InspectionAssessmentRow[]).every(
    row => Boolean(row.notApplicable) || (!!row.date.trim() && !!row.place.trim() && !!row.by.trim())
  );
  const evidence = d.certificateEvidence ?? { shipSanitation: [] };
  const pAndIRecordedUpdate = Boolean(
    requiredDocuments?.qualityUpdateFlags?.pAndIFileId
    && (requiredDocuments?.d_7_1 ?? []).some(file => file.id === requiredDocuments.qualityUpdateFlags?.pAndIFileId)
  );
  const pAndIReplacementComplete = !evidence.pAndIReplacementRequired
    && (!evidence.pAndIInvalidValidDate || pAndIRecordedUpdate);
  const sanitationReplacementComplete = !evidence.shipSanitationReplacementRequired
    && (!evidence.shipSanitationInvalidValidDate || evidence.shipSanitation.length > 0);
  return certificateComplete && inspectionComplete && pAndIReplacementComplete && sanitationReplacementComplete;
}

// ─── Definitions ──────────────────────────────────────────────────────────────

type CertificateKey = keyof QualityAssessmentData["certificates"];
type InspectionKey = keyof QualityAssessmentData["inspections"];

interface CertificateDefinition {
  key: CertificateKey;
  label: string;
  permanent?: boolean;
  note?: string;
}

const CERTIFICATE_ROWS: CertificateDefinition[] = [
  { key: "registry", label: "Certificate of Registry", permanent: true },
  { key: "classCertificate", label: "Certificate of Class" },
  { key: "pAndI", label: "Certificate of Entry (P&I Certificate)" },
  { key: "certificateOfFitness", label: "International Certificate of Fitness for the Carriage of Liquefied Gases in Bulk" },
  { key: "documentOfCompliance", label: "Document of Compliance (ISM Code)" },
  { key: "safetyManagement", label: "Safety Management Certificate" },
  { key: "tonnage", label: "International Tonnage Certificate (1969)", permanent: true },
  { key: "loadLine", label: "International Load Line Certificate" },
  {
    key: "cargoShipSafety",
    label: "Cargo Ship Safety Certificates",
    note: "Construction / Equipment / Radio",
  },
  {
    key: "pollutionPrevention",
    label: "MARPOL Pollution Prevention Certificates",
    note: "Oil / Sewage / Air",
  },
  { key: "shipSecurity", label: "International Ship Security Certificate (or Interim if any)" },
  { key: "shipSanitation", label: "Ship Sanitation Certificate" },
];

const INSPECTION_ROWS: { key: InspectionKey; label: string }[] = [
  { key: "portState", label: "Last inspection by Port State" },
  { key: "flagState", label: "Last inspection by Flag State" },
  { key: "sire", label: "Last inspection by SIRE inspector" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-yellow-100 border border-yellow-400 rounded px-2.5 py-1.5 text-sm text-blue-700 " +
  "placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 " +
  "transition-all font-mono";

const readOnlyClass = "font-mono text-sm text-foreground";


interface FixedDateInputProps {
  value: string;
  canEdit: boolean;
  onChange: (value: string) => void;
  invalid?: boolean;
}

function FixedDateInput({ value, canEdit, onChange, invalid = false }: FixedDateInputProps) {
  const normalized = normalizeDateValue(value);

  if (!canEdit) {
    return <span className={readOnlyClass}>{formatDisplayDate(value)}</span>;
  }

  return (
    <input
      type="date"
      value={normalized}
      onChange={event => onChange(event.target.value)}
      className={
        inputClass +
        (invalid
          ? " !border-red-500 !bg-red-50 !text-red-700 focus:!border-red-500 focus:!ring-red-300"
          : "")
      }
      aria-invalid={invalid || undefined}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  canEdit: boolean;
  data: QualityAssessmentData;
  onChange: (data: QualityAssessmentData) => void;
  requiredDocuments?: RequiredDocumentsData;
  onRequiredDocumentsChange?: (data: RequiredDocumentsData) => void;
  onQualityAndRequiredDocumentsChange?: (qualityData: QualityAssessmentData, requiredDocuments: RequiredDocumentsData) => void;
  onUploadFile?: (docKey: string, file: File) => Promise<UploadedFile>;
  onDeleteFile?: (file: UploadedFile) => Promise<void>;
  getDownloadUrl?: (file: UploadedFile) => Promise<string>;
}

type EvidenceTarget = "pAndI" | "shipSanitation";

export function QualityAssessmentSection({
  canEdit, data: dataProp, onChange, requiredDocuments, onRequiredDocumentsChange,
  onQualityAndRequiredDocumentsChange, onUploadFile, onDeleteFile, getDownloadUrl,
}: Props) {
  const data = dataProp ?? defaultQualityAssessmentData();
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const [evidenceTarget, setEvidenceTarget] = useState<EvidenceTarget | null>(null);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const sanitationEvidence = data.certificateEvidence?.shipSanitation ?? [];

  const uploadedAfterInvalidDate = (file: UploadedFile | undefined, invalidValidDate: string | undefined) => {
    if (!file?.uploadedAt || !invalidValidDate) return false;
    const iso = normalizeDateValue(invalidValidDate);
    if (!iso) return false;
    const [year, month, day] = iso.split("-").map(Number);
    const expiry = new Date(year, month - 1, day, 23, 59, 59, 999);
    const uploadedAt = new Date(file.uploadedAt);
    return !Number.isNaN(uploadedAt.getTime()) && uploadedAt.getTime() > expiry.getTime();
  };

  const pAndIUpdatedFile = () => {
    const fileId = requiredDocuments?.qualityUpdateFlags?.pAndIFileId;
    return (requiredDocuments?.d_7_1 ?? []).find(item => item.id === fileId);
  };

  // Latch an invalid certificate as soon as it is seen. The original expired date is
  // preserved as the replacement-cycle reference, so changing Valid Date later cannot
  // bypass the mandatory updated-certificate upload. Only an upload after that invalid
  // date can clear the requirement.
  useEffect(() => {
    if (!canEdit) return;
    const evidence = data.certificateEvidence ?? { shipSanitation: [] };
    const nextEvidence: QualityCertificateEvidence = { ...evidence };
    let changed = false;

    const pAndIInvalidDate = data.certificates.pAndI?.validDate ?? "";
    if (isExpiredDate(pAndIInvalidDate)) {
      const updatedFile = pAndIUpdatedFile();
      if (!uploadedAfterInvalidDate(updatedFile, pAndIInvalidDate)) {
        if (!evidence.pAndIReplacementRequired || evidence.pAndIInvalidValidDate !== pAndIInvalidDate) {
          nextEvidence.pAndIReplacementRequired = true;
          nextEvidence.pAndIInvalidValidDate = pAndIInvalidDate;
          changed = true;
        }
      }
    }

    const sanitationInvalidDate = data.certificates.shipSanitation?.validDate ?? "";
    if (isExpiredDate(sanitationInvalidDate)) {
      const updatedFile = sanitationEvidence[0];
      if (!uploadedAfterInvalidDate(updatedFile, sanitationInvalidDate)) {
        if (!evidence.shipSanitationReplacementRequired || evidence.shipSanitationInvalidValidDate !== sanitationInvalidDate) {
          nextEvidence.shipSanitationReplacementRequired = true;
          nextEvidence.shipSanitationInvalidValidDate = sanitationInvalidDate;
          changed = true;
        }
      }
    }

    if (changed) onChange({ ...data, certificateEvidence: nextEvidence });
  // Only certificate dates / replacement evidence open a new replacement cycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canEdit,
    data.certificates.pAndI?.validDate,
    data.certificates.shipSanitation?.validDate,
    requiredDocuments?.qualityUpdateFlags?.pAndIFileId,
    sanitationEvidence[0]?.id,
  ]);

  const setCertificate = (key: CertificateKey, field: keyof CertificateAssessmentRow, value: string) => {
    const currentRow = data.certificates[key] ?? blankCertificate();
    const evidence = data.certificateEvidence ?? { shipSanitation: [] };
    const nextEvidence: QualityCertificateEvidence = { ...evidence };

    if (field === "validDate" && (key === "pAndI" || key === "shipSanitation")) {
      const currentExpired = isExpiredDate(currentRow.validDate);
      const nextExpired = isExpiredDate(value);
      const invalidCycleDate = currentExpired ? currentRow.validDate : (nextExpired ? value : undefined);

      if (invalidCycleDate) {
        const updatedFile = key === "pAndI" ? pAndIUpdatedFile() : sanitationEvidence[0];
        const updateAlreadyUploaded = uploadedAfterInvalidDate(updatedFile, invalidCycleDate);
        if (!updateAlreadyUploaded) {
          if (key === "pAndI") {
            nextEvidence.pAndIReplacementRequired = true;
            nextEvidence.pAndIInvalidValidDate = invalidCycleDate;
          } else {
            nextEvidence.shipSanitationReplacementRequired = true;
            nextEvidence.shipSanitationInvalidValidDate = invalidCycleDate;
          }
        }
      }
    }

    onChange({
      ...data,
      certificates: {
        ...data.certificates,
        [key]: { ...currentRow, [field]: value },
      },
      certificateEvidence: nextEvidence,
    });
  };

  const setInspection = (key: InspectionKey, field: keyof InspectionAssessmentRow, value: string) => {
    onChange({
      ...data,
      inspections: {
        ...data.inspections,
        [key]: { ...data.inspections[key], [field]: value },
      },
    });
  };

  const setInspectionNotApplicable = (key: InspectionKey, checked: boolean) => {
    onChange({
      ...data,
      inspections: {
        ...data.inspections,
        [key]: checked
          ? { date: "", place: "", by: "", notApplicable: true }
          : { ...data.inspections[key], notApplicable: false },
      },
    });
  };

  function triggerEvidenceUpload(target: EvidenceTarget) {
    setEvidenceTarget(target);
    if (evidenceInputRef.current) {
      evidenceInputRef.current.value = "";
      evidenceInputRef.current.click();
    }
  }

  async function uploadLocalEvidence(file: File): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        dataUrl: reader.result as string,
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function replaceEvidence(target: EvidenceTarget, file: File) {
    const docKey = target === "pAndI" ? "d_7_1" : "quality_ship_sanitation";
    const uploaded = onUploadFile ? await onUploadFile(docKey, file) : await uploadLocalEvidence(file);

    if (target === "pAndI") {
      if (!requiredDocuments || !onRequiredDocumentsChange) {
        throw new Error("Required Documents data is unavailable.");
      }
      const previous = requiredDocuments.d_7_1 ?? [];
      if (onDeleteFile) {
        for (const oldFile of previous) {
          try { await onDeleteFile(oldFile); } catch (err) { console.warn("[P&I replacement cleanup failed]", err); }
        }
      }
      const nextRequiredDocuments: RequiredDocumentsData = {
        ...requiredDocuments,
        d_7_1: [uploaded],
        qualityUpdateFlags: {
          ...(requiredDocuments.qualityUpdateFlags ?? {}),
          pAndIFileId: uploaded.id,
          pAndIInvalidValidDate: data.certificateEvidence?.pAndIInvalidValidDate
            ?? data.certificates.pAndI?.validDate
            ?? "",
        },
      };
      const nextQualityData: QualityAssessmentData = {
        ...data,
        certificateEvidence: {
          ...(data.certificateEvidence ?? { shipSanitation: [] }),
          pAndIReplacementRequired: false,
          pAndIInvalidValidDate: data.certificateEvidence?.pAndIInvalidValidDate
            ?? data.certificates.pAndI?.validDate
            ?? "",
        },
      };
      if (onQualityAndRequiredDocumentsChange) {
        onQualityAndRequiredDocumentsChange(nextQualityData, nextRequiredDocuments);
      } else {
        onRequiredDocumentsChange(nextRequiredDocuments);
        onChange(nextQualityData);
      }
      return;
    }

    if (onDeleteFile) {
      for (const oldFile of sanitationEvidence) {
        try { await onDeleteFile(oldFile); } catch (err) { console.warn("[Sanitation replacement cleanup failed]", err); }
      }
    }
    onChange({
      ...data,
      certificateEvidence: {
        ...(data.certificateEvidence ?? { shipSanitation: [] }),
        shipSanitation: [uploaded],
        shipSanitationInvalidValidDate: data.certificateEvidence?.shipSanitationInvalidValidDate
          ?? data.certificates.shipSanitation?.validDate
          ?? "",
        shipSanitationReplacementRequired: false,
      },
    });
  }

  async function handleEvidenceFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const target = evidenceTarget;
    if (!file || !target) return;
    setEvidenceUploading(true);
    try {
      await replaceEvidence(target, file);
    } catch (err) {
      console.error("[Quality Assessment certificate upload failed]", err);
      window.alert(err instanceof Error ? err.message : "Certificate upload failed.");
    } finally {
      setEvidenceUploading(false);
      setEvidenceTarget(null);
    }
  }

  async function downloadEvidence(file: UploadedFile) {
    try {
      const href = getDownloadUrl ? await getDownloadUrl(file) : file.dataUrl;
      if (!href) throw new Error("This file has no downloadable source.");
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = file.name;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to download this document.");
    }
  }

  async function removeEvidence(target: EvidenceTarget, file: UploadedFile) {
    try {
      if (onDeleteFile) await onDeleteFile(file);
      if (target === "pAndI") {
        if (requiredDocuments && onRequiredDocumentsChange) {
          const nextRequiredDocuments: RequiredDocumentsData = {
            ...requiredDocuments,
            d_7_1: (requiredDocuments.d_7_1 ?? []).filter(item => item.id !== file.id),
            qualityUpdateFlags: {
              ...(requiredDocuments.qualityUpdateFlags ?? {}),
              pAndIFileId: requiredDocuments.qualityUpdateFlags?.pAndIFileId === file.id ? undefined : requiredDocuments.qualityUpdateFlags?.pAndIFileId,
              pAndIInvalidValidDate: requiredDocuments.qualityUpdateFlags?.pAndIFileId === file.id ? undefined : requiredDocuments.qualityUpdateFlags?.pAndIInvalidValidDate,
            },
          };
          const nextQualityData: QualityAssessmentData = {
            ...data,
            certificateEvidence: {
              ...(data.certificateEvidence ?? { shipSanitation: [] }),
              pAndIReplacementRequired: true,
            },
          };
          if (onQualityAndRequiredDocumentsChange) {
            onQualityAndRequiredDocumentsChange(nextQualityData, nextRequiredDocuments);
          } else {
            onRequiredDocumentsChange(nextRequiredDocuments);
            onChange(nextQualityData);
          }
        }
      } else {
        onChange({
          ...data,
          certificateEvidence: {
            ...(data.certificateEvidence ?? { shipSanitation: [] }),
            shipSanitation: sanitationEvidence.filter(item => item.id !== file.id),
            shipSanitationInvalidValidDate: data.certificateEvidence?.shipSanitationInvalidValidDate
              ?? data.certificates.shipSanitation?.validDate
              ?? "",
            shipSanitationReplacementRequired: true,
          },
        });
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to remove this document.");
    }
  }

  return (
    <div className="space-y-5 mb-6">
      <input
        ref={evidenceInputRef}
        type="file"
        className="hidden"
        onChange={handleEvidenceFile}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
      />
      <div className="border border-border rounded bg-card overflow-hidden">
        <div className="border-b border-border bg-secondary/30 px-5 py-3">
          <p className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">
            Quality Assessment
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            Part 12 — Statutory certificates and latest ship inspection records
          </p>
        </div>

        <div className="p-5 space-y-7">
          <div>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p className="font-mono text-xs font-bold text-foreground underline">1. Certificate Status</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">
                  Related certificates are grouped where they share the same survey / validity cycle.
                </p>
              </div>
              <div className="text-right">
                <span className="block font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                  Grey valid-date cells = Permanent
                </span>
                <span className="block font-mono text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                  Dates are stored as YYYY-MM-DD · Valid Date before today = INVALID
                </span>
              </div>
            </div>

            <div className="border border-border rounded overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="bg-yellow-300 text-gray-950 border-b border-border">
                    <th className="px-4 py-2.5 text-left font-bold w-[56%]">Document</th>
                    <th className="px-4 py-2.5 text-left font-bold w-[22%]">Issue Date</th>
                    <th className="px-4 py-2.5 text-left font-bold w-[22%]">Valid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {CERTIFICATE_ROWS.map((definition, index) => {
                    const row = data.certificates[definition.key] ?? blankCertificate();
                    return (
                      <tr key={definition.key} className={index < CERTIFICATE_ROWS.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-4 py-2.5 bg-secondary/30 align-middle">
                          <div className="text-sm text-foreground">{definition.label}</div>
                          {definition.note && (
                            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{definition.note}</div>
                          )}
                        </td>
                        <td className="px-3 py-1.5 align-middle">
                          <FixedDateInput
                            value={row.issueDate}
                            canEdit={canEdit}
                            onChange={value => setCertificate(definition.key, "issueDate", value)}
                          />
                        </td>
                        <td className={`px-3 py-1.5 align-middle ${definition.permanent ? "bg-gray-500/70" : ""}`}>
                          {definition.permanent ? (
                            <span className="font-mono text-xs font-bold text-white tracking-wide">PERMANENT</span>
                          ) : (
                            <div className="space-y-1.5">
                              <FixedDateInput
                                value={row.validDate}
                                canEdit={canEdit}
                                invalid={isExpiredDate(row.validDate)}
                                onChange={value => setCertificate(definition.key, "validDate", value)}
                              />
                              {!!row.validDate.trim() && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      "inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide " +
                                      (isExpiredDate(row.validDate)
                                        ? "bg-red-100 text-red-700 border border-red-300"
                                        : "bg-emerald-100 text-emerald-700 border border-emerald-300")
                                    }
                                  >
                                    {isExpiredDate(row.validDate) ? "INVALID" : "VALID"}
                                  </span>
                                  {isExpiredDate(row.validDate) && (
                                    <span className="font-mono text-[10px] text-red-600">Expired</span>
                                  )}
                                </div>
                              )}
                              {(definition.key === "pAndI" || definition.key === "shipSanitation") && (() => {
                                const target: EvidenceTarget = definition.key === "pAndI" ? "pAndI" : "shipSanitation";
                                const replacementFlag = target === "pAndI"
                                  ? Boolean(data.certificateEvidence?.pAndIReplacementRequired)
                                  : Boolean(data.certificateEvidence?.shipSanitationReplacementRequired);
                                const files = target === "pAndI" ? (requiredDocuments?.d_7_1 ?? []) : sanitationEvidence;
                                const candidateFile = files[0];
                                const recordedFile = target === "pAndI"
                                  ? (candidateFile && requiredDocuments?.qualityUpdateFlags?.pAndIFileId === candidateFile.id ? candidateFile : undefined)
                                  : candidateFile;
                                const invalidCycleDate = target === "pAndI"
                                  ? (data.certificateEvidence?.pAndIInvalidValidDate ?? (isExpiredDate(row.validDate) ? row.validDate : undefined))
                                  : (data.certificateEvidence?.shipSanitationInvalidValidDate ?? (isExpiredDate(row.validDate) ? row.validDate : undefined));
                                const fileSatisfiesCycle = Boolean(recordedFile && uploadedAfterInvalidDate(recordedFile, invalidCycleDate));
                                const replacementRequired = isExpiredDate(row.validDate)
                                  || replacementFlag
                                  || Boolean(invalidCycleDate && !fileSatisfiesCycle);
                                if (!replacementRequired) return null;

                                // Changing the date never clears the upload requirement. The file
                                // must belong to the invalid cycle that originally triggered it.
                                const file = !replacementFlag && fileSatisfiesCycle ? recordedFile : undefined;
                                return (
                                  <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 space-y-1.5">
                                    <p className="font-mono text-[10px] font-bold text-red-700">UPDATED CERTIFICATE REQUIRED</p>
                                    {file ? (
                                      <div className="flex items-center gap-2 min-w-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span className="font-mono text-[10px] text-emerald-700 truncate flex-1">Uploaded: {file.name}</span>
                                        <button type="button" onClick={() => downloadEvidence(file)} title="Download" className="text-emerald-700 hover:text-emerald-900"><Download className="w-3.5 h-3.5" /></button>
                                        {canEdit && (
                                          <button type="button" onClick={() => removeEvidence(target, file)} title="Remove" className="text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                                        )}
                                      </div>
                                    ) : canEdit ? (
                                      <button
                                        type="button"
                                        disabled={evidenceUploading}
                                        onClick={() => triggerEvidenceUpload(target)}
                                        className="inline-flex items-center gap-1.5 rounded border border-red-400 bg-white px-2.5 py-1.5 font-mono text-[10px] font-bold text-red-700 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                                      >
                                        {evidenceUploading && evidenceTarget === target ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                        {evidenceUploading && evidenceTarget === target ? "Uploading..." : "Upload updated certificate"}
                                      </button>
                                    ) : (
                                      <span className="font-mono text-[10px] text-red-700">No updated certificate uploaded</span>
                                    )}
                                    {target === "pAndI" && (
                                      <p className="font-mono text-[9px] text-red-600">Uploading here replaces Required Document 7.1 P&amp;I Certificate of Entry and marks it as the updated certificate.</p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="font-mono text-xs font-bold text-foreground underline mb-3">2. Ship&apos;s Inspection Report</p>
            <div className="border border-border rounded overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-yellow-300 text-gray-950 border-b border-border">
                    <th className="px-4 py-2.5 text-left font-bold w-[30%]">Inspection</th>
                    <th className="px-4 py-2.5 text-left font-bold w-[16%]">Date</th>
                    <th className="px-4 py-2.5 text-left font-bold w-[22%]">Place</th>
                    <th className="px-4 py-2.5 text-left font-bold w-[22%]">By</th>
                    <th className="px-4 py-2.5 text-center font-bold w-[10%]">N/A</th>
                  </tr>
                </thead>
                <tbody>
                  {INSPECTION_ROWS.map((definition, index) => {
                    const row = data.inspections[definition.key] ?? blankInspection();
                    return (
                      <tr key={definition.key} className={index < INSPECTION_ROWS.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-4 py-2.5 bg-secondary/30 text-foreground">{definition.label}</td>
                        {(["date", "place", "by"] as const).map(field => (
                          <td key={field} className={`px-3 py-1.5 ${row.notApplicable ? "bg-slate-50" : ""}`}>
                            {row.notApplicable ? (
                              <span className="font-mono text-xs font-bold text-slate-500">N/A</span>
                            ) : field === "date" ? (
                              <FixedDateInput
                                value={row.date}
                                canEdit={canEdit}
                                onChange={value => setInspection(definition.key, "date", value)}
                              />
                            ) : canEdit ? (
                              <input
                                type="text"
                                value={row[field]}
                                onChange={event => setInspection(definition.key, field, event.target.value)}
                                className={inputClass}
                                placeholder={field === "place" ? "Port / shipyard" : "Authority / inspector"}
                              />
                            ) : (
                              <span className={readOnlyClass}>{row[field] || "—"}</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-1.5 text-center">
                          <label className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${canEdit ? "cursor-pointer" : "cursor-default"} ${row.notApplicable ? "text-slate-700 font-bold" : "text-muted-foreground"}`}>
                            <input
                              type="checkbox"
                              checked={Boolean(row.notApplicable)}
                              disabled={!canEdit}
                              onChange={event => setInspectionNotApplicable(definition.key, event.target.checked)}
                              className="h-3.5 w-3.5 accent-slate-500"
                            />
                            N/A
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
