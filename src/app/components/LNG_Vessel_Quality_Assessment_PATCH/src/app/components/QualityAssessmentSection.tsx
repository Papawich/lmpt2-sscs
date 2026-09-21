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

export function isQualityAssessmentComplete(data: QualityAssessmentData | undefined): boolean {
  const d = data ?? defaultQualityAssessmentData();
  const certificateComplete = (Object.keys(d.certificates) as CertificateKey[]).every(key => {
    const row = d.certificates[key];
    return !!row.issueDate.trim() && (PERMANENT_KEYS.has(key) || !!row.validDate.trim());
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
              <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                Grey valid-date cells = Permanent
              </span>
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
                          {canEdit ? (
                            <input
                              type="text"
                              value={row.issueDate}
                              onChange={event => setCertificate(definition.key, "issueDate", event.target.value)}
                              className={inputClass}
                              placeholder="e.g. 23 Aug 2024"
                            />
                          ) : (
                            <span className={readOnlyClass}>{row.issueDate || "—"}</span>
                          )}
                        </td>
                        <td className={`px-3 py-1.5 align-middle ${definition.permanent ? "bg-gray-500/70" : ""}`}>
                          {definition.permanent ? (
                            <span className="font-mono text-xs font-bold text-white tracking-wide">PERMANENT</span>
                          ) : canEdit ? (
                            <input
                              type="text"
                              value={row.validDate}
                              onChange={event => setCertificate(definition.key, "validDate", event.target.value)}
                              className={inputClass}
                              placeholder="e.g. 22 Aug 2029"
                            />
                          ) : (
                            <span className={readOnlyClass}>{row.validDate || "—"}</span>
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
                            {canEdit ? (
                              <input
                                type="text"
                                value={row[field]}
                                onChange={event => setInspection(definition.key, field, event.target.value)}
                                className={inputClass}
                                placeholder={field === "date" ? "e.g. 02 Aug 2025" : field === "place" ? "Port / shipyard" : "Authority / inspector"}
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
