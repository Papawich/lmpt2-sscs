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

export interface ShipShoreLinkData {
  opticalFibre: SSLSystemData;
  electric: SSLSystemData;
  pneumatic: PneumaticData;
  esd1Items: string[];
}

const ESD1_COUNT = 15;

function defaultSSLSystem(): SSLSystemData {
  return { manufacturer: "", connectionType: "", boxDistance: "", boxDirection: "" };
}

function defaultPneumatic(): PneumaticData {
  return { manufacturer: "", connectionType: "", boxDistance: "", boxDirection: "", airPressure: "" };
}

export function defaultShipShoreLinkData(): ShipShoreLinkData {
  return {
    opticalFibre: defaultSSLSystem(),
    electric: defaultSSLSystem(),
    pneumatic: defaultPneumatic(),
    esd1Items: Array(ESD1_COUNT).fill(""),
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
        <SystemForm
          data={of_}
          canEdit={canEdit}
          onChange={d => onChange({ ...data, opticalFibre: d })}
        />
      )}

      {/* ── Electric System ── */}
      {subTab === "electric" && (
        <SystemForm
          data={el_}
          canEdit={canEdit}
          onChange={d => onChange({ ...data, electric: d })}
        />
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
