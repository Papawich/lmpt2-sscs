import { useEffect, useRef, useState } from "react";
import { Download, Image as ImageIcon, Upload, X } from "lucide-react";
import type { UploadedFile } from "./RequiredDocumentsSection";

export interface AttachmentData {
  vesselPhotos: UploadedFile[];
}

export function defaultAttachmentData(): AttachmentData {
  return { vesselPhotos: [] };
}

export function isAttachmentComplete(data: AttachmentData | undefined): boolean {
  return (data?.vesselPhotos?.length ?? 0) > 0;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useImageUrls(files: UploadedFile[], getFileUrl?: (file: UploadedFile) => Promise<string>) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const next: Record<string, string> = {};

    void Promise.all(files.map(async file => {
      try {
        if (file.dataUrl) {
          next[file.id] = file.dataUrl;
        } else if (getFileUrl) {
          next[file.id] = await getFileUrl(file);
        }
      } catch (err) {
        console.error("[Vessel photo preview failed]", err);
      }
    })).then(() => {
      if (!cancelled) setUrls(next);
    });

    return () => { cancelled = true; };
  }, [files, getFileUrl]);

  return urls;
}

interface Props {
  canEdit: boolean;
  data: AttachmentData;
  onChange: (d: AttachmentData) => void;
  onUploadFile?: (file: File) => Promise<UploadedFile>;
  onDeleteFile?: (file: UploadedFile) => Promise<void>;
  getFileUrl?: (file: UploadedFile) => Promise<string>;
}

export function AttachmentsSection({ canEdit, data: dataProp, onChange, onUploadFile, onDeleteFile, getFileUrl }: Props) {
  const data = dataProp ?? defaultAttachmentData();
  const files = data.vesselPhotos ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const urls = useImageUrls(files, getFileUrl);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const invalid = selected.find(file => !file.type.startsWith("image/"));
    if (invalid) {
      window.alert(`Please select image files only. "${invalid.name}" is not an image.`);
      return;
    }

    setLoading(true);
    try {
      const uploaded = await Promise.all(selected.map(async file => {
        if (onUploadFile) return onUploadFile(file);
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
      }));
      onChange({ ...data, vesselPhotos: [...files, ...uploaded] });
    } catch (err) {
      console.error("[Vessel photo upload failed]", err);
      window.alert(err instanceof Error ? err.message : "Vessel photo upload failed.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeFile(file: UploadedFile) {
    try {
      if (onDeleteFile) await onDeleteFile(file);
      onChange({ ...data, vesselPhotos: files.filter(f => f.id !== file.id) });
    } catch (err) {
      console.error("[Vessel photo delete failed]", err);
      window.alert(err instanceof Error ? err.message : "Unable to delete this photo.");
    }
  }

  async function openFile(file: UploadedFile) {
    try {
      const href = urls[file.id] || file.dataUrl || (getFileUrl ? await getFileUrl(file) : "");
      if (!href) throw new Error("Photo source is unavailable.");
      window.open(href, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("[Vessel photo open failed]", err);
      window.alert(err instanceof Error ? err.message : "Unable to open this photo.");
    }
  }

  return (
    <div className="mb-6 border border-border rounded bg-card overflow-hidden">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      <div className="border-b border-border bg-secondary/30 px-5 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">Attachment</p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Upload vessel photos for the SSCS record and summary.</p>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{files.length} photo{files.length === 1 ? "" : "s"}</span>
      </div>

      <div className="p-5 space-y-4">
        {files.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(file => (
              <div key={file.id} className="border border-border rounded overflow-hidden bg-secondary/20">
                <div className="aspect-[4/3] bg-secondary/40 flex items-center justify-center overflow-hidden">
                  {urls[file.id] || file.dataUrl ? (
                    <img src={urls[file.id] || file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="p-2.5 flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] text-foreground truncate">{file.name}</p>
                    <p className="font-mono text-[9px] text-muted-foreground">{fmtSize(file.size)}</p>
                  </div>
                  <button onClick={() => void openFile(file)} title="Open photo" className="text-muted-foreground hover:text-primary transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {canEdit && (
                    <button onClick={() => void removeFile(file)} title="Remove photo" className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded py-10 flex flex-col items-center gap-2 text-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            <p className="font-mono text-xs text-muted-foreground">No vessel photo attached.</p>
          </div>
        )}

        {canEdit && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded border border-dashed border-border hover:border-primary/50 px-3.5 py-2 font-mono text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {loading ? "Uploading..." : files.length ? "Add more vessel photos" : "Upload vessel photo"}
          </button>
        )}
      </div>
    </div>
  );
}

export function VesselPhotoSummary({ files, getFileUrl }: { files: UploadedFile[]; getFileUrl?: (file: UploadedFile) => Promise<string> }) {
  const urls = useImageUrls(files, getFileUrl);
  if (!files.length) return null;

  return (
    <div className="px-5 py-4 border-b border-border bg-secondary/10">
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Vessel Photo</p>
      <div className="grid grid-cols-2 gap-2">
        {files.slice(0, 4).map((file, idx) => {
          const src = urls[file.id] || file.dataUrl;
          return (
            <div key={file.id} className={`${idx === 0 && files.length === 1 ? "col-span-2" : ""} aspect-[16/9] rounded border border-border overflow-hidden bg-secondary/40 flex items-center justify-center`}>
              {src ? <img src={src} alt={file.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-7 h-7 text-muted-foreground/40" />}
            </div>
          );
        })}
      </div>
      {files.length > 4 && <p className="font-mono text-[9px] text-muted-foreground mt-2">+ {files.length - 4} more photo{files.length - 4 === 1 ? "" : "s"}</p>}
    </div>
  );
}
