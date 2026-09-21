// ─── Types ────────────────────────────────────────────────────────────────────

export interface FireFightingData {
  exposedDeck:       string;   // a. Exposed Deck
  loadingStation:    string;   // b. Loading Station
  accomHouse:        string;   // c. Accommodation House
  sidePlating:       string;   // d. Side Plating
  cargoMachineryRm:  string;   // e. Cargo Machinery Room
  cargoFrontDome:    string;   // f. Cargo Front Dome Part
}

export type AvailabilityValue = "" | "available" | "not_available";

export interface UtilitySupplyData {
  nitrogenService: AvailabilityValue;
  freshWater:      AvailabilityValue;
}

export interface UtilityData {
  fireFighting:  FireFightingData;
  utilitySupply: UtilitySupplyData;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export function defaultUtilityData(): UtilityData {
  return {
    fireFighting: {
      exposedDeck: "", loadingStation: "", accomHouse: "",
      sidePlating: "", cargoMachineryRm: "", cargoFrontDome: "",
    },
    utilitySupply: { nitrogenService: "", freshWater: "" },
  };
}

function normalizeAvailability(value: unknown): AvailabilityValue {
  if (value === true || value === "available") return "available";
  if (value === false || value === "not_available") return "not_available";
  return "";
}

export function isUtilityComplete(data: UtilityData | undefined): boolean {
  const d = data ?? defaultUtilityData();
  const ff = d.fireFighting;
  const nitrogen = normalizeAvailability((d.utilitySupply as any)?.nitrogenService);
  const freshWater = normalizeAvailability((d.utilitySupply as any)?.freshWater);
  return !!(ff.exposedDeck && ff.loadingStation && ff.accomHouse &&
            ff.sidePlating && ff.cargoMachineryRm && ff.cargoFrontDome &&
            nitrogen && freshWater);
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const yi =
  "w-full bg-yellow-100 border border-yellow-400 rounded px-2.5 py-1.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 " +
  "focus:ring-yellow-400 transition-all font-mono";

const ro = "font-mono text-sm text-foreground";

// ─── Fire fighting rows ───────────────────────────────────────────────────────

const FF_ROWS: { key: keyof FireFightingData; letter: string; label: string }[] = [
  { key: "exposedDeck",      letter: "a", label: "Exposed Deck"        },
  { key: "loadingStation",   letter: "b", label: "Loading Station"     },
  { key: "accomHouse",       letter: "c", label: "Accommodation House" },
  { key: "sidePlating",      letter: "d", label: "Side Plating"        },
  { key: "cargoMachineryRm", letter: "e", label: "Cargo Machinery Room" },
  { key: "cargoFrontDome",   letter: "f", label: "Cargo Front Dome Part" },
];

const LEGEND = [
  { abbr: "D/P", full: "Dry Powder"   },
  { abbr: "S/W", full: "Sea Water"    },
  { abbr: "W/S", full: "Water Spray"  },
  { abbr: "W/C", full: "Water Curtain" },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  canEdit: boolean;
  data: UtilityData;
  onChange: (d: UtilityData) => void;
}

export function UtilitySystemSection({ canEdit, data: dp, onChange }: Props) {
  const data = dp ?? defaultUtilityData();

  const setFF = (f: keyof FireFightingData, v: string) =>
    onChange({ ...data, fireFighting: { ...data.fireFighting, [f]: v } });

  const utilitySupply: UtilitySupplyData = {
    nitrogenService: normalizeAvailability((data.utilitySupply as any)?.nitrogenService),
    freshWater: normalizeAvailability((data.utilitySupply as any)?.freshWater),
  };

  const setUS = (f: keyof UtilitySupplyData, v: AvailabilityValue) =>
    onChange({ ...data, utilitySupply: { ...utilitySupply, [f]: v } });

  return (
    <div className="space-y-5 mb-6">
      <div className="border border-border rounded bg-card overflow-hidden">

        {/* Section header */}
        <div className="border-b border-border bg-secondary/30 px-5 py-3">
          <p className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">
            Utility System
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            Part 10 — Fire Fighting Systems &amp; Utility Supply
          </p>
        </div>

        <div className="p-5 space-y-6">

          {/* ── Subsection 1: Fire Fighting ── */}
          <div>
            <p className="font-mono text-xs font-bold text-foreground underline mb-3">
              1. Fire Fighting System
            </p>

            <div className="flex gap-6 items-start">

              {/* Left — 6 location rows */}
              <div className="flex-1 border border-border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {FF_ROWS.map(({ key, letter, label }, idx) => (
                      <tr key={key} className={idx < FF_ROWS.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-4 py-2.5 font-bold italic text-[#1e3a8a] whitespace-nowrap w-5 text-sm">
                          {letter}.
                        </td>
                        <td className="pr-3 py-2.5 font-bold italic text-[#1e3a8a] whitespace-nowrap text-sm w-52">
                          {label}
                        </td>
                        <td className="px-1 py-2.5 text-muted-foreground text-xs w-4">:</td>
                        <td className="px-3 py-1.5">
                          {canEdit
                            ? <input
                                type="text"
                                value={data.fireFighting[key]}
                                onChange={e => setFF(key, e.target.value)}
                                className={yi}
                                placeholder="e.g. D/P, S/W"
                              />
                            : <span className={ro}>{data.fireFighting[key] || "—"}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right — legend */}
              <div className="shrink-0 border border-border rounded overflow-hidden">
                <table className="text-sm">
                  <tbody>
                    {LEGEND.map(({ abbr, full }, idx) => (
                      <tr key={abbr} className={idx < LEGEND.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-4 py-2.5 font-bold italic text-[#1e3a8a] whitespace-nowrap text-sm">
                          {abbr}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground text-xs">:</td>
                        <td className="pr-5 py-2.5 font-bold italic text-[#1e3a8a] whitespace-nowrap text-sm">
                          {full}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* ── Subsection 2: Utility Supply ── */}
          <div>
            <p className="font-mono text-xs font-bold text-foreground underline mb-3">
              2. Utility Supply
            </p>
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-sm">
                <tbody>

                  {/* Nitrogen Service */}
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-bold italic text-[#1e3a8a] whitespace-nowrap w-5 text-sm">1.</td>
                    <td className="pr-3 py-3 font-bold italic text-[#1e3a8a] whitespace-nowrap text-sm w-52">Nitrogen Service</td>
                    <td className="px-1 py-3 text-muted-foreground text-xs w-4">:</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <div className="flex flex-wrap items-center gap-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={utilitySupply.nitrogenService === "available"}
                              onChange={e => setUS("nitrogenService", e.target.checked ? "available" : "")}
                              className="w-4 h-4 accent-[#1e3a8a] cursor-pointer"
                            />
                            <span className="font-mono text-xs text-foreground">Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={utilitySupply.nitrogenService === "not_available"}
                              onChange={e => setUS("nitrogenService", e.target.checked ? "not_available" : "")}
                              className="w-4 h-4 accent-[#1e3a8a] cursor-pointer"
                            />
                            <span className="font-mono text-xs text-foreground">Not Available</span>
                          </label>
                        </div>
                      ) : (
                        <span className={`font-mono text-sm ${utilitySupply.nitrogenService === "available" ? "text-emerald-600 font-bold" : "text-muted-foreground"}`}>
                          {utilitySupply.nitrogenService === "available" ? "Available" : utilitySupply.nitrogenService === "not_available" ? "Not Available" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Fresh Water */}
                  <tr>
                    <td className="px-4 py-3 font-bold italic text-[#1e3a8a] whitespace-nowrap text-sm">2.</td>
                    <td className="pr-3 py-3 font-bold italic text-[#1e3a8a] whitespace-nowrap text-sm">Fresh Water</td>
                    <td className="px-1 py-3 text-muted-foreground text-xs">:</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <div className="flex flex-wrap items-center gap-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={utilitySupply.freshWater === "available"}
                              onChange={e => setUS("freshWater", e.target.checked ? "available" : "")}
                              className="w-4 h-4 accent-[#1e3a8a] cursor-pointer"
                            />
                            <span className="font-mono text-xs text-foreground">Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={utilitySupply.freshWater === "not_available"}
                              onChange={e => setUS("freshWater", e.target.checked ? "not_available" : "")}
                              className="w-4 h-4 accent-[#1e3a8a] cursor-pointer"
                            />
                            <span className="font-mono text-xs text-foreground">Not Available</span>
                          </label>
                        </div>
                      ) : (
                        <span className={`font-mono text-sm ${utilitySupply.freshWater === "available" ? "text-emerald-600 font-bold" : "text-muted-foreground"}`}>
                          {utilitySupply.freshWater === "available" ? "Available" : utilitySupply.freshWater === "not_available" ? "Not Available" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
