// ─── Types ────────────────────────────────────────────────────────────────────

import sdpCriteria from "../../imports/image-14.png";

export interface SDPData {
  outsideDiameter: string;    // mm  — criteria: 595 ≤ value ≤ 598.5
  flangeThickness: string;    // mm  — criteria: 36.6 ≤ value ≤ 41
  raisedFace: string;         // mm  — criteria: 460 ≤ value ≤ 470
  insideDiameter: string;     // mm  — criteria: value ≤ 387
  surfaceFinishMax: string;   // Ra μm — criteria: ≤ 12.5
  surfaceFinishMin: string;   // Ra μm — criteria: ≥ 3.2
  actualSDP: string;          // units / count — no criteria
}

export function defaultSDPData(): SDPData {
  return {
    outsideDiameter: "",
    flangeThickness: "",
    raisedFace: "",
    insideDiameter: "",
    surfaceFinishMax: "",
    surfaceFinishMin: "",
    actualSDP: "",
  };
}

export function isSDPComplete(data: SDPData | undefined): boolean {
  const d = data ?? defaultSDPData();
  return (
    !!d.outsideDiameter && !!d.flangeThickness && !!d.raisedFace &&
    !!d.insideDiameter && !!d.surfaceFinishMax && !!d.surfaceFinishMin &&
    !!d.actualSDP
  );
}

// ─── Acceptance helpers ───────────────────────────────────────────────────────

type BadgeResult = "ok" | "fail";

function check(value: string, min: number | null, max: number | null): BadgeResult {
  if (!value) return "fail";
  const n = parseFloat(value);
  if (isNaN(n)) return "fail";
  if (min !== null && n < min) return "fail";
  if (max !== null && n > max) return "fail";
  return "ok";
}

function Badge({ result }: { result: BadgeResult }) {
  if (result === "ok")
    return <span className="border border-emerald-500 rounded px-3 py-1 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 whitespace-nowrap">Acceptable</span>;
  return <span className="border border-red-600 rounded px-3 py-1 text-xs font-mono font-bold text-red-600 bg-red-50 whitespace-nowrap">Unacceptable</span>;
}


// ─── Shared styles ────────────────────────────────────────────────────────────

const yi =
  "w-full bg-yellow-100 border border-yellow-400 rounded px-2.5 py-1.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 " +
  "focus:ring-yellow-400 transition-all font-mono";

const ro = "font-mono text-sm text-foreground";

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  canEdit: boolean;
  data: SDPData;
  onChange: (d: SDPData) => void;
}

export function SDPsSection({ canEdit, data: dp, onChange }: Props) {
  const data = dp ?? defaultSDPData();
  const set  = (f: keyof SDPData, v: string) => onChange({ ...data, [f]: v });

  // Acceptance results
  const odResult  = check(data.outsideDiameter, 595, 598.5);
  const thkResult = check(data.flangeThickness, 36.6, 41);
  const rfResult  = check(data.raisedFace, 460, 470);
  const idResult  = check(data.insideDiameter, null, 387);

  // Surface finish: both Max and Min must be in 3.2–12.5 μm; blank = fail
  const sfMaxN  = parseFloat(data.surfaceFinishMax);
  const sfMinN  = parseFloat(data.surfaceFinishMin);
  const sfResult: BadgeResult =
    data.surfaceFinishMax && data.surfaceFinishMin &&
    !isNaN(sfMaxN) && !isNaN(sfMinN) &&
    sfMaxN >= 3.2 && sfMaxN <= 12.5 &&
    sfMinN >= 3.2 && sfMinN <= 12.5
      ? "ok" : "fail";

  return (
    <div className="border border-border rounded bg-card overflow-hidden mb-6">

      {/* Section header */}
      <div className="border-b border-border bg-secondary/30 px-5 py-3">
        <p className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">
          Short Distance Pieces (SDPs)
        </p>
        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
          Part 9 — SDP dimensional check and acceptance criteria
        </p>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Criteria reference image (image-14) ── */}
        <div>
          <p className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Acceptance Criteria Reference — Berth 1 (PTTLNG Nong Fab)
          </p>
          <div className="border border-border rounded overflow-hidden bg-white">
            <img src={sdpCriteria} alt="SDP acceptance criteria table" className="w-full object-contain" />
          </div>
        </div>

        {/* ── Form table ── */}
        <div>
          {/* Yellow title header */}
          <div className="bg-yellow-400 rounded-t px-4 py-2 text-center">
            <span className="font-mono font-bold text-sm text-gray-900 italic">SDPs on board of</span>
          </div>

          <div className="border border-yellow-400 rounded-b overflow-hidden">
            <table className="w-full text-sm">
              <tbody>

                {/* Outside Diameter */}
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 font-mono font-bold italic text-[#1e3a8a] whitespace-nowrap w-52">Outside diameter</td>
                  <td className="px-2 py-2.5 text-center text-muted-foreground text-xs w-5">:</td>
                  <td className="px-3 py-1.5">
                    {canEdit
                      ? <input type="text" value={data.outsideDiameter} onChange={e => set("outsideDiameter", e.target.value)} className={yi} />
                      : <span className={ro}>{data.outsideDiameter || "—"}</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap w-12">mm</td>
                  <td className="px-3 py-2.5 text-right w-36">
                    <Badge result={odResult} />
                  </td>
                </tr>

                {/* Flange Thickness */}
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 font-mono font-bold italic text-[#1e3a8a] whitespace-nowrap">Flange Thickness</td>
                  <td className="px-2 py-2.5 text-center text-muted-foreground text-xs">:</td>
                  <td className="px-3 py-1.5">
                    {canEdit
                      ? <input type="text" value={data.flangeThickness} onChange={e => set("flangeThickness", e.target.value)} className={yi} />
                      : <span className={ro}>{data.flangeThickness || "—"}</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">mm</td>
                  <td className="px-3 py-2.5 text-right"><Badge result={thkResult} /></td>
                </tr>

                {/* Raised Face */}
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 font-mono font-bold italic text-[#1e3a8a] whitespace-nowrap">Raised Face</td>
                  <td className="px-2 py-2.5 text-center text-muted-foreground text-xs">:</td>
                  <td className="px-3 py-1.5">
                    {canEdit
                      ? <input type="text" value={data.raisedFace} onChange={e => set("raisedFace", e.target.value)} className={yi} />
                      : <span className={ro}>{data.raisedFace || "—"}</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">mm</td>
                  <td className="px-3 py-2.5 text-right"><Badge result={rfResult} /></td>
                </tr>

                {/* Inside Diameter */}
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 font-mono font-bold italic text-[#1e3a8a] whitespace-nowrap">Inside Diameter</td>
                  <td className="px-2 py-2.5 text-center text-muted-foreground text-xs">:</td>
                  <td className="px-3 py-1.5">
                    {canEdit
                      ? <input type="text" value={data.insideDiameter} onChange={e => set("insideDiameter", e.target.value)} className={yi} />
                      : <span className={ro}>{data.insideDiameter || "—"}</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">mm</td>
                  <td className="px-3 py-2.5 text-right"><Badge result={idResult} /></td>
                </tr>

                {/* Surface Finish — two sub-rows (Max Ra & Min Ra) */}
                <tr className="border-b border-border/50">
                  <td className="px-4 py-2 font-mono font-bold italic text-[#1e3a8a] whitespace-nowrap" rowSpan={2}>Surface Finish</td>
                  <td className="px-2 py-2 text-center text-muted-foreground text-xs">:</td>
                  <td className="px-3 py-1.5">
                    {canEdit
                      ? <input type="text" value={data.surfaceFinishMax} onChange={e => set("surfaceFinishMax", e.target.value)} className={yi} />
                      : <span className={ro}>{data.surfaceFinishMax || "—"}</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    <span className="block leading-tight">Max</span>
                    <span className="block leading-tight text-[10px]">Ra</span>
                  </td>
                  <td className="px-3 py-2 text-right" rowSpan={2}>
                    <Badge result={sfResult} />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-2 py-2 text-center text-muted-foreground text-xs">:</td>
                  <td className="px-3 py-1.5">
                    {canEdit
                      ? <input type="text" value={data.surfaceFinishMin} onChange={e => set("surfaceFinishMin", e.target.value)} className={yi} />
                      : <span className={ro}>{data.surfaceFinishMin || "—"}</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    <span className="block leading-tight">Min</span>
                    <span className="block leading-tight text-[10px]">Ra</span>
                  </td>
                </tr>

                {/* Actual SDP on board (STB) */}
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold italic text-[#1e3a8a] whitespace-nowrap">Actual SDP on board (STB)</td>
                  <td className="px-2 py-2.5 text-center text-muted-foreground text-xs">:</td>
                  <td className="px-3 py-1.5">
                    {canEdit
                      ? <input type="text" value={data.actualSDP} onChange={e => set("actualSDP", e.target.value)} className={yi} />
                      : <span className={ro}>{data.actualSDP || "—"}</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">Units</td>
                  <td className="px-3 py-2.5"/>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Criteria footnote */}
          <p className="font-mono text-[10px] text-muted-foreground mt-2 px-1">
            Ø OD: 595–598.5 mm · Flange Thk: 36.6–41 mm · Ø B: 460–470 mm · Ø ID: ≤ 387 mm · Surface finish: Ra 3.2–12.5 μm
          </p>
        </div>

      </div>
    </div>
  );
}
