import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LevelSensorData {
  type: "float_gauge" | "radar_gauge";
  manufacturer: string;
  accuracy: string;
  certifiedBy: string;
  issuedDate: string;
}

export interface TempSensorData {
  accuracyRange1: string;   // at -145 to -165 °C  → ≤ 0.2 °C
  accuracyRange2: string;   // at -50 to -145 °C   → ≤ 1.5 °C
  certifiedBy: string;
  issuedDate: string;
}

export interface PressureSensorData {
  accuracy: string;         // % → ≤ 1 %
  certifiedBy: string;
  issuedDate: string;
}

export interface CTMSData {
  primaryLevel:   LevelSensorData;
  secondaryLevel: LevelSensorData;
  temperature:    TempSensorData;
  pressure:       PressureSensorData;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultLevelSensor(): LevelSensorData {
  return { type: "radar_gauge", manufacturer: "", accuracy: "", certifiedBy: "", issuedDate: "" };
}
function defaultTempSensor(): TempSensorData {
  return { accuracyRange1: "", accuracyRange2: "", certifiedBy: "", issuedDate: "" };
}
function defaultPressureSensor(): PressureSensorData {
  return { accuracy: "", certifiedBy: "", issuedDate: "" };
}
export function defaultCTMSData(): CTMSData {
  return {
    primaryLevel:   defaultLevelSensor(),
    secondaryLevel: defaultLevelSensor(),
    temperature:    defaultTempSensor(),
    pressure:       defaultPressureSensor(),
  };
}

export function isCTMSComplete(data: CTMSData | undefined): boolean {
  const d = data ?? defaultCTMSData();
  const lvl = (s: LevelSensorData) => !!s.accuracy && !!s.certifiedBy && !!s.issuedDate;
  return (
    lvl(d.primaryLevel) && lvl(d.secondaryLevel) &&
    !!d.temperature.accuracyRange1 && !!d.temperature.accuracyRange2 &&
    !!d.temperature.certifiedBy && !!d.temperature.issuedDate &&
    !!d.pressure.accuracy && !!d.pressure.certifiedBy && !!d.pressure.issuedDate
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const yi =
  "w-full bg-yellow-100 border border-yellow-400 rounded px-2.5 py-1.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all font-mono";

const ro = "font-mono text-sm text-foreground";

// ─── Accept badge ─────────────────────────────────────────────────────────────

function AcceptBadge({ value, threshold }: { value: string; threshold: number }) {
  const num = parseFloat(value);
  const ok = !!value && !isNaN(num) && num <= threshold;
  return (
    <span className={`border rounded px-3 py-1 text-xs font-mono font-bold whitespace-nowrap ${
      ok ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-red-500 text-red-600 bg-red-50"
    }`}>
      {ok ? "Acceptable" : "Unacceptable"}
    </span>
  );
}

// Temperature accept badge (two ranges — both must pass; blank = Unacceptable)
function TempAcceptBadge({ r1, r2 }: { r1: string; r2: string }) {
  const n1 = parseFloat(r1), n2 = parseFloat(r2);
  const ok =
    !!r1 && !isNaN(n1) && n1 <= 0.2 &&
    !!r2 && !isNaN(n2) && n2 <= 1.5;
  return (
    <span className={`border rounded px-3 py-1 text-xs font-mono font-bold whitespace-nowrap ${
      ok ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-red-500 text-red-600 bg-red-50"
    }`}>
      {ok ? "Acceptable" : "Unacceptable"}
    </span>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────

function Row({ label, children, badge }: { label: string; children: ReactNode; badge?: ReactNode }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-mono text-xs text-foreground whitespace-nowrap w-52">{label}</td>
      <td className="px-2 py-1.5 text-center text-muted-foreground text-xs w-5">:</td>
      <td className="px-3 py-1.5">{children}</td>
      <td className="px-3 py-1.5 text-right">{badge}</td>
    </tr>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SensorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <p className="font-mono text-xs font-bold text-foreground underline mb-1 px-1">{title}</p>
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Level sensor block (module-level to avoid remount on every render) ───────

interface LevelSensorBlockProps {
  canEdit: boolean;
  label: string;
  s: LevelSensorData;
  setF: (f: keyof LevelSensorData, v: string) => void;
}

function LevelSensorBlock({ canEdit, label, s, setF }: LevelSensorBlockProps) {
  return (
    <SensorSection title={label}>
      {/* Type */}
      <Row label="(1) Type" badge={<AcceptBadge value={s.accuracy} threshold={7.5} />}>
        {canEdit ? (
          <select
            value={s.type}
            onChange={e => setF("type", e.target.value)}
            className={yi + " appearance-none cursor-pointer"}
          >
            <option value="radar_gauge">Radar Gauge</option>
            <option value="float_gauge">Float Gauge</option>
          </select>
        ) : (
          <span className={ro}>{s.type === "radar_gauge" ? "Radar Gauge" : "Float Gauge"}</span>
        )}
      </Row>
      {/* Manufacturer */}
      <Row label="(2) Manufacturer">
        {canEdit
          ? <input type="text" value={s.manufacturer} onChange={e => setF("manufacturer", e.target.value)} className={yi} placeholder="e.g. Kongsberg, Honeywell…" />
          : <span className={ro}>{s.manufacturer || "—"}</span>}
      </Row>
      {/* Accuracy */}
      <Row label="(3) Accuracy ±">
        {canEdit
          ? <input type="text" value={s.accuracy} onChange={e => setF("accuracy", e.target.value)} className={yi} placeholder="mm  (criteria ≤ 7.5 mm)" />
          : <span className={ro}>{s.accuracy || "—"}</span>}
      </Row>
      {/* Certified by */}
      <Row label="(4) Certified by">
        {canEdit
          ? <input type="text" value={s.certifiedBy} onChange={e => setF("certifiedBy", e.target.value)} className={yi} placeholder="Certifying body / authority" />
          : <span className={ro}>{s.certifiedBy || "—"}</span>}
      </Row>
      {/* Issued Date */}
      <Row label="(5) Issued Date">
        {canEdit
          ? <input type="date" value={s.issuedDate} onChange={e => setF("issuedDate", e.target.value)} className={yi + " w-44"} />
          : <span className={ro}>{s.issuedDate || "—"}</span>}
      </Row>
    </SensorSection>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  canEdit: boolean;
  data: CTMSData;
  onChange: (d: CTMSData) => void;
}

export function CTMSSection({ canEdit, data: dataProp, onChange }: Props) {
  const data = dataProp ?? defaultCTMSData();

  const setL = (key: "primaryLevel" | "secondaryLevel", f: keyof LevelSensorData, v: string) =>
    onChange({ ...data, [key]: { ...data[key], [f]: v } });

  const setT = (f: keyof TempSensorData, v: string) =>
    onChange({ ...data, temperature: { ...data.temperature, [f]: v } });

  const setP = (f: keyof PressureSensorData, v: string) =>
    onChange({ ...data, pressure: { ...data.pressure, [f]: v } });

  const t = data.temperature;
  const p = data.pressure;

  return (
    <div className="border border-border rounded bg-card overflow-hidden mb-6">
      <div className="border-b border-border bg-secondary/30 px-5 py-3">
        <p className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">
          Cargo Tank Monitoring System (CTMS)
        </p>
        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
          Part 8 — Sensor calibration records and acceptance criteria
        </p>
      </div>

      <div className="p-5 space-y-0">

        {/* 1. Primary Level Sensor */}
        <LevelSensorBlock canEdit={canEdit} label="1. Primary Level Sensor" s={data.primaryLevel} setF={(f, v) => setL("primaryLevel", f, v)} />

        {/* 2. Secondary Level Sensor */}
        <LevelSensorBlock canEdit={canEdit} label="2. Secondary Level Sensor" s={data.secondaryLevel} setF={(f, v) => setL("secondaryLevel", f, v)} />

        {/* 3. Temperature Sensor */}
        <SensorSection title="3. Temperature Sensor">
          {/* (1) Accuracy row — header */}
          <tr className="border-b border-border bg-secondary/20">
            <td className="px-4 py-2 font-mono text-xs text-foreground w-52">(1) Accuracy (at temp. range)</td>
            <td className="px-2 py-1.5 text-center text-muted-foreground text-xs w-5"/>
            <td className="px-3 py-1.5"/>
            <td className="px-3 py-1.5 text-right">
              <TempAcceptBadge r1={t.accuracyRange1} r2={t.accuracyRange2} />
            </td>
          </tr>
          {/* Range 1 */}
          <tr className="border-b border-border">
            <td className="px-4 py-2 font-mono text-[10px] text-muted-foreground italic pl-8 w-52">
              (at temp. range −145 to −165 °C)
            </td>
            <td className="px-2 py-1.5 text-center text-muted-foreground text-xs">:</td>
            <td className="px-3 py-1.5">
              {canEdit
                ? <input type="text" value={t.accuracyRange1} onChange={e => setT("accuracyRange1", e.target.value)} className={yi} placeholder="°C  (criteria ≤ 0.2 °C)" />
                : <span className={ro}>{t.accuracyRange1 || "—"}</span>}
            </td>
            <td className="px-3 py-1.5"/>
          </tr>
          {/* Range 2 */}
          <tr className="border-b border-border">
            <td className="px-4 py-2 font-mono text-[10px] text-muted-foreground italic pl-8 w-52">
              (at temp. range −50 to −145 °C)
            </td>
            <td className="px-2 py-1.5 text-center text-muted-foreground text-xs">:</td>
            <td className="px-3 py-1.5">
              {canEdit
                ? <input type="text" value={t.accuracyRange2} onChange={e => setT("accuracyRange2", e.target.value)} className={yi} placeholder="°C  (criteria ≤ 1.5 °C)" />
                : <span className={ro}>{t.accuracyRange2 || "—"}</span>}
            </td>
            <td className="px-3 py-1.5"/>
          </tr>
          {/* (2) Certified by */}
          <Row label="(2) Certified by">
            {canEdit
              ? <input type="text" value={t.certifiedBy} onChange={e => setT("certifiedBy", e.target.value)} className={yi} placeholder="Certifying body / authority" />
              : <span className={ro}>{t.certifiedBy || "—"}</span>}
          </Row>
          {/* (3) Issued Date */}
          <Row label="(3) Issued Date">
            {canEdit
              ? <input type="date" value={t.issuedDate} onChange={e => setT("issuedDate", e.target.value)} className={yi + " w-44"} />
              : <span className={ro}>{t.issuedDate || "—"}</span>}
          </Row>
        </SensorSection>

        {/* 4. Pressure Sensor */}
        <SensorSection title="4. Pressure Sensor">
          {/* (1) Accuracy % */}
          <Row label="(1) Accuracy ± (%)" badge={<AcceptBadge value={p.accuracy} threshold={1} />}>
            {canEdit
              ? <input type="text" value={p.accuracy} onChange={e => setP("accuracy", e.target.value)} className={yi} placeholder="%  (criteria ≤ 1 %)" />
              : <span className={ro}>{p.accuracy || "—"}</span>}
          </Row>
          {/* (2) Certified by */}
          <Row label="(2) Certified by">
            {canEdit
              ? <input type="text" value={p.certifiedBy} onChange={e => setP("certifiedBy", e.target.value)} className={yi} placeholder="Certifying body / authority" />
              : <span className={ro}>{p.certifiedBy || "—"}</span>}
          </Row>
          {/* (3) Issued Date */}
          <Row label="(3) Issued Date">
            {canEdit
              ? <input type="date" value={p.issuedDate} onChange={e => setP("issuedDate", e.target.value)} className={yi + " w-44"} />
              : <span className={ro}>{p.issuedDate || "—"}</span>}
          </Row>
        </SensorSection>

      </div>
    </div>
  );
}
