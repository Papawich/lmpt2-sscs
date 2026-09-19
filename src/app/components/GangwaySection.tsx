import { useState } from "react";
import gangwayDiagram from "../../imports/image-4.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GangwayData {
  a: string;
  b: string;
  c: string;
  d: string;
}

export function defaultGangwayData(): GangwayData {
  return { a: "", b: "", c: "", d: "" };
}

export function isGangwayComplete(data: GangwayData | undefined): boolean {
  const d = data ?? defaultGangwayData();
  return !!d.a && !!d.b && !!d.c && !!d.d;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  const v = parseFloat(s);
  return isNaN(v) ? NaN : v;
}

function fmt(n: number): string {
  return isNaN(n) ? "—" : n.toFixed(2);
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const yi = "w-28 bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono text-right";
const ro = "w-28 font-mono text-sm text-foreground text-right border border-border rounded px-2 py-1.5 bg-secondary/50";

// ─── Linked value row ─────────────────────────────────────────────────────────

function LinkedValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-sky-400 tabular-nums">
          {value ? Number(value).toFixed(2) : "—"}
        </span>
        <span className="font-mono text-xs text-muted-foreground">m.</span>
        <span className="font-mono text-[9px] text-sky-500/60 border border-sky-500/20 rounded px-1">linked</span>
      </div>
    </div>
  );
}

// ─── Result cell (for working range table) ────────────────────────────────────

function ResultCell({ value, last = false }: { value: number; last?: boolean }) {
  if (isNaN(value)) {
    return (
      <td className={`px-4 py-2.5 text-center ${last ? "" : "border-r border-border"}`}>
        <span className="font-mono text-sm text-muted-foreground">—</span>
      </td>
    );
  }
  const ok = value > 0;
  return (
    <td className={`px-2 py-1.5 text-center ${last ? "" : "border-r border-border"}`}>
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

type SubTab = "landing_area" | "working_range";

interface Props {
  canEdit: boolean;
  data: GangwayData;
  onChange: (d: GangwayData) => void;
  upperDeckHeightBL: string;
  ballastDraft: string;
  loadedDraft: string;
}

export function GangwaySection({ canEdit, data: dataProp, onChange, upperDeckHeightBL, ballastDraft, loadedDraft }: Props) {
  const data = dataProp ?? defaultGangwayData();
  const [subTab, setSubTab] = useState<SubTab>("landing_area");
  const set = (f: keyof GangwayData, v: string) => onChange({ ...data, [f]: v });

  // ── Landing area calculations ─────────────────────────────────────────────
  const aVal = parseNum(data.a);
  const bVal = parseNum(data.b);
  const cVal = parseNum(data.c);
  const dVal = parseNum(data.d);
  const length = isNaN(aVal) || isNaN(bVal) ? NaN : bVal - aVal;
  const width  = isNaN(cVal) || isNaN(dVal) ? NaN : dVal - cVal;
  const hasValues = data.a !== "" && data.b !== "" && data.c !== "" && data.d !== "";
  const acceptable = hasValues && !isNaN(length) && !isNaN(width) && length > 2.45 && width > 0.60;

  // ── Working range calculations ────────────────────────────────────────────
  const upperDeck = parseNum(upperDeckHeightBL);
  const ballastDr = parseNum(ballastDraft);
  const loadedDr  = parseNum(loadedDraft);
  const upperNormal = isNaN(upperDeck) || isNaN(ballastDr) ? NaN : 22.7 - upperDeck + ballastDr - 3.5;
  const upperHeave  = isNaN(upperNormal) ? NaN : upperNormal - 0.5;
  const lowerNormal = isNaN(upperDeck) || isNaN(loadedDr)  ? NaN : upperDeck - loadedDr - 12.1;
  const lowerHeave  = isNaN(lowerNormal) ? NaN : lowerNormal - 0.5;

  // ── Sub-tab completion ────────────────────────────────────────────────────
  const landingComplete   = hasValues;
  const workingComplete   = upperDeckHeightBL !== "" && ballastDraft !== "" && loadedDraft !== "";

  const tabs: { key: SubTab; label: string; complete: boolean }[] = [
    { key: "landing_area",  label: "Landing Area",   complete: landingComplete  },
    { key: "working_range", label: "Working Range",  complete: workingComplete  },
  ];

  const fields: { num: string; key: keyof GangwayData; label: string }[] = [
    { num: "(1)", key: "a", label: "A — Length from center of vapor line to landing area" },
    { num: "(2)", key: "b", label: "B — Length of landing area" },
    { num: "(3)", key: "c", label: "C — Length of Ship side to handrail" },
    { num: "(4)", key: "d", label: "D — Ship side to landing area" },
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

      {/* ── Landing Area ── */}
      {subTab === "landing_area" && (
        <div>
          <div className="p-5 border-b border-border flex justify-center bg-white">
            <ImageWithFallback
              src={gangwayDiagram}
              alt="Gangway landing area diagram showing dimensions A, B, C, D"
              className="max-w-full h-auto object-contain"
              style={{ maxHeight: 280 }}
            />
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-3">
              {fields.map(({ num, key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground w-6 shrink-0">{num}</span>
                  {canEdit ? (
                    <input type="number" value={data[key] ?? ""} onChange={e => set(key, e.target.value)}
                      placeholder="0.00" step="0.01" className={yi} />
                  ) : (
                    <span className={ro}>{data[key] ? Number(data[key]).toFixed(2) : "—"}</span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">m.</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
                </div>
              ))}
            </div>
            {/* Result */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-foreground border border-border bg-secondary/50 rounded px-3 py-1.5">Result</span>
                {!hasValues
                  ? <span className="font-mono text-sm text-muted-foreground border border-border rounded px-4 py-1.5 bg-secondary/30">—</span>
                  : acceptable
                  ? <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-400/20 border border-emerald-400/40 rounded px-4 py-1.5">✓ Acceptable</span>
                  : <span className="font-mono text-sm font-bold text-white bg-red-500 border border-red-600 rounded px-4 py-1.5">✗ Unacceptable</span>
                }
              </div>
              <div className="border border-border rounded bg-secondary/30 overflow-hidden">
                <div className="px-4 py-2 bg-secondary/50 border-b border-border">
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Gangway Landing Area</p>
                </div>
                <div className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">Length <span className="font-mono text-muted-foreground text-[10px]">(B − A)</span></span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-bold tabular-nums ${!isNaN(length) ? (length > 2.45 ? "text-emerald-500" : "text-red-500") : "text-muted-foreground"}`}>{fmt(length)}</span>
                      {!isNaN(length) && <span className="font-mono text-xs text-muted-foreground">m.</span>}
                      <span className="font-mono text-[9px] text-muted-foreground">(min 2.45)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">Width <span className="font-mono text-muted-foreground text-[10px]">(D − C)</span></span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-bold tabular-nums ${!isNaN(width) ? (width > 0.60 ? "text-emerald-500" : "text-red-500") : "text-muted-foreground"}`}>{fmt(width)}</span>
                      {!isNaN(width) && <span className="font-mono text-xs text-muted-foreground">m.</span>}
                      <span className="font-mono text-[9px] text-muted-foreground">(min 0.60)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Working Range ── */}
      {subTab === "working_range" && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Linked values */}
          <div className="border border-border rounded bg-secondary/20 overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center gap-2">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Ship Dimensions</p>
              <span className="font-mono text-[9px] text-sky-500/60 border border-sky-500/20 rounded px-1">from General Information</span>
            </div>
            <div className="px-4 py-3">
              <LinkedValueRow label="Upper Deck Height above BL" value={upperDeckHeightBL} />
              <LinkedValueRow label="Ballast Draft"              value={ballastDraft} />
              <LinkedValueRow label="Loaded Draft"               value={loadedDraft} />
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
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">22.7 − UpperDeck + Ballast − 3.5</div>
                  </td>
                  <ResultCell value={upperNormal} />
                  <ResultCell value={upperHeave} />
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground border-r border-border">
                    Lower Position
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">UpperDeck − Loaded − 12.1</div>
                  </td>
                  <ResultCell value={lowerNormal} />
                  <ResultCell value={lowerHeave} last />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
