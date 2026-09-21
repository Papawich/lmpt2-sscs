import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SSLSystemData {
  manufacturer: string;
  connectionType: string;
  boxDistance: string;
  boxDirection: "fwd" | "aft" | "";
}

export interface PneumaticData extends SSLSystemData {
  airPressure: string;
}

export type OpticalSignalOption = "" | "Telephon Chanel" | "ESD Chanel" | "Spare";
export type OpticalDirectionOption = "" | "Ship to Shore" | "Shore to Ship" | "Spare";

export interface OpticalSignalArrangementRow {
  shipSideSignal: OpticalSignalOption;
  shipSideDirection: OpticalDirectionOption;
}

export interface ElectricSignalArrangementRow {
  shoreSide: string;
  shipPinNo: string;
  shipSide: string;
}

export interface ShipShoreLinkData {
  opticalFibre: SSLSystemData;
  electric: SSLSystemData;
  pneumatic: PneumaticData;
  esd1Items: string[];
  opticalSignalArrangement: OpticalSignalArrangementRow[];
  electricSignalArrangement: ElectricSignalArrangementRow[];
}

const ESD1_COUNT = 15;
const OPTICAL_SIGNAL_COUNT = 6;
const ELECTRIC_SIGNAL_COUNT = 19;

function defaultSSLSystem(): SSLSystemData {
  return { manufacturer: "", connectionType: "", boxDistance: "", boxDirection: "" };
}

function defaultPneumatic(): PneumaticData {
  return { manufacturer: "", connectionType: "", boxDistance: "", boxDirection: "", airPressure: "" };
}

function defaultOpticalSignalArrangement(): OpticalSignalArrangementRow[] {
  return Array.from({ length: OPTICAL_SIGNAL_COUNT }, () => ({
    shipSideSignal: "",
    shipSideDirection: "",
  }));
}

function defaultElectricSignalArrangement(): ElectricSignalArrangementRow[] {
  return ELECTRIC_SHORE_SIDE_ROWS.map(row => ({
    shoreSide: row.shoreSide,
    shipPinNo: "",
    shipSide: "",
  }));
}

export function defaultShipShoreLinkData(): ShipShoreLinkData {
  return {
    opticalFibre: defaultSSLSystem(),
    electric: defaultSSLSystem(),
    pneumatic: defaultPneumatic(),
    esd1Items: Array(ESD1_COUNT).fill(""),
    opticalSignalArrangement: defaultOpticalSignalArrangement(),
    electricSignalArrangement: defaultElectricSignalArrangement(),
  };
}

export function isShipShoreLinkComplete(data: ShipShoreLinkData | undefined): boolean {
  const d = data ?? defaultShipShoreLinkData();
  const sysOk = (s: SSLSystemData) =>
    !!s.manufacturer && !!s.connectionType && !!s.boxDistance && !!s.boxDirection;
  return (
    sysOk(d.opticalFibre) &&
    sysOk(d.electric) &&
    sysOk(d.pneumatic) && !!d.pneumatic.airPressure &&
    d.esd1Items.some(v => !!v)
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const yi = "w-full bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono";
const ro = "font-mono text-sm text-foreground";

// ─── System Form (Optical / Electric / Pneumatic) ─────────────────────────────

function SystemForm<T extends SSLSystemData>({
  data, canEdit, onChange, extraFields,
}: {
  data: T;
  canEdit: boolean;
  onChange: (d: T) => void;
  extraFields?: React.ReactNode;
}) {
  const set = (f: keyof SSLSystemData, v: string) => onChange({ ...data, [f]: v } as T);

  const rows: { label: string; key: keyof SSLSystemData; placeholder: string }[] = [
    { label: "Manufacturer",         key: "manufacturer",   placeholder: "e.g. Trelleborg, JB Industries…" },
    { label: "Connection Type (Core)", key: "connectionType", placeholder: "e.g. 4-core, 8-core, duplex…"   },
  ];

  return (
    <div className="p-5 space-y-5">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary/30 border-b border-border">
              <th className="px-4 py-2.5 text-left font-mono font-bold text-foreground border-r border-border w-52">Field</th>
              <th className="px-4 py-2.5 text-left font-mono font-bold text-foreground">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, key, placeholder }) => (
              <tr key={key} className="border-b border-border">
                <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">{label}</td>
                <td className="px-3 py-1.5">
                  {canEdit
                    ? <input type="text" value={(data[key] as string) ?? ""} onChange={e => set(key, e.target.value)} placeholder={placeholder} className={yi} />
                    : <span className={ro}>{(data[key] as string) || "—"}</span>}
                </td>
              </tr>
            ))}

            {/* Box position row */}
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">Box Position</td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  {canEdit ? (
                    <input
                      type="number" step="0.01"
                      value={data.boxDistance ?? ""}
                      onChange={e => set("boxDistance", e.target.value)}
                      placeholder="0.00"
                      className="w-32 bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono"
                    />
                  ) : (
                    <span className={ro}>{data.boxDistance ? Number(data.boxDistance).toFixed(2) : "—"}</span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">m. from vapor line</span>

                  {/* Fwd / Aft direction checkboxes */}
                  <div className="flex items-center gap-4">
                    {(["fwd", "aft"] as const).map(dir => {
                      const checked = data.boxDirection === dir;
                      return (
                        <label key={dir} className={`flex items-center gap-1.5 cursor-pointer select-none ${canEdit ? "" : "pointer-events-none"}`}>
                          <span
                            onClick={() => canEdit && set("boxDirection", checked ? "" : dir)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              checked
                                ? "bg-yellow-400 border-yellow-500"
                                : "border-border bg-secondary/50 hover:border-yellow-400"
                            }`}
                          >
                            {checked && <span className="text-[9px] text-gray-900 font-bold leading-none">✓</span>}
                          </span>
                          <span className="font-mono text-xs font-bold uppercase text-foreground">{dir}</span>
                        </label>
                      );
                    })}
                  </div>

                  {!canEdit && data.boxDirection && (
                    <span className="font-mono text-xs font-bold uppercase text-foreground border border-border rounded px-2 py-0.5 bg-secondary/50">{data.boxDirection}</span>
                  )}
                </div>
              </td>
            </tr>

            {/* Extra fields slot (for pneumatic air pressure) */}
            {extraFields}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Signal arrangement tables ────────────────────────────────────────────────

const OPTICAL_SHORE_SIDE_ROWS = [
  { ferrule: "1", signal: "Telephone Channel", direction: "Ship > Shore" },
  { ferrule: "2", signal: "Telephone Channel", direction: "Shore > Ship" },
  { ferrule: "3", signal: "ESD Channel",       direction: "Ship > Shore" },
  { ferrule: "4", signal: "ESD Channel",       direction: "Shore > Ship" },
  { ferrule: "5", signal: "Spare",             direction: "Ship > Shore" },
  { ferrule: "6", signal: "Spare",             direction: "Shore > Ship" },
] as const;

const ELECTRIC_SHORE_SIDE_ROWS = [
  { pin: "1,2",      shoreSide: "NOT USED" },
  { pin: "3,4",      shoreSide: "SPARE" },
  { pin: "5,6",      shoreSide: "ELEC TEL HOT PHONE" },
  { pin: "7,8",      shoreSide: "ELEC TEL PUBLIC PHONE" },
  { pin: "9,10",     shoreSide: "ELEC TEL PLANT PHONE (PABX)" },
  { pin: "11,12",    shoreSide: "NOT USED" },
  { pin: "13,14",    shoreSide: "SHORE TO SHIP ESD" },
  { pin: "15,16",    shoreSide: "SHIP TO SHORE ESD" },
  { pin: "17,18",    shoreSide: "UMBILICAL CONTINUITY LINK" },
  { pin: "19,20",    shoreSide: "UMBILICAL CONTINUITY LINK" },
  { pin: "21,22",    shoreSide: "SPARE" },
  { pin: "23,24",    shoreSide: "SPARE" },
  { pin: "25,26",    shoreSide: "SPARE" },
  { pin: "27,28",    shoreSide: "SPARE" },
  { pin: "29,30",    shoreSide: "IS POWER FOR SHORE ETU" },
  { pin: "31,32,33", shoreSide: "RS232 INTERFACE (FOR MLM)" },
  { pin: "34",       shoreSide: "RS232 INTERFACE (FOR MLM)" },
  { pin: "35,36",    shoreSide: "RESERVED FOR SHIP ETU" },
  { pin: "37",       shoreSide: "SPARE" },
] as const;

const OPTICAL_SIGNAL_OPTIONS: OpticalSignalOption[] = ["", "Telephon Chanel", "ESD Chanel", "Spare"];
const OPTICAL_DIRECTION_OPTIONS: OpticalDirectionOption[] = ["", "Ship to Shore", "Shore to Ship", "Spare"];

function OpticalSignalArrangementTable({
  rows,
  canEdit,
  onChange,
}: {
  rows: OpticalSignalArrangementRow[];
  canEdit: boolean;
  onChange: (rows: OpticalSignalArrangementRow[]) => void;
}) {
  const updateSignal = (index: number, value: OpticalSignalOption) => {
    onChange(rows.map((row, i) => i === index ? { ...row, shipSideSignal: value } : row));
  };

  const updateDirection = (index: number, value: OpticalDirectionOption) => {
    onChange(rows.map((row, i) => i === index ? { ...row, shipSideDirection: value } : row));
  };

  return (
    <div className="px-5 pb-5">
      <div className="font-mono text-xs font-bold italic text-foreground mb-2">
        Table 1. Optical Fiber System Signal Arrangement (Shore Side / Ship Side)
      </div>
      <div className="overflow-x-auto border border-border rounded">
        <table className="w-full min-w-[780px] text-xs border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border">
              <th rowSpan={2} className="px-3 py-2 text-center font-mono font-bold border-r border-border w-24">Ferrule No.</th>
              <th colSpan={2} className="px-3 py-2 text-center font-mono font-bold border-r border-border">Shore Side</th>
              <th colSpan={2} className="px-3 py-2 text-center font-mono font-bold">Ship Side</th>
            </tr>
            <tr className="bg-secondary/30 border-b border-border">
              <th className="px-3 py-2 text-center font-mono font-bold border-r border-border">Signal</th>
              <th className="px-3 py-2 text-center font-mono font-bold border-r border-border">Direction</th>
              <th className="px-3 py-2 text-center font-mono font-bold border-r border-border">Signal</th>
              <th className="px-3 py-2 text-center font-mono font-bold">Direction</th>
            </tr>
          </thead>
          <tbody>
            {OPTICAL_SHORE_SIDE_ROWS.map((shore, i) => {
              const row = rows[i] ?? { shipSideSignal: "", shipSideDirection: "" };
              return (
                <tr key={shore.ferrule} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-center font-mono font-bold border-r border-border bg-secondary/20">{shore.ferrule}</td>
                  <td className="px-3 py-2 font-mono border-r border-border">{shore.signal}</td>
                  <td className="px-3 py-2 font-mono border-r border-border">{shore.direction}</td>
                  <td className="px-2 py-1.5 border-r border-border">
                    {canEdit ? (
                      <select
                        value={row.shipSideSignal}
                        onChange={e => updateSignal(i, e.target.value as OpticalSignalOption)}
                        className={yi}
                      >
                        {OPTICAL_SIGNAL_OPTIONS.map(option => <option key={option || "blank"} value={option}>{option || "Select..."}</option>)}
                      </select>
                    ) : (
                      <span className={ro}>{row.shipSideSignal || "—"}</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {canEdit ? (
                      <select
                        value={row.shipSideDirection}
                        onChange={e => updateDirection(i, e.target.value as OpticalDirectionOption)}
                        className={yi}
                      >
                        {OPTICAL_DIRECTION_OPTIONS.map(option => <option key={option || "blank"} value={option}>{option || "Select..."}</option>)}
                      </select>
                    ) : (
                      <span className={ro}>{row.shipSideDirection || "—"}</span>
                    )}
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

function ElectricSignalArrangementTable({
  rows,
  canEdit,
  onChange,
}: {
  rows: ElectricSignalArrangementRow[];
  canEdit: boolean;
  onChange: (rows: ElectricSignalArrangementRow[]) => void;
}) {
  const update = (index: number, key: keyof ElectricSignalArrangementRow, value: string) => {
    onChange(rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  };

  return (
    <div className="px-5 pb-5">
      <div className="font-mono text-xs font-bold italic text-foreground mb-2">
        Table 2. Electric System Signal Arrangement (Shore Side / Ship Side)
      </div>
      <div className="overflow-x-auto border border-border rounded">
        <table className="w-full min-w-[760px] text-xs border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border">
              <th className="px-3 py-2 text-center font-mono font-bold border-r border-border w-24">Pin No.</th>
              <th className="px-3 py-2 text-center font-mono font-bold border-r border-border">Shore Side</th>
              <th className="px-3 py-2 text-center font-mono font-bold border-r border-border w-24">Pin No.</th>
              <th className="px-3 py-2 text-center font-mono font-bold">Ship Side</th>
            </tr>
          </thead>
          <tbody>
            {ELECTRIC_SHORE_SIDE_ROWS.map((shore, i) => {
              const row = rows[i] ?? { shoreSide: shore.shoreSide, shipPinNo: "", shipSide: "" };
              return (
                <tr key={shore.pin} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-center font-mono font-bold border-r border-border bg-secondary/20">{shore.pin}</td>
                  <td className="px-3 py-2 font-mono border-r border-border bg-secondary/10">
                    {shore.shoreSide}
                  </td>
                  <td className="px-2 py-1.5 border-r border-border">
                    {canEdit ? (
                      <input
                        type="text"
                        value={row.shipPinNo}
                        onChange={e => update(i, "shipPinNo", e.target.value)}
                        placeholder="Enter ship pin no."
                        className={yi}
                      />
                    ) : (
                      <span className={ro}>{row.shipPinNo || "—"}</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {canEdit ? (
                      <input
                        type="text"
                        value={row.shipSide}
                        onChange={e => update(i, "shipSide", e.target.value)}
                        placeholder="Enter ship-side signal / function"
                        className={yi}
                      />
                    ) : (
                      <span className={ro}>{row.shipSide || "—"}</span>
                    )}
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

// ─── Main Component ───────────────────────────────────────────────────────────

type SubTab = "optical_fibre" | "electric" | "pneumatic" | "esd1";

interface Props {
  canEdit: boolean;
  data: ShipShoreLinkData;
  onChange: (d: ShipShoreLinkData) => void;
}

export function ShipShoreLinkSection({ canEdit, data: dataProp, onChange }: Props) {
  const data = dataProp ?? defaultShipShoreLinkData();
  const [subTab, setSubTab] = useState<SubTab>("optical_fibre");

  const of_ = data.opticalFibre ?? defaultSSLSystem();
  const el_ = data.electric    ?? defaultSSLSystem();
  const pn_ = data.pneumatic   ?? defaultPneumatic();
  const esd = data.esd1Items?.length === ESD1_COUNT ? data.esd1Items : Array(ESD1_COUNT).fill("");
  const opticalSignals = data.opticalSignalArrangement?.length === OPTICAL_SIGNAL_COUNT
    ? data.opticalSignalArrangement
    : defaultOpticalSignalArrangement();
  const electricSignals = data.electricSignalArrangement?.length === ELECTRIC_SIGNAL_COUNT
    ? data.electricSignalArrangement.map((row, i) => ({
        ...row,
        shoreSide: ELECTRIC_SHORE_SIDE_ROWS[i]?.shoreSide ?? row.shoreSide ?? "",
      }))
    : defaultElectricSignalArrangement();

  const sysComplete = (s: SSLSystemData) =>
    !!s.manufacturer && !!s.connectionType && !!s.boxDistance && !!s.boxDirection;

  const ofComplete  = sysComplete(of_);
  const elComplete  = sysComplete(el_);
  const pnComplete  = sysComplete(pn_) && !!pn_.airPressure;
  const esdComplete = esd.some(v => !!v);

  const tabs: { key: SubTab; label: string; complete: boolean }[] = [
    { key: "optical_fibre", label: "Optical Fibre System", complete: ofComplete  },
    { key: "electric",      label: "Electric System",      complete: elComplete  },
    { key: "pneumatic",     label: "Pneumatic System",     complete: pnComplete  },
    { key: "esd1",          label: "ESD 1 Activated by",   complete: esdComplete },
  ];

  const yi2 = "w-full bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono";

  return (
    <div className="border border-border rounded bg-card overflow-hidden mb-6">

      {/* Sub-tab bar */}
      <div className="flex border-b border-border bg-secondary/30 overflow-x-auto">
        {tabs.map(t => {
          const isActive = subTab === t.key;
          return (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest transition-all border-b-2 -mb-px whitespace-nowrap ${
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

      {/* ── Optical Fibre System ── */}
      {subTab === "optical_fibre" && (
        <>
          <SystemForm
            data={of_}
            canEdit={canEdit}
            onChange={d => onChange({ ...data, opticalFibre: d })}
          />
          <OpticalSignalArrangementTable
            rows={opticalSignals}
            canEdit={canEdit}
            onChange={rows => onChange({ ...data, opticalSignalArrangement: rows })}
          />
        </>
      )}

      {/* ── Electric System ── */}
      {subTab === "electric" && (
        <>
          <SystemForm
            data={el_}
            canEdit={canEdit}
            onChange={d => onChange({ ...data, electric: d })}
          />
          <ElectricSignalArrangementTable
            rows={electricSignals}
            canEdit={canEdit}
            onChange={rows => onChange({ ...data, electricSignalArrangement: rows })}
          />
        </>
      )}

      {/* ── Pneumatic System ── */}
      {subTab === "pneumatic" && (
        <SystemForm
          data={pn_}
          canEdit={canEdit}
          onChange={d => onChange({ ...data, pneumatic: d as PneumaticData })}
          extraFields={
            <tr className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-mono font-bold text-xs text-foreground border-r border-border whitespace-nowrap">Air Pressure</td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <input
                      type="number" step="0.01"
                      value={pn_.airPressure ?? ""}
                      onChange={e => onChange({ ...data, pneumatic: { ...pn_, airPressure: e.target.value } })}
                      placeholder="0.00"
                      className="w-32 bg-yellow-100 border border-yellow-400 rounded px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono"
                    />
                  ) : (
                    <span className="font-mono text-sm text-foreground">{pn_.airPressure ? Number(pn_.airPressure).toFixed(2) : "—"}</span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">barg</span>
                </div>
              </td>
            </tr>
          }
        />
      )}

      {/* ── ESD 1 Activated by ── */}
      {subTab === "esd1" && (
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="px-4 py-2.5 text-center font-mono font-bold text-foreground border-r border-border w-16">No.</th>
                  <th className="px-4 py-2.5 text-left font-mono font-bold text-foreground">ESD 1 Activated by</th>
                </tr>
              </thead>
              <tbody>
                {esd.map((val, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-1.5 font-mono text-xs text-muted-foreground text-center border-r border-border">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      {canEdit ? (
                        <input
                          type="text"
                          value={val ?? ""}
                          onChange={e => {
                            const updated = esd.map((v, idx) => idx === i ? e.target.value : v);
                            onChange({ ...data, esd1Items: updated });
                          }}
                          placeholder="—"
                          className={yi2}
                        />
                      ) : (
                        <span className="font-mono text-sm text-foreground">{val || <span className="text-muted-foreground">—</span>}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-3 px-1">Items may be left blank if not applicable.</p>
        </div>
      )}

    </div>
  );
}
