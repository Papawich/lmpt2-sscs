import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RopeData {
  type: string;
  diameter: string;
  length: string;
  mbl: string;
}

export interface MooringPatternData {
  fwd1: string; fwd2: string; fwd3: string; fwd4: string;
  aft1: string; aft2: string; aft3: string; aft4: string;
}

export interface MooringArrangementData {
  mooringRope: RopeData;
  tailRope: RopeData;
  pattern: MooringPatternData;
}

export function defaultMooringArrangementData(): MooringArrangementData {
  return {
    mooringRope: { type: "", diameter: "", length: "", mbl: "" },
    tailRope:    { type: "", diameter: "", length: "", mbl: "" },
    pattern: { fwd1: "", fwd2: "", fwd3: "", fwd4: "", aft1: "", aft2: "", aft3: "", aft4: "" },
  };
}

export function isMooringComplete(data: MooringArrangementData | undefined): boolean {
  const d = data ?? defaultMooringArrangementData();
  const ropeOk = !!d.mooringRope.type && !!d.mooringRope.diameter && !!d.mooringRope.length && !!d.mooringRope.mbl;
  const tailOk = !!d.tailRope.type   && !!d.tailRope.diameter   && !!d.tailRope.length   && !!d.tailRope.mbl;
  const patternOk = Object.values(d.pattern).every(v => !!v);
  return ropeOk && tailOk && patternOk;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const yi  = "w-full bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono";
const yiS = yi + " cursor-pointer";

// ─── Rope Table ───────────────────────────────────────────────────────────────

function RopeRow({
  label, data, typeInput, canEdit, onChange,
}: {
  label: string; data: RopeData; typeInput: "select-wire-hmpe" | "text";
  canEdit: boolean; onChange: (d: RopeData) => void;
}) {
  const set = (f: keyof RopeData, v: string) => onChange({ ...data, [f]: v });
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">{label}</td>
      <td className="px-2 py-1.5 border-r border-border w-36">
        {canEdit ? (
          typeInput === "select-wire-hmpe" ? (
            <select value={data.type ?? ""} onChange={e => set("type", e.target.value)} className={yiS}>
              <option value="">— Select —</option>
              <option value="Wire">Wire</option>
              <option value="HMPE">HMPE</option>
            </select>
          ) : (
            <input type="text" value={data.type ?? ""} onChange={e => set("type", e.target.value)} placeholder="—" className={yi} />
          )
        ) : (
          <span className="font-mono text-xs text-foreground">{data.type || "—"}</span>
        )}
      </td>
      <td className="px-2 py-1.5 border-r border-border w-28">
        {canEdit
          ? <input type="text" value={data.diameter ?? ""} onChange={e => set("diameter", e.target.value)} placeholder="—" className={yi} />
          : <span className="font-mono text-xs text-foreground text-center block">{data.diameter || "—"}</span>}
      </td>
      <td className="px-2 py-1.5 border-r border-border w-28">
        {canEdit
          ? <input type="text" value={data.length ?? ""} onChange={e => set("length", e.target.value)} placeholder="—" className={yi} />
          : <span className="font-mono text-xs text-foreground text-center block">{data.length || "—"}</span>}
      </td>
      <td className="px-2 py-1.5 w-28">
        {canEdit
          ? <input type="text" value={data.mbl ?? ""} onChange={e => set("mbl", e.target.value)} placeholder="—" className={yi} />
          : <span className="font-mono text-xs text-foreground text-center block">{data.mbl || "—"}</span>}
      </td>
    </tr>
  );
}

// ─── Mooring Pattern ──────────────────────────────────────────────────────────

const PATTERN_OPTIONS_DEFAULT = ["", "1", "2", "3"];
const PATTERN_OPTIONS_BREAST  = ["", "1", "1(inner)", "2", "2(inner)"];

function PatternDropdown({
  value, canEdit, onChange, options = PATTERN_OPTIONS_DEFAULT,
}: { value: string; canEdit: boolean; onChange: (v: string) => void; options?: string[] }) {
  if (!canEdit) {
    return (
      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-1 h-8 rounded border border-border bg-secondary font-mono text-xs font-bold text-foreground">
        {value || "—"}
      </span>
    );
  }
  return (
    <select
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      className="h-8 bg-yellow-100 border border-yellow-400 rounded text-center text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-yellow-500 cursor-pointer px-1"
    >
      {options.map(o => (
        <option key={o} value={o}>{o === "" ? "—" : o}</option>
      ))}
    </select>
  );
}

function MooringPatternRow({
  pattern, canEdit, onChange,
}: { pattern: MooringPatternData; canEdit: boolean; onChange: (p: MooringPatternData) => void }) {
  const set = (k: keyof MooringPatternData, v: string) => onChange({ ...pattern, [k]: v });

  const fwdKeys: (keyof MooringPatternData)[] = ["fwd1", "fwd2", "fwd3", "fwd4"];
  const aftKeys: (keyof MooringPatternData)[] = ["aft1", "aft2", "aft3", "aft4"];
  const fwdLabels = ["HL", "FS", "FS", "FB"];
  const aftLabels = ["AB", "AS", "AS", "AL"];

  return (
    <div className="border border-border rounded bg-card/50 p-5">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest">FWD</span>
        {fwdKeys.map((k, i) => (
          <div key={k} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-0.5">
              <PatternDropdown value={pattern[k]} canEdit={canEdit} onChange={v => set(k, v)}
                options={fwdLabels[i] === "FB" ? PATTERN_OPTIONS_BREAST : PATTERN_OPTIONS_DEFAULT} />
              <span className="font-mono text-[9px] text-muted-foreground">{fwdLabels[i]}</span>
            </div>
            {i < fwdKeys.length - 1 && <span className="font-mono text-sm text-muted-foreground pb-3">/</span>}
          </div>
        ))}
        <div className="flex items-center gap-0.5 pb-3">
          <span className="font-mono text-xs text-muted-foreground tracking-widest">⋮⋮⋮⋮⋮⋮⋮⋮</span>
        </div>
        {aftKeys.map((k, i) => (
          <div key={k} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-0.5">
              <PatternDropdown value={pattern[k]} canEdit={canEdit} onChange={v => set(k, v)}
                options={aftLabels[i] === "AB" ? PATTERN_OPTIONS_BREAST : PATTERN_OPTIONS_DEFAULT} />
              <span className="font-mono text-[9px] text-muted-foreground">{aftLabels[i]}</span>
            </div>
            {i < aftKeys.length - 1 && <span className="font-mono text-sm text-muted-foreground pb-3">/</span>}
          </div>
        ))}
        <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest">AFT</span>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground mt-3 text-center">
        HL = Head Lines &nbsp;·&nbsp; FS = Fwd Spring &nbsp;·&nbsp; FB = Fwd Breast &nbsp;·&nbsp; AB = Aft Breast &nbsp;·&nbsp; AS = Aft Spring &nbsp;·&nbsp; AL = Aft Lines
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  canEdit: boolean;
  data: MooringArrangementData;
  onChange: (d: MooringArrangementData) => void;
}

type SubTab = "rope" | "pattern";

export function MooringArrangementSection({ canEdit, data: dataProp, onChange }: Props) {
  const data = dataProp ?? defaultMooringArrangementData();
  const [subTab, setSubTab] = useState<SubTab>("rope");

  const ropeComplete =
    !!data.mooringRope.type && !!data.mooringRope.diameter && !!data.mooringRope.length && !!data.mooringRope.mbl &&
    !!data.tailRope.type   && !!data.tailRope.diameter   && !!data.tailRope.length   && !!data.tailRope.mbl;

  const patternComplete = Object.values(data.pattern).every(v => !!v);

  const tabs: { key: SubTab; label: string; complete: boolean }[] = [
    { key: "rope",    label: "Rope",           complete: ropeComplete    },
    { key: "pattern", label: "Mooring Pattern", complete: patternComplete },
  ];

  return (
    <div className="border border-border rounded bg-card overflow-hidden mb-6">

      {/* Sub-tab bar */}
      <div className="flex border-b border-border bg-secondary/30">
        {tabs.map(t => {
          const isActive = subTab === t.key;
          return (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest transition-all border-b-2 -mb-px ${
                isActive ? "border-primary text-primary bg-card" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
              {t.complete
                ? <span className={`w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center ${isActive ? "bg-emerald-400/30 text-emerald-200" : "bg-emerald-500/20 text-emerald-400"}`}>✓</span>
                : <span className={`w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center ${isActive ? "bg-yellow-400/30 text-yellow-200" : "bg-yellow-400/20 text-yellow-500"}`}>!</span>
              }
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-5">
        {subTab === "rope" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  {["", "Type", "Diameter (mm.)", "Length (m.)", "MBL (tons)"].map((h, i) => (
                    <th key={h + i} className={`px-4 py-2.5 text-center font-mono font-bold text-foreground ${i < 4 ? "border-r border-border" : ""} ${i === 0 ? "text-left" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <RopeRow label="1. Mooring Rope" data={data.mooringRope} typeInput="select-wire-hmpe" canEdit={canEdit}
                  onChange={d => onChange({ ...data, mooringRope: d })} />
                <RopeRow label="2. Tail Rope" data={data.tailRope} typeInput="text" canEdit={canEdit}
                  onChange={d => onChange({ ...data, tailRope: d })} />
              </tbody>
            </table>
          </div>
        )}

        {subTab === "pattern" && (
          <MooringPatternRow pattern={data.pattern} canEdit={canEdit}
            onChange={p => onChange({ ...data, pattern: p })} />
        )}
      </div>
    </div>
  );
}
