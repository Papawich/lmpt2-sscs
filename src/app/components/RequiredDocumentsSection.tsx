import { useRef, useState } from "react";
import { Upload, FileText, X, Download, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  /** Local-preview fallback used when Supabase is not configured. */
  dataUrl?: string;
  /** Supabase Storage object path used in cloud mode. */
  storagePath?: string;
}

export type DocKey =
  | "d_1_1" | "d_1_2" | "d_1_3"
  | "d_2_1" | "d_2_2" | "d_2_3" | "d_2_4" | "d_2_5" | "d_2_6"
  | "d_3_1" | "d_3_2" | "d_3_3" | "d_3_4"
  | "d_4_1" | "d_4_2"
  | "d_5_1" | "d_5_2" | "d_5_3";

export type RequiredDocumentsData = Record<DocKey, UploadedFile[]>;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const ALL_KEYS: DocKey[] = [
  "d_1_1", "d_1_2", "d_1_3",
  "d_2_1", "d_2_2", "d_2_3", "d_2_4", "d_2_5", "d_2_6",
  "d_3_1", "d_3_2", "d_3_3", "d_3_4",
  "d_4_1", "d_4_2",
  "d_5_1", "d_5_2", "d_5_3",
];

export function defaultRequiredDocumentsData(): RequiredDocumentsData {
  return Object.fromEntries(ALL_KEYS.map(k => [k, []])) as RequiredDocumentsData;
}

export function isRequiredDocumentsComplete(data: RequiredDocumentsData | undefined): boolean {
  const d = data ?? defaultRequiredDocumentsData();
  return ALL_KEYS.every(k => d[k].length > 0);
}

// ─── Document catalogue ───────────────────────────────────────────────────────

interface DocItem { key: DocKey; num: string; label: string }
interface DocGroup { title: string; items: DocItem[] }

const GROUPS: DocGroup[] = [
  {
    title: "1. Information",
    items: [
      { key: "d_1_1", num: "1.1", label: "HVPQ" },
      { key: "d_1_2", num: "1.2", label: "Ship Particulars" },
      { key: "d_1_3", num: "1.3", label: "Gas Form C" },
    ],
  },
  {
    title: "2. Drawing",
    items: [
      { key: "d_2_1", num: "2.1", label: "General Arrangement Plan" },
      { key: "d_2_2", num: "2.2", label: "Parallel Flat Body" },
      { key: "d_2_3", num: "2.3", label: "Ship Shore Interface Plan" },
      { key: "d_2_4", num: "2.4", label: "Manifold Arrangement" },
      { key: "d_2_5", num: "2.5", label: "Gangway Landing Area drawing, photo Starboard side and Port side" },
      { key: "d_2_6", num: "2.6", label: "SDP drawing and flange photo" },
    ],
  },
  {
    title: "3. Manual",
    items: [
      { key: "d_3_1", num: "3.1", label: "Mooring Operation Procedure" },
      { key: "d_3_2", num: "3.2", label: "Cargo Operating Manual" },
      { key: "d_3_3", num: "3.3", label: "Shipboard Emergency Response Procedure" },
      { key: "d_3_4", num: "3.4", label: "Shipboard Oil Pollution Emergency Plan" },
    ],
  },
  {
    title: "4. Optimoor",
    items: [
      { key: "d_4_1", num: "4.1", label: "Mooring Analysis Report" },
      { key: "d_4_2", num: "4.2", label: "Vessel File for Optimoor Analysis" },
    ],
  },
  {
    title: "5. CTMS",
    items: [
      { key: "d_5_1", num: "5.1", label: "Certificate of Tank Calibration" },
      { key: "d_5_2", num: "5.2", label: "Certificate of CTMS on board with accuracy" },
      { key: "d_5_3", num: "5.3", label: "Certificate of Gas Flow Meter" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  canEdit: boolean;
  data: RequiredDocumentsData;
  onChange: (d: RequiredDocumentsData) => void;
  onUploadFile?: (docKey: DocKey, file: File) => Promise<UploadedFile>;
  onDeleteFile?: (file: UploadedFile) => Promise<void>;
  getDownloadUrl?: (file: UploadedFile) => Promise<string>;
}

export function RequiredDocumentsSection({ canEdit, data: dp, onChange, onUploadFile, onDeleteFile, getDownloadUrl }: Props) {
  const data = dp ?? defaultRequiredDocumentsData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeKey, setActiveKey] = useState<DocKey | null>(null);
  const [loading, setLoading] = useState(false);

  function triggerUpload(key: DocKey) {
    setActiveKey(key);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeKey) return;
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const key = activeKey;
    setLoading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async file => {
          if (onUploadFile) return onUploadFile(key, file);
          return new Promise<UploadedFile>((resolve, reject) => {
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
        }),
      );
      onChange({ ...data, [key]: [...(data[key] ?? []), ...uploaded] });
    } catch (err) {
      console.error("[Required Documents upload failed]", err);
      window.alert(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setLoading(false);
      setActiveKey(null);
    }
  }

  async function removeFile(key: DocKey, fileId: string) {
    const file = data[key].find(f => f.id === fileId);
    if (!file) return;
    try {
      if (onDeleteFile) await onDeleteFile(file);
      onChange({ ...data, [key]: data[key].filter(f => f.id !== fileId) });
    } catch (err) {
      console.error("[Required Documents delete failed]", err);
      window.alert(err instanceof Error ? err.message : "Unable to delete this document.");
    }
  }

  async function downloadFile(file: UploadedFile) {
    try {
      const href = getDownloadUrl ? await getDownloadUrl(file) : file.dataUrl;
      if (!href) throw new Error("This file has no downloadable source.");
      const a = document.createElement("a");
      a.href = href;
      a.download = file.name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    } catch (err) {
      console.error("[Required Documents download failed]", err);
      window.alert(err instanceof Error ? err.message : "Unable to download this document.");
    }
  }

  const totalUploaded = ALL_KEYS.reduce((n, k) => n + (data[k]?.length ?? 0), 0);
  const totalRequired = ALL_KEYS.length;
  const slotsWithFile = ALL_KEYS.filter(k => (data[k]?.length ?? 0) > 0).length;

  return (
    <div className="mb-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {/* Section header */}
      <div className="border border-border rounded bg-card overflow-hidden">
        <div className="border-b border-border bg-secondary/30 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">
              Required Documents
            </p>
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
              Part 0 — Upload supporting documents before submission
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Uploaded</p>
            <p className={`font-mono text-lg font-bold ${slotsWithFile === totalRequired ? "text-emerald-400" : "text-primary"}`}>
              {slotsWithFile}<span className="text-muted-foreground text-sm font-normal"> / {totalRequired}</span>
            </p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {GROUPS.map(group => (
            <div key={group.title}>
              {/* Group heading */}
              <div className="flex items-center gap-3 mb-3">
                <p className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">
                  {group.title}
                </p>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Document rows */}
              <div className="border border-border rounded overflow-hidden divide-y divide-border">
                {group.items.map(({ key, num, label }) => {
                  const files = data[key] ?? [];
                  const hasFiles = files.length > 0;

                  return (
                    <div key={key} className={`px-4 py-3 transition-colors ${hasFiles ? "bg-emerald-500/[0.03]" : ""}`}>
                      <div className="flex items-start gap-3">
                        {/* Status dot + number */}
                        <div className="flex items-center gap-2 mt-0.5 shrink-0 w-10">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${hasFiles ? "bg-emerald-400" : "bg-border"}`} />
                          <span className="font-mono text-[10px] text-muted-foreground">{num}</span>
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-foreground font-semibold mb-1.5">{label}</p>

                          {/* Uploaded files list */}
                          {files.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {files.map(file => (
                                <div key={file.id}
                                  className="flex items-center gap-2 bg-secondary/50 border border-border rounded px-2.5 py-1.5 group">
                                  <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="font-mono text-[11px] text-foreground truncate flex-1">{file.name}</span>
                                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">{fmtSize(file.size)}</span>
                                  <span className="font-mono text-[10px] text-muted-foreground shrink-0 hidden sm:block">{fmtTime(file.uploadedAt)}</span>
                                  <button
                                    onClick={() => downloadFile(file)}
                                    title="Download"
                                    className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                                    <Download className="w-3 h-3" />
                                  </button>
                                  {canEdit && (
                                    <button
                                      onClick={() => removeFile(key, file.id)}
                                      title="Remove"
                                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Upload button */}
                          {canEdit && (
                            <button
                              onClick={() => triggerUpload(key)}
                              disabled={loading && activeKey === key}
                              className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/50 rounded px-3 py-1.5 transition-all">
                              <Upload className="w-3 h-3" />
                              {hasFiles ? "Add more files" : "Upload file"}
                            </button>
                          )}

                          {/* Read-only empty state */}
                          {!canEdit && !hasFiles && (
                            <span className="font-mono text-[11px] text-muted-foreground/50">No document uploaded</span>
                          )}
                        </div>

                        {/* Completion badge */}
                        {hasFiles && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer summary */}
        {totalUploaded > 0 && (
          <div className="border-t border-border bg-secondary/20 px-5 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <p className="font-mono text-[11px] text-muted-foreground">
              {totalUploaded} file{totalUploaded !== 1 ? "s" : ""} uploaded across {slotsWithFile} document slot{slotsWithFile !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
