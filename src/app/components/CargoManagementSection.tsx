import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PumpEntry {
  fillRate: string;
  totalPumps: string;
}

export interface CompressorEntry {
  units: string;
  rate: string;
  pressure: string;
}

export interface CargoPumpData {
  cargoPump: PumpEntry;
  sprayPump: PumpEntry;
  emergencyCargoPump: PumpEntry;
  highDutyCompressor: CompressorEntry;
}

export interface GasSystemEntry {
  capacity: string;
  timeStart: string;
  timeStop: string;
}

export interface GasManagementData {
  gcu: GasSystemEntry;
  gasBurning: GasSystemEntry;
  reliquefaction: GasSystemEntry;
}

export interface CargoManagementData {
  cargoPump: CargoPumpData;
  gasManagement: GasManagementData;
}

function defaultPumpEntry(): PumpEntry {
  return { fillRate: "", totalPumps: "" };
}

function defaultCompressorEntry(): CompressorEntry {
  return { units: "", rate: "", pressure: "" };
}

function defaultGasSystemEntry(): GasSystemEntry {
  return { capacity: "", timeStart: "", timeStop: "" };
}

export function defaultCargoPumpData(): CargoPumpData {
  return {
    cargoPump: defaultPumpEntry(),
    sprayPump: defaultPumpEntry(),
    emergencyCargoPump: defaultPumpEntry(),
    highDutyCompressor: defaultCompressorEntry(),
  };
}

export function defaultGasManagementData(): GasManagementData {
  return {
    gcu: defaultGasSystemEntry(),
    gasBurning: defaultGasSystemEntry(),
    reliquefaction: defaultGasSystemEntry(),
  };
}

export function defaultCargoManagementData(): CargoManagementData {
  return {
    cargoPump: defaultCargoPumpData(),
    gasManagement: defaultGasManagementData(),
  };
}

export function isCargoManagementComplete(data: CargoManagementData | undefined): boolean {
  const d = data ?? defaultCargoManagementData();
  const cp = d.cargoPump;
  const pumpOk =
    !!cp.cargoPump.fillRate && !!cp.cargoPump.totalPumps &&
    !!cp.sprayPump.fillRate && !!cp.sprayPump.totalPumps &&
    !!cp.emergencyCargoPump.fillRate && !!cp.emergencyCargoPump.totalPumps &&
    !!cp.highDutyCompressor.units && !!cp.highDutyCompressor.rate && !!cp.highDutyCompressor.pressure;
  const gm = d.gasManagement;
  const gasOk =
    !!gm.gcu.capacity && !!gm.gcu.timeStart && !!gm.gcu.timeStop &&
    !!gm.gasBurning.capacity && !!gm.gasBurning.timeStart && !!gm.gasBurning.timeStop &&
    !!gm.reliquefaction.capacity && !!gm.reliquefaction.timeStart && !!gm.reliquefaction.timeStop;
  return pumpOk && gasOk;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const yi = "w-full bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono";
const ro = "font-mono text-xs text-foreground";

// ─── Main Component ───────────────────────────────────────────────────────────

type SubTab = "cargo_pump" | "gas_management";

interface Props {
  canEdit: boolean;
  data: CargoManagementData;
  onChange: (d: CargoManagementData) => void;
}

export function CargoManagementSection({ canEdit, data: dataProp, onChange }: Props) {
  const data = dataProp ?? defaultCargoManagementData();
  const [subTab, setSubTab] = useState<SubTab>("cargo_pump");

  const cp = data.cargoPump ?? defaultCargoPumpData();
  const gm = data.gasManagement ?? defaultGasManagementData();

  const setPump = (key: keyof CargoPumpData, f: string, v: string) =>
    onChange({ ...data, cargoPump: { ...cp, [key]: { ...(cp[key] as object), [f]: v } } });

  const setGas = (key: keyof GasManagementData, f: string, v: string) =>
    onChange({ ...data, gasManagement: { ...gm, [key]: { ...(gm[key] as object), [f]: v } } });

  const pumpComplete =
    !!cp.cargoPump.fillRate && !!cp.cargoPump.totalPumps &&
    !!cp.sprayPump.fillRate && !!cp.sprayPump.totalPumps &&
    !!cp.emergencyCargoPump.fillRate && !!cp.emergencyCargoPump.totalPumps &&
    !!cp.highDutyCompressor.units && !!cp.highDutyCompressor.rate && !!cp.highDutyCompressor.pressure;

  const gasComplete =
    !!gm.gcu.capacity && !!gm.gcu.timeStart && !!gm.gcu.timeStop &&
    !!gm.gasBurning.capacity && !!gm.gasBurning.timeStart && !!gm.gasBurning.timeStop &&
    !!gm.reliquefaction.capacity && !!gm.reliquefaction.timeStart && !!gm.reliquefaction.timeStop;

  const tabs: { key: SubTab; label: string; complete: boolean }[] = [
    { key: "cargo_pump",      label: "Cargo Pump / Compressor", complete: pumpComplete },
    { key: "gas_management",  label: "Gas Management System",   complete: gasComplete  },
  ];

  const Field = ({ value, onChange: onCh, placeholder = "—" }: { value: string; onChange: (v: string) => void; placeholder?: string }) =>
    canEdit
      ? <input type="number" value={value ?? ""} onChange={e => onCh(e.target.value)} placeholder={placeholder} step="0.01" className={yi} />
      : <span className={ro}>{value || "—"}</span>;

  const TextField = ({ value, onChange: onCh }: { value: string; onChange: (v: string) => void }) =>
    canEdit
      ? <input type="text" value={value ?? ""} onChange={e => onCh(e.target.value)} placeholder="—" className={yi} />
      : <span className={ro}>{value || "—"}</span>;

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

      {/* ── Cargo Pump / Compressor ── */}
      {subTab === "cargo_pump" && (
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="px-4 py-2.5 text-left font-mono font-bold text-foreground border-r border-border w-52">Equipment</th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border">Fill Rate<br /><span className="font-normal text-[9px] text-muted-foreground">(m³/hr)</span></th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border">Total Pumps<br /><span className="font-normal text-[9px] text-muted-foreground">(sets)</span></th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border">Units</th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border">Rate<br /><span className="font-normal text-[9px] text-muted-foreground">(m³/hr)</span></th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground">Pressure<br /><span className="font-normal text-[9px] text-muted-foreground">(barg)</span></th>
                </tr>
              </thead>
              <tbody>
                {/* Cargo Pump */}
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">Cargo Pump</td>
                  <td className="px-3 py-1.5 border-r border-border"><Field value={cp.cargoPump.fillRate} onChange={v => setPump("cargoPump", "fillRate", v)} /></td>
                  <td className="px-3 py-1.5 border-r border-border"><Field value={cp.cargoPump.totalPumps} onChange={v => setPump("cargoPump", "totalPumps", v)} /></td>
                  <td className="px-3 py-1.5 border-r border-border text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                  <td className="px-3 py-1.5 border-r border-border text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                  <td className="px-3 py-1.5 text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                </tr>
                {/* Spray Pump */}
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">Spray Pump</td>
                  <td className="px-3 py-1.5 border-r border-border"><Field value={cp.sprayPump.fillRate} onChange={v => setPump("sprayPump", "fillRate", v)} /></td>
                  <td className="px-3 py-1.5 border-r border-border"><Field value={cp.sprayPump.totalPumps} onChange={v => setPump("sprayPump", "totalPumps", v)} /></td>
                  <td className="px-3 py-1.5 border-r border-border text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                  <td className="px-3 py-1.5 border-r border-border text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                  <td className="px-3 py-1.5 text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                </tr>
                {/* Emergency Cargo Pump */}
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">Emergency Cargo Pump</td>
                  <td className="px-3 py-1.5 border-r border-border"><Field value={cp.emergencyCargoPump.fillRate} onChange={v => setPump("emergencyCargoPump", "fillRate", v)} /></td>
                  <td className="px-3 py-1.5 border-r border-border"><Field value={cp.emergencyCargoPump.totalPumps} onChange={v => setPump("emergencyCargoPump", "totalPumps", v)} /></td>
                  <td className="px-3 py-1.5 border-r border-border text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                  <td className="px-3 py-1.5 border-r border-border text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                  <td className="px-3 py-1.5 text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                </tr>
                {/* High Duty Compressor */}
                <tr>
                  <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">High Duty Compressor</td>
                  <td className="px-3 py-1.5 border-r border-border text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                  <td className="px-3 py-1.5 border-r border-border text-center"><span className="font-mono text-xs text-muted-foreground">—</span></td>
                  <td className="px-3 py-1.5 border-r border-border"><Field value={cp.highDutyCompressor.units} onChange={v => setPump("highDutyCompressor", "units", v)} /></td>
                  <td className="px-3 py-1.5 border-r border-border"><Field value={cp.highDutyCompressor.rate} onChange={v => setPump("highDutyCompressor", "rate", v)} /></td>
                  <td className="px-3 py-1.5"><Field value={cp.highDutyCompressor.pressure} onChange={v => setPump("highDutyCompressor", "pressure", v)} /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-3 px-1">Fill Rate in m³/hr · Total Pumps in sets · Units count · Rate in m³/hr · Pressure in barg</p>
        </div>
      )}

      {/* ── Gas Management System ── */}
      {subTab === "gas_management" && (
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="px-4 py-2.5 text-left font-mono font-bold text-foreground border-r border-border w-44">System</th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border">Capacity</th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border">Time to Start<br /><span className="font-normal text-[9px] text-muted-foreground">(min)</span></th>
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground">Time to Stop<br /><span className="font-normal text-[9px] text-muted-foreground">(min)</span></th>
                </tr>
              </thead>
              <tbody>
                {([
                  { label: "GCU",            key: "gcu"            as keyof GasManagementData },
                  { label: "Gas Burning",    key: "gasBurning"     as keyof GasManagementData },
                  { label: "Reliquefaction", key: "reliquefaction" as keyof GasManagementData },
                ] as const).map(({ label, key }) => {
                  const entry = gm[key];
                  return (
                    <tr key={key} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">{label}</td>
                      <td className="px-3 py-1.5 border-r border-border">
                        <TextField value={entry.capacity} onChange={v => setGas(key, "capacity", v)} />
                      </td>
                      <td className="px-3 py-1.5 border-r border-border">
                        <Field value={entry.timeStart} onChange={v => setGas(key, "timeStart", v)} />
                      </td>
                      <td className="px-3 py-1.5">
                        <Field value={entry.timeStop} onChange={v => setGas(key, "timeStop", v)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-3 px-1">Capacity in appropriate units · Start/Stop times in minutes</p>
        </div>
      )}

    </div>
  );
}
