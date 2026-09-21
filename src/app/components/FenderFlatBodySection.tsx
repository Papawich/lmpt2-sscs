import { useState } from "react";
import flatBodyDiagram from "../../imports/image-11.png";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlatBodyData {
  vapourManifoldOffset: string;
  ballastFwd: string;
  ballastAft: string;
  loadedFwd: string;
  loadedAft: string;
  upperDeckFwd: string;
  upperDeckAft: string;
}

export interface FenderRow {
  fenderNo: string;
  reactionForce: string;
  areaContactPct: string;
  remark: string;
}

export interface FenderReactionData {
  allowableHullPressure: string;
  ballastDraft: FenderRow[];
  loadedDraft: FenderRow[];
}

export interface BerthingEnergyData {
  displacement: string;
}

const FENDER_NOS = ["F1", "F2", "F3", "F4"];

export function isFenderFlatBodyComplete(
  flatBody: FlatBodyData | undefined,
  fenderReaction: FenderReactionData | undefined,
): boolean {
  const fb = flatBody ?? defaultFlatBodyData();
  const fr = fenderReaction ?? defaultFenderReactionData();

  const flatBodyDone =
    !!fb.vapourManifoldOffset.trim() &&
    !!fb.ballastFwd.trim() && !!fb.ballastAft.trim() &&
    !!fb.loadedFwd.trim() && !!fb.loadedAft.trim() &&
    !!fb.upperDeckFwd.trim() && !!fb.upperDeckAft.trim();

  const allRows = [...fr.ballastDraft, ...fr.loadedDraft];
  const fenderDone =
    !!fr.allowableHullPressure.trim() &&
    allRows.every(r => !!r.reactionForce.trim() && !!r.areaContactPct.trim());

  return flatBodyDone && fenderDone;
}

export function defaultFlatBodyData(): FlatBodyData {
  return {
    vapourManifoldOffset: "",
    ballastFwd: "", ballastAft: "",
    loadedFwd: "", loadedAft: "",
    upperDeckFwd: "", upperDeckAft: "",
  };
}

// Fixed berthing energy constants
const BE_VELOCITY        = 0.10;
const BE_CM              = 1.75;
const BE_CE              = 0.74;
const BE_CC              = 1.00;
const BE_CS              = 1.00;
const BE_SAFETY_FACTOR   = 2;
const BE_FENDER_CAPACITY = 555.4;

export function defaultBerthingEnergyData(): BerthingEnergyData {
  return { displacement: "" };
}

function calcBerthingEnergy(displacement: string): string {
  const W = parseFloat(displacement);
  if (!W) return "—";
  // En (kN·m) = ½ × (W×1000/9.81) × V² × Cm × Ce × Cc × Cs / 1000 × safety factor
  const result = 0.5 * (W * 1000 / 9.81) * BE_VELOCITY ** 2 * BE_CM * BE_CE * BE_CC * BE_CS / 1000 * BE_SAFETY_FACTOR;
  return result.toFixed(2);
}

const FIXED_AREA_CONTACT_M2 = 44.90;

export function defaultFenderReactionData(): FenderReactionData {
  const makeRows = (): FenderRow[] =>
    FENDER_NOS.map(no => ({
      fenderNo: no,
      reactionForce: "",
      areaContactPct: "",
      remark: "",
    }));
  return {
    allowableHullPressure: "",
    ballastDraft: makeRows(),
    loadedDraft: makeRows(),
  };
}

function calcActualFacePressure(row: FenderRow): string {
  const force = parseFloat(row.reactionForce);
  const areaPct = parseFloat(row.areaContactPct);
  if (!force || !areaPct) return "—";
  const result = force / (FIXED_AREA_CONTACT_M2 * (areaPct / 100));
  return result.toFixed(2);
}

function calcPercentageOfForceReaction(actualPressure: string, allowableHullPressure: string): string {
  const actual = parseFloat(actualPressure);
  const allowable = parseFloat(allowableHullPressure);
  if (!actual || !allowable) return "—";
  return ((actual / allowable) * 100).toFixed(2);
}

// ─── Ship Diagram SVG ─────────────────────────────────────────────────────────

function ShipDiagramSVG() {
  // ── Key geometry ────────────────────────────────────────────────
  const cx        = 390;   // Vapor Manifold x
  const hullTopY  = 38;
  const hullBotY  = 56;    // hull bottom = flat-top of dome (narrowest)
  const hullLeft  = 168;
  const hullRight = 612;
  const domeTopL  = cx - 100; // 290
  const domeTopR  = cx + 100; // 490
  const domeBot   = 168;   // deepest point of dome

  // Waterlines
  const ballastY  = 93;    // UPPER line = Ballast draft
  const loadedY   = 128;   // LOWER line = Loaded draft

  // Dome intersection half-widths (dome widens downward, so loaded > ballast)
  // Verified against cubic bezier C 495,90 625,150 390,168
  const ballastHW = 125;   // ≈ 515 - 390
  const loadedHW  = 138;   // ≈ 528 - 390

  const bFwdX = cx - ballastHW; // 265
  const bAftX = cx + ballastHW; // 515
  const lFwdX = cx - loadedHW;  // 252
  const lAftX = cx + loadedHW;  // 528

  // Arrow rows y positions (below diagram)
  const dimY1 = 186;
  const dimY2 = 202;
  const dimY3 = 218;

  // Dome path: narrow flat top → widens as it curves down → meets at bottom centre
  const domePath =
    `M ${domeTopL},${hullBotY} L ${domeTopR},${hullBotY}` +
    ` C ${domeTopR + 5},90 ${cx + 235},150 ${cx},${domeBot}` +
    ` C ${cx - 235},150 ${domeTopL - 5},90 ${domeTopL},${hullBotY} Z`;

  return (
    <svg viewBox="0 0 780 232" className="w-full" style={{ maxHeight: 220 }}>

      {/* ── "Vapor Manifold" label box at top centre ── */}
      <rect x={cx - 56} y={2} width={112} height={18} rx={2}
        fill="white" stroke="#374151" strokeWidth="1"/>
      <text x={cx} y={14.5} textAnchor="middle" fontSize="10"
        fontFamily="Arial, sans-serif" fill="#374151">Vapor Manifold</text>
      <line x1={cx} y1={20} x2={cx} y2={hullTopY}
        stroke="#374151" strokeWidth="1" strokeDasharray="3,3"/>

      {/* ── Hull top plate ── */}
      <line x1={hullLeft} y1={hullTopY} x2={hullRight} y2={hullTopY}
        stroke="#374151" strokeWidth="2"/>
      {/* Hull bottom plate (either side of dome gap) */}
      <line x1={hullLeft} y1={hullBotY} x2={domeTopL} y2={hullBotY}
        stroke="#374151" strokeWidth="1.5"/>
      <line x1={domeTopR} y1={hullBotY} x2={hullRight} y2={hullBotY}
        stroke="#374151" strokeWidth="1.5"/>

      {/* ── Left bow step ── */}
      <line x1={hullLeft} y1={hullTopY} x2={hullLeft} y2={ballastY - 4}
        stroke="#374151" strokeWidth="1.5"/>
      <line x1={hullLeft} y1={ballastY - 4} x2={hullLeft - 34} y2={ballastY - 4}
        stroke="#374151" strokeWidth="1.5"/>
      <line x1={hullLeft - 34} y1={ballastY - 4} x2={hullLeft - 34} y2={loadedY + 14}
        stroke="#374151" strokeWidth="1.5"/>
      {/* Inner bow curve */}
      <path d={`M ${hullLeft},${loadedY - 5} Q ${hullLeft - 18},${loadedY + 6} ${hullLeft - 34},${loadedY + 14}`}
        fill="none" stroke="#374151" strokeWidth="1.2"/>

      {/* ── Right stern ── */}
      <line x1={hullRight} y1={hullTopY} x2={hullRight} y2={loadedY}
        stroke="#374151" strokeWidth="1.5"/>
      {/* Small S-curve detail at stern top */}
      <path d={`M ${hullRight},${hullTopY + 8} C ${hullRight + 12},${hullTopY + 10} ${hullRight + 14},${hullTopY + 24} ${hullRight + 5},${hullTopY + 30}`}
        fill="none" stroke="#374151" strokeWidth="1.2"/>
      {/* Blue valve triangle at stern (pointing upward) */}
      <polygon
        points={`${hullRight + 8},${loadedY + 14} ${hullRight + 26},${loadedY + 14} ${hullRight + 17},${loadedY - 2}`}
        fill="none" stroke="#1d4ed8" strokeWidth="1.8"/>

      {/* ── Centre dash-dot vertical line ── */}
      <line x1={cx} y1={hullTopY} x2={cx} y2={dimY3 + 8}
        stroke="#374151" strokeWidth="1.2" strokeDasharray="8,4,2,4"/>

      {/* ── Flat body dome (main element) ── */}
      <path d={domePath} fill="#d4dae2" stroke="#374151" strokeWidth="1.5"/>

      {/* ── Ballast draft waterline (UPPER) ── */}
      <line x1={hullLeft - 58} y1={ballastY} x2={hullRight + 36} y2={ballastY}
        stroke="#374151" strokeWidth="1.3" strokeDasharray="8,5,2,5"/>
      <text x={hullLeft - 62} y={ballastY - 4}
        fontSize="9" fontFamily="Arial, sans-serif" fill="#374151" textAnchor="end">Ballast draft</text>
      {/* Down arrow from label to line */}
      <line x1={hullLeft - 52} y1={ballastY - 14} x2={hullLeft - 52} y2={ballastY - 2}
        stroke="#374151" strokeWidth="1"/>
      <polygon
        points={`${hullLeft - 52},${ballastY} ${hullLeft - 55},${ballastY - 8} ${hullLeft - 49},${ballastY - 8}`}
        fill="#374151"/>

      {/* ── Loaded draft waterline (LOWER) ── */}
      <line x1={hullLeft - 58} y1={loadedY} x2={hullRight + 36} y2={loadedY}
        stroke="#374151" strokeWidth="1.3" strokeDasharray="8,5,2,5"/>
      <text x={hullLeft - 62} y={loadedY + 10}
        fontSize="9" fontFamily="Arial, sans-serif" fill="#374151" textAnchor="end">Loaded draft</text>
      {/* Up arrow from label toward line */}
      <line x1={hullLeft - 52} y1={loadedY + 2} x2={hullLeft - 52} y2={loadedY + 14}
        stroke="#374151" strokeWidth="1"/>
      <polygon
        points={`${hullLeft - 52},${loadedY} ${hullLeft - 55},${loadedY + 8} ${hullLeft - 49},${loadedY + 8}`}
        fill="#374151"/>

      {/* ── Vertical drop lines from intersection points down to arrows ── */}
      {([
        [bFwdX,    ballastY],
        [bAftX,    ballastY],
        [lFwdX,    loadedY],
        [lAftX,    loadedY],
        [hullLeft, hullBotY],
        [hullRight,hullBotY],
      ] as [number, number][]).map(([x, y1], i) => (
        <line key={i} x1={x} y1={y1} x2={x} y2={dimY3 + 6}
          stroke="#374151" strokeWidth="0.8" strokeDasharray="5,3"/>
      ))}

      {/* ── Dimension arrow rows (① ballast, ③ loaded, ⑤ upper deck) ── */}
      <DimArrow x1={bFwdX}    x2={bAftX}     y={dimY1} label1="1" label2="2"/>
      <DimArrow x1={lFwdX}    x2={lAftX}     y={dimY2} label1="3" label2="4"/>
      <DimArrow x1={hullLeft} x2={hullRight}  y={dimY3} label1="5" label2="6"/>

    </svg>
  );
}

function DimArrow({ x1, x2, y, label1, label2 }: {
  x1: number; x2: number; y: number; label1: string; label2: string;
}) {
  const mid = (x1 + x2) / 2;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#1e3a8a" strokeWidth="1.3"/>
      <polygon points={`${x1},${y} ${x1 + 8},${y - 3.5} ${x1 + 8},${y + 3.5}`} fill="#1e3a8a"/>
      <polygon points={`${x2},${y} ${x2 - 8},${y - 3.5} ${x2 - 8},${y + 3.5}`} fill="#1e3a8a"/>
      <line x1={mid} y1={y - 5} x2={mid} y2={y + 5} stroke="#1e3a8a" strokeWidth="1.3"/>
      <text x={(x1 + mid) / 2} y={y - 4} textAnchor="middle" fontSize="10"
        fontStyle="italic" fontFamily="Arial, sans-serif" fill="#1e3a8a">{label1}</text>
      <text x={(mid + x2) / 2} y={y - 4} textAnchor="middle" fontSize="10"
        fontStyle="italic" fontFamily="Arial, sans-serif" fill="#1e3a8a">{label2}</text>
    </g>
  );
}

// ─── Flat Body Sub-section ────────────────────────────────────────────────────

function FlatBodyTab({
  data, canEdit, onChange,
}: { data: FlatBodyData; canEdit: boolean; onChange: (d: FlatBodyData) => void }) {
  const yellowInput =
    "w-full bg-yellow-100 border border-yellow-400 rounded px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all text-center font-mono";
  const readCell =
    "w-full text-center font-mono text-sm text-foreground bg-secondary/50 rounded px-2 py-1.5";

  function set(field: keyof FlatBodyData, val: string) {
    onChange({ ...data, [field]: val });
  }

  const rows: { label: string; num1: string; fwdKey: keyof FlatBodyData; num2: string; aftKey: keyof FlatBodyData }[] = [
    { label: "Length of Ballast Draft",               num1: "1", fwdKey: "ballastFwd",   num2: "2", aftKey: "ballastAft"   },
    { label: "Length of Loaded Draft",                num1: "3", fwdKey: "loadedFwd",    num2: "4", aftKey: "loadedAft"    },
    { label: "Length of upper deck part (for reference)", num1: "5", fwdKey: "upperDeckFwd", num2: "6", aftKey: "upperDeckAft" },
  ];

  return (
    <div className="space-y-5">
      {/* Title + offset input */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-xs font-bold text-foreground underline">1. Flat Body</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            (1) Vapour Manifold Offset from midhip LBP/2&nbsp;&nbsp;<span className="italic">(Fwd = minus − /Aft t= plus +)</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-muted-foreground">:</span>
          {canEdit ? (
            <input
              type="text"
              value={data.vapourManifoldOffset ?? ""}
              onChange={e => set("vapourManifoldOffset", e.target.value)}
              placeholder=""
              className={yellowInput + " w-24"}
            />
          ) : (
            <span className={readCell + " w-24"}>{data.vapourManifoldOffset || "—"}</span>
          )}
          <span className="font-mono text-xs text-muted-foreground">m</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-3">(unit : m)</span>
        </div>
      </div>

      {/* Ship diagram */}
      <div className="border border-border rounded bg-card/50 p-4">
        <img src={flatBodyDiagram} alt="Flat body diagram" className="w-full" />
      </div>

      {/* Table */}
      <div>
        <p className="font-mono text-xs font-bold text-foreground mb-2 underline">Length of Flat Body From Vapour Manifold</p>
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary border-b border-border">
                <th className="px-4 py-2.5 text-left font-mono font-bold text-foreground border-r border-border">Details</th>
                <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border" colSpan={2}>Fwd Part</th>
                <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground" colSpan={2}>Aft Part</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.fwdKey} className={i < rows.length - 1 ? "border-b border-border" : ""}>
                  <td className="px-4 py-2.5 font-mono font-bold text-foreground border-r border-border whitespace-nowrap">{row.label}</td>
                  {/* Fwd number */}
                  <td className="px-3 py-2 text-center italic font-bold text-[#1e3a8a] border-r border-border/40 w-8">{row.num1}</td>
                  {/* Fwd input */}
                  <td className="px-2 py-1.5 border-r border-border w-28">
                    {canEdit ? (
                      <input
                        type="text"
                        value={data[row.fwdKey] ?? ""}
                        onChange={e => set(row.fwdKey, e.target.value)}
                        className={yellowInput}
                      />
                    ) : (
                      <span className={readCell}>{data[row.fwdKey] || "—"}</span>
                    )}
                  </td>
                  {/* Aft number */}
                  <td className="px-3 py-2 text-center italic font-bold text-[#1e3a8a] border-r border-border/40 w-8">{row.num2}</td>
                  {/* Aft input */}
                  <td className="px-2 py-1.5 w-28">
                    {canEdit ? (
                      <input
                        type="text"
                        value={data[row.aftKey] ?? ""}
                        onChange={e => set(row.aftKey, e.target.value)}
                        className={yellowInput}
                      />
                    ) : (
                      <span className={readCell}>{data[row.aftKey] || "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Fender Reaction Table ────────────────────────────────────────────────────

function FenderTable({
  title,
  rows,
  allowableHullPressure,
  canEdit,
  onRowChange,
}: {
  title: string;
  rows: FenderRow[];
  allowableHullPressure: string;
  canEdit: boolean;
  onRowChange: (idx: number, field: keyof FenderRow, val: string) => void;
}) {
  const yellowInput =
    "w-full bg-yellow-100 border border-yellow-400 rounded px-1.5 py-1 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all text-center font-mono";
  const calcCell = "text-center font-mono text-xs text-foreground";
  const readCell = "text-center font-mono text-xs text-foreground";

  return (
    <div>
      <p className="font-mono text-xs font-bold text-foreground underline mb-2">{title}</p>
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary border-b border-border">
              {[
                "Fender No.",
                "Fender Reaction Force (ton)",
                "Fender Area Contact (m²)",
                "Fender Area Contact (%)",
                "Actual Face Pressure (ton/m²)",
                "Allowable Hull Pressure (ton/m²)",
                "Percentage of Force Reaction (%)",
              ].map((h, i) => (
                <th
                  key={h}
                  className={`px-2 py-2.5 text-center font-mono font-bold text-foreground leading-tight ${i < 6 ? "border-r border-border" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const actualPressure = calcActualFacePressure(row);
              const pctForceReaction = calcPercentageOfForceReaction(actualPressure, allowableHullPressure);
              return (
                <tr key={row.fenderNo} className={idx < rows.length - 1 ? "border-b border-border" : ""}>
                  {/* Fender No. */}
                  <td className="px-3 py-2 text-center font-mono font-bold text-foreground border-r border-border">{row.fenderNo}</td>
                  {/* Reaction Force - yellow input */}
                  <td className="px-2 py-1.5 border-r border-border">
                    {canEdit ? (
                      <input type="text" value={row.reactionForce ?? ""} onChange={e => onRowChange(idx, "reactionForce", e.target.value)} className={yellowInput} />
                    ) : (
                      <span className={readCell}>{row.reactionForce || "—"}</span>
                    )}
                  </td>
                  {/* Area Contact m² - fixed, read-only */}
                  <td className="px-3 py-2 border-r border-border">
                    <span className={readCell}>{FIXED_AREA_CONTACT_M2.toFixed(2)}</span>
                  </td>
                  {/* Area Contact % - yellow input */}
                  <td className="px-2 py-1.5 border-r border-border">
                    {canEdit ? (
                      <input type="text" value={row.areaContactPct ?? ""} onChange={e => onRowChange(idx, "areaContactPct", e.target.value)} className={yellowInput} />
                    ) : (
                      <span className={readCell}>{row.areaContactPct || "—"}</span>
                    )}
                  </td>
                  {/* Actual Face Pressure - calculated */}
                  <td className="px-3 py-2 border-r border-border">
                    <span className={calcCell}>{actualPressure}</span>
                  </td>
                  {/* Allowable Hull Pressure - shared value */}
                  <td className="px-3 py-2 border-r border-border">
                    <span className={readCell}>{allowableHullPressure || "—"}</span>
                  </td>
                  {/* Percentage of Force Reaction - calculated */}
                  <td className="px-3 py-2">
                    <span className={calcCell}>{pctForceReaction}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FenderReactionTab({
  data, canEdit, onChange,
}: { data: FenderReactionData; canEdit: boolean; onChange: (d: FenderReactionData) => void }) {
  const yellowInput =
    "bg-yellow-100 border border-yellow-400 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all text-center font-mono w-24";

  function updateRow(draft: "ballastDraft" | "loadedDraft", idx: number, field: keyof FenderRow, val: string) {
    const rows = data[draft].map((r, i) => i === idx ? { ...r, [field]: val } : r);
    onChange({ ...data, [draft]: rows });
  }

  return (
    <div className="space-y-6">
      {/* Single shared Allowable Hull Pressure input */}
      <div className="flex items-center gap-3 p-3 rounded border border-border bg-secondary/40">
        <span className="font-mono text-xs text-muted-foreground">Allowable Hull Pressure (ton/m²) — same for all fenders &amp; both drafts:</span>
        {canEdit ? (
          <input
            type="text"
            value={data.allowableHullPressure ?? ""}
            onChange={e => onChange({ ...data, allowableHullPressure: e.target.value })}
            className={yellowInput}
          />
        ) : (
          <span className="font-mono text-xs text-foreground">{data.allowableHullPressure || "—"}</span>
        )}
      </div>

      <FenderTable
        title="2. Fender Reaction — Ballast Draft"
        rows={data.ballastDraft}
        allowableHullPressure={data.allowableHullPressure}
        canEdit={canEdit}
        onRowChange={(idx, field, val) => updateRow("ballastDraft", idx, field, val)}
      />
      <FenderTable
        title="3. Fender Reaction — Loaded Draft"
        rows={data.loadedDraft}
        allowableHullPressure={data.allowableHullPressure}
        canEdit={canEdit}
        onRowChange={(idx, field, val) => updateRow("loadedDraft", idx, field, val)}
      />

      {/* Formula note */}
      <p className="font-mono text-[10px] text-muted-foreground">
        * Actual Face Pressure = Fender Reaction Force ÷ (44.90 m² × Fender Area Contact (%/100))
        &nbsp;|&nbsp; Percentage of Force Reaction = Actual Face Pressure ÷ Allowable Hull Pressure × 100
      </p>
    </div>
  );
}

// ─── Berthing Energy Tab ──────────────────────────────────────────────────────

function BerthingEnergyTab({
  data: dataProp, canEdit, onChange,
}: { data: BerthingEnergyData; canEdit: boolean; onChange: (d: BerthingEnergyData) => void }) {
  const data = dataProp ?? defaultBerthingEnergyData();
  const fc = "text-center font-mono text-xs text-foreground"; // fixed / calculated cell

  const energy = calcBerthingEnergy(data.displacement);
  const energyNum = parseFloat(energy);
  const remarkPct = !isNaN(energyNum) && energy !== "—"
    ? ((energyNum / BE_FENDER_CAPACITY) * 100).toFixed(2)
    : null;
  const isAcceptable = remarkPct !== null ? parseFloat(remarkPct) <= 100 : null;

  const headers = [
    "Displacement (ton)",
    "Berthing Velocity (m/s)",
    "Added Mass Coeff. Cm",
    "Eccentricity Coeff. Ce",
    "Berth Config. Coeff. Cc",
    "Softness Coeff. Cs",
    "Berthing Energy (kN·m)",
    "Fender Energy Capacity (kN·m)",
    "Remark (%)",
  ];

  return (
    <div className="space-y-4">
      <p className="font-mono text-xs font-bold text-foreground underline">Berthing Energy</p>

      <div className="border border-border rounded overflow-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-secondary border-b border-border">
              {headers.map((h, i) => (
                <th key={h} className={`px-2 py-2.5 text-center font-mono font-bold text-foreground leading-tight ${i < headers.length - 1 ? "border-r border-border" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Displacement — linked automatically from General Information / Ship Major Dimensions */}
              <td className="px-2 py-1.5 border-r border-border">
                <div className="text-center">
                  <span className={fc}>{data.displacement || "—"}</span>
                  {canEdit && <span className="block font-mono text-[8px] text-muted-foreground mt-0.5">Auto-linked from Ship Major Dimensions</span>}
                </div>
              </td>
              {/* Fixed values */}
              <td className="px-3 py-2 border-r border-border"><span className={fc}>{BE_VELOCITY.toFixed(2)}</span></td>
              <td className="px-3 py-2 border-r border-border"><span className={fc}>{BE_CM.toFixed(2)}</span></td>
              <td className="px-3 py-2 border-r border-border"><span className={fc}>{BE_CE.toFixed(2)}</span></td>
              <td className="px-3 py-2 border-r border-border"><span className={fc}>{BE_CC.toFixed(2)}</span></td>
              <td className="px-3 py-2 border-r border-border"><span className={fc}>{BE_CS.toFixed(2)}</span></td>
              {/* Berthing Energy — calculated */}
              <td className="px-3 py-2 border-r border-border"><span className={fc}>{energy}</span></td>
              {/* Fender Energy Capacity — fixed */}
              <td className="px-3 py-2 border-r border-border"><span className={fc}>{BE_FENDER_CAPACITY.toFixed(1)}</span></td>
              {/* Remark — calculated */}
              <td className="px-2 py-1.5">
                {remarkPct === null ? (
                  <span className={fc}>—</span>
                ) : (
                  <span className={`block text-center font-mono text-xs font-bold px-2 py-1 rounded ${
                    isAcceptable
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-400"
                      : "bg-red-100 text-red-700 border border-red-400"
                  }`}>
                    {remarkPct}% — {isAcceptable ? "Acceptable" : "Unacceptable"}
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground">
        * Berthing Energy (kN·m) = ½ × (Displacement × 1000 / 9.81) × {BE_VELOCITY}² × {BE_CM} × {BE_CE} × {BE_CC} × {BE_CS} / 1000 × {BE_SAFETY_FACTOR} (safety factor)
        &nbsp;|&nbsp; Remark (%) = Berthing Energy ÷ {BE_FENDER_CAPACITY} × 100 — Acceptable if ≤ 100%
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  canEdit: boolean;
  flatBodyData: FlatBodyData;
  fenderReactionData: FenderReactionData;
  berthingEnergyData: BerthingEnergyData;
  onFlatBodyChange: (data: FlatBodyData) => void;
  onFenderReactionChange: (data: FenderReactionData) => void;
  onBerthingEnergyChange: (data: BerthingEnergyData) => void;
}

type SubTab = "flat_body" | "fender_reaction" | "berthing_energy";

export function FenderFlatBodySection({ canEdit, flatBodyData, fenderReactionData, berthingEnergyData, onFlatBodyChange, onFenderReactionChange, onBerthingEnergyChange }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("flat_body");

  const fb = flatBodyData ?? defaultFlatBodyData();
  const fr = fenderReactionData ?? defaultFenderReactionData();
  const be = berthingEnergyData ?? defaultBerthingEnergyData();

  const flatBodyComplete =
    !!fb.vapourManifoldOffset.trim() &&
    !!fb.ballastFwd.trim() && !!fb.ballastAft.trim() &&
    !!fb.loadedFwd.trim() && !!fb.loadedAft.trim() &&
    !!fb.upperDeckFwd.trim() && !!fb.upperDeckAft.trim();

  const fenderReactionComplete =
    !!fr.allowableHullPressure.trim() &&
    [...fr.ballastDraft, ...fr.loadedDraft].every(r => !!r.reactionForce.trim() && !!r.areaContactPct.trim());

  const berthingEnergyComplete = !!be.displacement.trim();

  const tabs: { key: SubTab; label: string; complete: boolean }[] = [
    { key: "flat_body",       label: "Flat Body",       complete: flatBodyComplete       },
    { key: "fender_reaction", label: "Fender Reaction", complete: fenderReactionComplete },
    { key: "berthing_energy", label: "Berthing Energy", complete: berthingEnergyComplete },
  ];

  return (
    <div className="border border-border rounded bg-card overflow-hidden mb-6">
      {/* Sub-tab bar */}
      <div className="flex border-b border-border bg-secondary/30">
        {tabs.map(t => {
          const isActive = subTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest transition-all border-b-2 -mb-px ${
                isActive ? "border-primary text-primary bg-card" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
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
        {subTab === "flat_body" && (
          <FlatBodyTab data={flatBodyData} canEdit={canEdit} onChange={onFlatBodyChange} />
        )}
        {subTab === "fender_reaction" && (
          <FenderReactionTab data={fenderReactionData} canEdit={canEdit} onChange={onFenderReactionChange} />
        )}
        {subTab === "berthing_energy" && (
          <BerthingEnergyTab data={berthingEnergyData} canEdit={canEdit} onChange={onBerthingEnergyChange} />
        )}
      </div>
    </div>
  );
}
