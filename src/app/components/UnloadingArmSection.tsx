import { useState } from "react";
import manifoldDiagram from "../../imports/image-5.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ManifoldLayoutData {
  l1l2: string;
  l2v:  string;
  vl3:  string;
  l3l4: string;
}

export interface FlowrateRow {
  flowrate: string;
  pressure: string;
}

export interface UnloadingLineData {
  vapourFlangeSpec: string;
  liquidFlangeSpec: string;
  vapourStrainer: string;
  liquidStrainer: string;
}

export interface UnloadingArmData {
  manifoldLayout: ManifoldLayoutData;
  flowrateRows: FlowrateRow[];
  unloadingLine: UnloadingLineData;
}

export function defaultManifoldLayoutData(): ManifoldLayoutData {
  return { l1l2: "", l2v: "", vl3: "", l3l4: "" };
}

const FLOWRATE_COUNT = 22;

export function defaultFlowrateRows(): FlowrateRow[] {
  return Array.from({ length: FLOWRATE_COUNT }, () => ({ flowrate: "", pressure: "" }));
}

export function defaultUnloadingLineData(): UnloadingLineData {
  return { vapourFlangeSpec: "", liquidFlangeSpec: "", vapourStrainer: "", liquidStrainer: "" };
}

export function defaultUnloadingArmData(): UnloadingArmData {
  return {
    manifoldLayout: defaultManifoldLayoutData(),
    flowrateRows: defaultFlowrateRows(),
    unloadingLine: defaultUnloadingLineData(),
  };
}

export function isUnloadingArmComplete(data: UnloadingArmData | undefined): boolean {
  const d = data ?? defaultUnloadingArmData();
  const m = d.manifoldLayout;
  const layoutOk = !!m.l1l2 && !!m.l2v && !!m.vl3 && !!m.l3l4;
  const rows = d.flowrateRows ?? defaultFlowrateRows();
  const flowrateOk = rows.every(r => !!r.flowrate && !!r.pressure);
  const ul = d.unloadingLine ?? defaultUnloadingLineData();
  const lineOk = !!ul.vapourFlangeSpec && !!ul.liquidFlangeSpec && !!ul.vapourStrainer && !!ul.liquidStrainer;
  return layoutOk && flowrateOk && lineOk;
}

// ─── Static manifold arrangement data ────────────────────────────────────────

type Slot = "O" | "X";
interface CaseRow { manifolds: number; l1: Slot; l2: Slot; v: Slot; l3: Slot; l4: Slot; }

const CASES: CaseRow[] = [
  { manifolds: 5, l1:"O", l2:"O", v:"O", l3:"O", l4:"O" },
  { manifolds: 4, l1:"O", l2:"O", v:"O", l3:"O", l4:"X" },
  { manifolds: 4, l1:"O", l2:"O", v:"O", l3:"X", l4:"O" },
  { manifolds: 4, l1:"O", l2:"X", v:"O", l3:"O", l4:"O" },
  { manifolds: 4, l1:"X", l2:"O", v:"O", l3:"O", l4:"O" },
  { manifolds: 3, l1:"O", l2:"O", v:"O", l3:"X", l4:"X" },
  { manifolds: 3, l1:"O", l2:"X", v:"O", l3:"O", l4:"X" },
  { manifolds: 3, l1:"X", l2:"O", v:"O", l3:"O", l4:"X" },
  { manifolds: 3, l1:"O", l2:"X", v:"O", l3:"X", l4:"O" },
  { manifolds: 3, l1:"X", l2:"O", v:"O", l3:"X", l4:"O" },
  { manifolds: 3, l1:"X", l2:"X", v:"O", l3:"O", l4:"O" },
  { manifolds: 2, l1:"O", l2:"X", v:"O", l3:"X", l4:"X" },
  { manifolds: 2, l1:"X", l2:"O", v:"O", l3:"X", l4:"X" },
  { manifolds: 2, l1:"X", l2:"X", v:"O", l3:"O", l4:"X" },
  { manifolds: 2, l1:"X", l2:"X", v:"O", l3:"X", l4:"O" },
  { manifolds: 4, l1:"O", l2:"O", v:"X", l3:"O", l4:"O" },
  { manifolds: 3, l1:"O", l2:"O", v:"X", l3:"O", l4:"X" },
  { manifolds: 3, l1:"O", l2:"X", v:"X", l3:"O", l4:"O" },
  { manifolds: 3, l1:"X", l2:"O", v:"X", l3:"O", l4:"O" },
  { manifolds: 2, l1:"X", l2:"X", v:"X", l3:"O", l4:"O" },
  { manifolds: 2, l1:"X", l2:"O", v:"X", l3:"O", l4:"X" },
  { manifolds: 2, l1:"O", l2:"X", v:"X", l3:"O", l4:"X" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  const v = parseFloat(s);
  return isNaN(v) ? NaN : v;
}

function inRange(v: number): boolean {
  return !isNaN(v) && v >= 2.5 && v <= 3.5;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const yi = "w-full bg-yellow-100 border border-yellow-400 rounded px-2 py-1 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono text-right";
const ro = "w-full font-mono text-xs text-foreground text-right border border-border rounded px-2 py-1 bg-secondary/50";

// ─── Slot cell ────────────────────────────────────────────────────────────────

function SlotCell({ v, last = false }: { v: Slot; last?: boolean }) {
  return (
    <td className={`px-2 py-2 text-center w-10 ${last ? "border-r border-border" : "border-r border-border/60"}`}>
      {v === "O"
        ? <span className="inline-block w-4 h-4 rounded-full border-2 border-foreground/70" />
        : <span className="font-mono font-bold text-red-500 text-sm leading-none">✕</span>}
    </td>
  );
}

// ─── Working Range Result Cell ────────────────────────────────────────────────

function WRResultCell({ value, last = false }: { value: number; last?: boolean }) {
  const borderCls = last ? "" : "border-r border-border";
  if (isNaN(value)) {
    return (
      <td className={`px-4 py-2.5 text-center ${borderCls}`}>
        <span className="font-mono text-sm text-muted-foreground">—</span>
      </td>
    );
  }
  const ok = value > 0;
  return (
    <td className={`px-2 py-1.5 text-center ${borderCls}`}>
      <span className={`inline-flex flex-col items-center justify-center w-full rounded px-2 py-1 font-mono text-xs font-bold ${
        ok ? "bg-emerald-500/15 text-emerald-600 border border-emerald-400/30"
           : "bg-red-500 text-white border border-red-600"
      }`}>
        <span className="tabular-nums">{value.toFixed(2)}</span>
        <span className="text-[9px] font-normal opacity-80">{ok ? "Acceptable" : "Unacceptable"}</span>
      </span>
    </td>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SubTab = "manifold_layout" | "unloading_flowrate" | "unloading_line" | "working_range";

interface Props {
  canEdit: boolean;
  data: UnloadingArmData;
  onChange: (d: UnloadingArmData) => void;
  manifoldHeightBL: string;
  ballastDraft: string;
  loadedDraft: string;
}

export function UnloadingArmSection({ canEdit, data: dataProp, onChange, manifoldHeightBL, ballastDraft, loadedDraft }: Props) {
  const data = dataProp ?? defaultUnloadingArmData();
  const [subTab, setSubTab] = useState<SubTab>("manifold_layout");

  const m    = data.manifoldLayout ?? defaultManifoldLayoutData();
  const rows = data.flowrateRows?.length === FLOWRATE_COUNT ? data.flowrateRows : defaultFlowrateRows();
  const ul   = data.unloadingLine ?? defaultUnloadingLineData();
  const setUL = (f: keyof UnloadingLineData, v: string) =>
    onChange({ ...data, unloadingLine: { ...ul, [f]: v } });

  const setM = (f: keyof ManifoldLayoutData, v: string) =>
    onChange({ ...data, manifoldLayout: { ...m, [f]: v } });

  const setRow = (i: number, f: keyof FlowrateRow, v: string) => {
    const updated = rows.map((r, idx) => idx === i ? { ...r, [f]: v } : r);
    onChange({ ...data, flowrateRows: updated });
  };

  // Manifold layout completion & result
  const layoutValues  = [parseNum(m.l1l2), parseNum(m.l2v), parseNum(m.vl3), parseNum(m.l3l4)];
  const allLayoutFilled = m.l1l2 !== "" && m.l2v !== "" && m.vl3 !== "" && m.l3l4 !== "";
  const allLayoutOk   = allLayoutFilled && layoutValues.every(inRange);

  // Flowrate completion
  const flowrateComplete = rows.every(r => !!r.flowrate && !!r.pressure);

  // Unloading line completion
  const lineComplete = !!ul.vapourFlangeSpec && !!ul.liquidFlangeSpec && !!ul.vapourStrainer && !!ul.liquidStrainer;

  // Working range calculations (linked from General Info)
  const manifoldH  = parseNum(manifoldHeightBL);
  const ballastDr  = parseNum(ballastDraft);
  const loadedDr   = parseNum(loadedDraft);
  const upperNormal = isNaN(manifoldH) || isNaN(ballastDr) ? NaN : 27.5 - manifoldH + ballastDr - 3.5;
  const upperHeave  = isNaN(upperNormal) ? NaN : upperNormal - 0.5;
  const lowerNormal = isNaN(manifoldH) || isNaN(loadedDr)  ? NaN : manifoldH - loadedDr - 17.5;
  const lowerHeave  = isNaN(lowerNormal) ? NaN : lowerNormal - 0.5;
  const workingComplete = manifoldHeightBL !== "" && ballastDraft !== "" && loadedDraft !== "";

  const tabs: { key: SubTab; label: string; complete: boolean }[] = [
    { key: "manifold_layout",    label: "Manifold Layout",         complete: allLayoutFilled  },
    { key: "unloading_flowrate", label: "Unloading Flowrate",      complete: flowrateComplete },
    { key: "unloading_line",     label: "Unloading Line",          complete: lineComplete     },
    { key: "working_range",      label: "Unloading Arm Working Range", complete: workingComplete },
  ];

  const layoutRows: { label: string; key: keyof ManifoldLayoutData }[] = [
    { label: "L1 – L2", key: "l1l2" },
    { label: "L2 – V",  key: "l2v"  },
    { label: "V – L3",  key: "vl3"  },
    { label: "L3 – L4", key: "l3l4" },
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

      {/* ── Manifold Layout ── */}
      {subTab === "manifold_layout" && (
        <div>
          <div className="px-8 py-5 border-b border-border flex justify-center bg-white">
            <ImageWithFallback src={manifoldDiagram} alt="Manifold layout diagram"
              className="max-w-full h-auto object-contain" style={{ maxHeight: 90 }} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  {["Space", "Distance", "Unit", "Result (2.5 – 3.5 m.)"].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 font-mono font-bold text-foreground text-center ${i === 0 ? "text-left" : ""} ${i < 3 ? "border-r border-border" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {layoutRows.map(({ label, key }) => {
                  const num = parseNum(m[key]);
                  const ok  = inRange(num);
                  const hasVal = m[key] !== "";
                  return (
                    <tr key={key} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-mono font-bold text-sm text-foreground border-r border-border whitespace-nowrap">{label}</td>
                      <td className="px-3 py-1.5 border-r border-border w-32">
                        {canEdit
                          ? <input type="number" value={m[key] ?? ""} onChange={e => setM(key, e.target.value)} placeholder="0.00" step="0.01" className={yi} />
                          : <span className={ro}>{m[key] ? Number(m[key]).toFixed(2) : "—"}</span>}
                      </td>
                      <td className="px-4 py-2.5 w-16 text-center border-r border-border">
                        <span className="font-mono text-xs text-muted-foreground">m.</span>
                      </td>
                      <td className="px-3 py-1.5 w-36 text-center">
                        {!hasVal ? <span className="font-mono text-xs text-muted-foreground">—</span>
                          : ok
                          ? <span className="inline-block font-mono text-xs font-bold text-emerald-700 bg-emerald-400/20 border border-emerald-400/30 rounded px-3 py-1">Acceptable</span>
                          : <span className="inline-block font-mono text-xs font-bold text-white bg-red-500 border border-red-600 rounded px-3 py-1">Unacceptable</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-border bg-secondary/20 flex items-center gap-4">
            <span className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">Overall Result</span>
            {!allLayoutFilled
              ? <span className="font-mono text-sm text-muted-foreground border border-border rounded px-4 py-1.5 bg-secondary/30">—</span>
              : allLayoutOk
              ? <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-400/20 border border-emerald-400/40 rounded px-5 py-1.5">✓ Acceptable</span>
              : <span className="font-mono text-sm font-bold text-white bg-red-500 border border-red-600 rounded px-5 py-1.5">✗ Unacceptable</span>}
            <span className="font-mono text-[10px] text-muted-foreground">All spaces must be between 2.5 and 3.5 m.</span>
          </div>
        </div>
      )}

      {/* ── Unloading Flowrate ── */}
      {subTab === "unloading_flowrate" && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="px-3 py-2.5 font-mono font-bold text-foreground text-center border-r border-border w-12" rowSpan={2}>Case</th>
                <th className="px-3 py-2.5 font-mono font-bold text-foreground text-center border-r border-border w-24" rowSpan={2}>No. of<br />Manifold</th>
                <th className="px-3 py-2 font-mono font-bold text-foreground text-center border-r border-border" colSpan={5}>Manifold Arrangement</th>
                <th className="px-3 py-2.5 font-mono font-bold text-foreground text-center border-r border-border" rowSpan={2}>Maximum Flowrate<br /><span className="font-normal text-[9px] text-muted-foreground">(m³/hr)</span></th>
                <th className="px-3 py-2.5 font-mono font-bold text-foreground text-center" rowSpan={2}>Maximum Manifold Pressure<br /><span className="font-normal text-[9px] text-muted-foreground">(barg)</span></th>
              </tr>
              <tr className="bg-secondary/30 border-b border-border">
                {["L1","L2","V","L3","L4"].map((h, i) => (
                  <th key={h} className={`px-2 py-2 font-mono font-bold text-foreground text-center w-10 ${i < 4 ? "border-r border-border/60" : "border-r border-border"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CASES.map((c, i) => {
                const row = rows[i];
                return (
                  <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-1.5 font-mono text-xs text-foreground text-center border-r border-border">{i + 1}</td>
                    <td className="px-3 py-1.5 font-mono text-xs text-foreground text-center border-r border-border">{c.manifolds}</td>
                    <SlotCell v={c.l1} />
                    <SlotCell v={c.l2} />
                    <SlotCell v={c.v}  />
                    <SlotCell v={c.l3} />
                    <SlotCell v={c.l4} last />
                    <td className="px-2 py-1 border-r border-border">
                      {canEdit
                        ? <input type="text" value={row.flowrate ?? ""} onChange={e => setRow(i, "flowrate", e.target.value)} placeholder="—" className={yi} />
                        : <span className={ro}>{row.flowrate || "—"}</span>}
                    </td>
                    <td className="px-2 py-1">
                      {canEdit
                        ? <input type="text" value={row.pressure ?? ""} onChange={e => setRow(i, "pressure", e.target.value)} placeholder="—" className={yi} />
                        : <span className={ro}>{row.pressure || "—"}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Unloading Line ── */}
      {subTab === "unloading_line" && (
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="px-4 py-2.5 text-left font-mono font-bold text-foreground border-r border-border w-36"></th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border">Flange Spec.</th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground">Strainer (Mesh)</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { label: "Vapour Line", fKey: "vapourFlangeSpec" as keyof UnloadingLineData, sKey: "vapourStrainer" as keyof UnloadingLineData },
                  { label: "Liquid Line", fKey: "liquidFlangeSpec" as keyof UnloadingLineData, sKey: "liquidStrainer" as keyof UnloadingLineData },
                ] as const).map(({ label, fKey, sKey }) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">{label}</td>
                    <td className="px-3 py-1.5 border-r border-border">
                      {canEdit
                        ? <input type="text" value={ul[fKey] ?? ""} onChange={e => setUL(fKey, e.target.value)} placeholder="—" className="w-full bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono" />
                        : <span className="font-mono text-xs text-foreground">{ul[fKey] || "—"}</span>}
                    </td>
                    <td className="px-3 py-1.5">
                      {canEdit
                        ? <input type="text" value={ul[sKey] ?? ""} onChange={e => setUL(sKey, e.target.value)} placeholder="—" className="w-full bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono" />
                        : <span className="font-mono text-xs text-foreground">{ul[sKey] || "—"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Unloading Arm Working Range ── */}
      {subTab === "working_range" && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Linked values */}
          <div className="border border-border rounded bg-secondary/20 overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center gap-2">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Ship Dimensions</p>
              <span className="font-mono text-[9px] text-sky-500/60 border border-sky-500/20 rounded px-1">from General Information</span>
            </div>
            <div className="px-4 py-3 space-y-0">
              {([
                { label: "Manifold Height above BL", value: manifoldHeightBL },
                { label: "Ballast Draft",             value: ballastDraft    },
                { label: "Loaded Draft",              value: loadedDraft     },
              ] as const).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-xs text-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-sky-400 tabular-nums">
                      {value ? Number(value).toFixed(2) : "—"}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">m.</span>
                    <span className="font-mono text-[9px] text-sky-500/60 border border-sky-500/20 rounded px-1">linked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculated results table */}
          <div className="border border-border rounded bg-secondary/20 overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Calculated Results</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-2 text-left font-mono font-bold text-foreground border-r border-border">Position</th>
                  <th className="px-4 py-2 text-center font-mono font-bold text-foreground border-r border-border">Normal<br /><span className="font-normal text-[9px] text-muted-foreground">(m.)</span></th>
                  <th className="px-4 py-2 text-center font-mono font-bold text-foreground">With Heave &amp; List<br /><span className="font-normal text-[9px] text-muted-foreground">(m.)</span></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground border-r border-border">
                    Upper Position
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">27.5 − ManifoldH + Ballast − 3.5</div>
                  </td>
                  <WRResultCell value={upperNormal} />
                  <WRResultCell value={upperHeave} last />
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground border-r border-border">
                    Lower Position
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">ManifoldH − Loaded − 17.5</div>
                  </td>
                  <WRResultCell value={lowerNormal} />
                  <WRResultCell value={lowerHeave} last />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
