// ─── Types ────────────────────────────────────────────────────────────────────

export interface CertificateAssessmentRow {
  issueDate: string;
  validDate: string;
}

export interface InspectionAssessmentRow {
  date: string;
  place: string;
  by: string;
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
const blankInspection = (): InspectionAssessmentRow => ({ date: "", place: "", by: "" });

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

export function isQualityAssessmentComplete(data: QualityAssessmentData | undefined): boolean {
  const d = data ?? defaultQualityAssessmentData();
  const certificateComplete = (Object.keys(d.certificates) as CertificateKey[]).every(key => {
    const row = d.certificates[key];
    if (!row.issueDate.trim()) return false;
    if (PERMANENT_KEYS.has(key)) return true;
    return !!row.validDate.trim() && !isExpiredDate(row.validDate);
  });
  const inspectionComplete = (Object.values(d.inspections) as InspectionAssessmentRow[]).every(
    row => !!row.date.trim() && !!row.place.trim() && !!row.by.trim()
  );
  return certificateComplete && inspectionComplete;
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
}

export function QualityAssessmentSection({ canEdit, data: dataProp, onChange }: Props) {
  const data = dataProp ?? defaultQualityAssessmentData();

  const setCertificate = (key: CertificateKey, field: keyof CertificateAssessmentRow, value: string) => {
    onChange({
      ...data,
      certificates: {
        ...data.certificates,
        [key]: { ...data.certificates[key], [field]: value },
      },
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

  return (
    <div className="space-y-5 mb-6">
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
                    <th className="px-4 py-2.5 text-left font-bold w-[34%]">Inspection</th>
                    <th className="px-4 py-2.5 text-left font-bold w-[18%]">Date</th>
                    <th className="px-4 py-2.5 text-left font-bold w-[24%]">Place</th>
                    <th className="px-4 py-2.5 text-left font-bold w-[24%]">By</th>
                  </tr>
                </thead>
                <tbody>
                  {INSPECTION_ROWS.map((definition, index) => {
                    const row = data.inspections[definition.key] ?? blankInspection();
                    return (
                      <tr key={definition.key} className={index < INSPECTION_ROWS.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-4 py-2.5 bg-secondary/30 text-foreground">{definition.label}</td>
                        {(["date", "place", "by"] as const).map(field => (
                          <td key={field} className="px-3 py-1.5">
                            {field === "date" ? (
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
