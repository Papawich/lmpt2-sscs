import ExcelJS from "exceljs";
import confirmationTemplateUrl from "../imports/Confirmation List Between Ship Shore - LMPT2.xlsx?url";
import checklistTemplateUrl from "../imports/Ship Shore Compatibility Checklist - LMPT2.xlsx?url";

export type ApprovalDocument = {
  fileName: string;
  bytes: Uint8Array;
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
};

type AnyRecord = Record<string, any>;
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const;

function clean(v: unknown): string { return String(v ?? "").trim(); }
function gi(study: AnyRecord, id: string): string {
  return clean((study.items ?? []).find((x: any) => x.id === id)?.value);
}
function vesselValue(vessel: AnyRecord, study: AnyRecord, giId: string, ...fallbacks: unknown[]): string {
  return gi(study, giId) || clean(fallbacks.find(v => clean(v)));
}
function safeFileName(v: unknown): string {
  return clean(v).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") || "Vessel";
}
function approvalDate(iso: string): Date {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
function set(ws: ExcelJS.Worksheet, cell: string, value: unknown) {
  const s = clean(value);
  if (s === "") return;
  const normalized = s.replace(/,/g, "");
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
    const n = Number(normalized);
    if (Number.isFinite(n)) { ws.getCell(cell).value = n; return; }
  }
  ws.getCell(cell).value = s;
}

async function addRemoteImageToRange(
  wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, url: string,
  range: { tl: { col: number; row: number }; br: { col: number; row: number } }
) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image load failed: ${response.status}`);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const type = blob.type.toLowerCase();
  const extension: "png" | "jpeg" = type.includes("jpeg") || type.includes("jpg") ? "jpeg" : "png";
  const imageId = wb.addImage({ buffer: buffer as any, extension });
  ws.addImage(imageId, { tl: range.tl, br: range.br, editAs: "oneCell" });
}
function setDate(ws: ExcelJS.Worksheet, cell: string, value: Date) {
  ws.getCell(cell).value = value;
  ws.getCell(cell).numFmt = "dd-mmm-yy";
}
function yesNo(v: unknown): string {
  if (v === true || v === "available" || clean(v).toLowerCase() === "yes") return "Yes";
  if (v === false || v === "not_available" || clean(v).toLowerCase() === "no") return "No";
  return clean(v);
}
function signedDistance(distance: unknown, direction: unknown): string {
  const s = clean(distance);
  if (!s) return "";
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  if (direction === "fwd") return String(-Math.abs(n));
  if (direction === "aft") return String(Math.abs(n));
  return String(n);
}
function patternText(study: AnyRecord): string {
  const p = study.mooringArrangementData?.pattern ?? {};
  const fwd = [p.fwd1, p.fwd2, p.fwd3, p.fwd4].map(clean).map(v => v || "-").join("/");
  const aft = [p.aft1, p.aft2, p.aft3, p.aft4].map(clean).map(v => v || "-").join("/");
  return `FWD : ${fwd} :::::::: ${aft} AFT`;
}
function maximumUnloadingRate(study: AnyRecord): string {
  const rows = study.unloadingArmData?.flowrateRows ?? [];
  const nums = rows.map((r: any) => Number(String(r?.flowrate ?? "").replace(/,/g, "")))
    .filter((n: number) => Number.isFinite(n) && n > 0);
  return nums.length ? String(Math.max(...nums)) : "";
}
async function loadWorkbook(url: string): Promise<ExcelJS.Workbook> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Template load failed: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.calcProperties.forceFullCalc = true;
  return workbook;
}
async function toDocument(workbook: ExcelJS.Workbook, fileName: string): Promise<ApprovalDocument> {
  const output = await workbook.xlsx.writeBuffer();
  return { fileName, bytes: new Uint8Array(output as any), mimeType: XLSX_MIME };
}

async function buildChecklist(vessel: AnyRecord, study: AnyRecord, approvedBy: string, approvedAt: string): Promise<ApprovalDocument> {
  const wb = await loadWorkbook(checklistTemplateUrl);
  const ws = wb.getWorksheet("F-MO.T2-0002 R02");
  if (!ws) throw new Error("Checklist template sheet not found: F-MO.T2-0002 R02");

  const shipName = vesselValue(vessel, study, "gi-01", vessel.name, study.vesselName);
  const callSign = vesselValue(vessel, study, "gi-03", vessel.callSign);
  const imo = vesselValue(vessel, study, "gi-02", vessel.imo);
  const owner = vesselValue(vessel, study, "gi-07", vessel.owner);
  const flag = vesselValue(vessel, study, "gi-04", vessel.flag);
  const year = vesselValue(vessel, study, "gi-06", vessel.year, vessel.yearBuilt);
  const operator = vesselValue(vessel, study, "gi-08", vessel.operator);
  const classification = vesselValue(vessel, study, "gi-11", vessel.classification);
  const date = approvalDate(approvedAt);
  const ballast = gi(study, "gi-20") || "-";
  const rate = maximumUnloadingRate(study) || "-";

  set(ws, "L3", shipName);
  setDate(ws, "L4", date);
  set(ws, "L5", approvedBy);
  set(ws, "D10", shipName); set(ws, "F10", callSign); set(ws, "H10", imo);
  set(ws, "D11", owner); set(ws, "F11", flag); set(ws, "H11", year);
  set(ws, "D12", operator); set(ws, "F12", classification);
  set(ws, "B32", `1. THE LNG/C ${shipName.toUpperCase()} IS COMPATIBLE WITH LNG MAP TA PHUT TERMINAL 2 BERTH #1.`);
  set(ws, "B33", `2. THE MASTER SHALL MAINTAIN THE VESSEL’S DRAFT ${ballast} - 12.20 m. METERS ALL DURING A VISIT TO LNG MAP TA PHUT TERMINAL 2.`);
  set(ws, "B34", `3. APPROVED MOORING PATTERN IS ${patternText(study)}   (BERTH1).`);
  set(ws, "B35", `4. THE MAXIMUM UNLOADING RATE IS ${rate} m3/hr REFER TO THE CONFIRMATION LIST.`);
  setDate(ws, "F42", date);

  return toDocument(wb, `Ship Shore Compatibility Checklist - ${safeFileName(shipName)}.xlsx`);
}

async function buildConfirmation(vessel: AnyRecord, study: AnyRecord): Promise<ApprovalDocument> {
  const wb = await loadWorkbook(confirmationTemplateUrl);
  const p1 = wb.getWorksheet("page 1");
  const p2 = wb.getWorksheet("page 2");
  const p3 = wb.getWorksheet("page 3");
  const p4 = wb.getWorksheet("page 4");
  const p5 = wb.getWorksheet("page 5");
  const p6 = wb.getWorksheet("page 6");
  const appA = wb.getWorksheet("Appendix A");
  const appB = wb.getWorksheet("Appendix B");
  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6 || !appA || !appB) {
    throw new Error("Confirmation List template is missing one or more required sheets.");
  }

  const shipName = vesselValue(vessel, study, "gi-01", vessel.name, study.vesselName);

  // PAGE 1 — General Information / Ship Major Dimensions.
  const page1: Record<string, string> = {
    AC7: vesselValue(vessel, study, "gi-01", vessel.name, study.vesselName),
    AC8: vesselValue(vessel, study, "gi-02", vessel.imo),
    AC9: vesselValue(vessel, study, "gi-03", vessel.callSign),
    AC10: vesselValue(vessel, study, "gi-04", vessel.flag),
    AC11: vesselValue(vessel, study, "gi-05", vessel.portOfRegistry),
    AC12: vesselValue(vessel, study, "gi-06", vessel.year, vessel.yearBuilt),
    AC13: vesselValue(vessel, study, "gi-07", vessel.owner),
    AC14: vesselValue(vessel, study, "gi-08", vessel.operator),
    AC15: vesselValue(vessel, study, "gi-09", vessel.cargoContainmentSystem),
    AC16: vesselValue(vessel, study, "gi-10", vessel.capacity),
    AC17: vesselValue(vessel, study, "gi-11", vessel.classification),
    AC18: vesselValue(vessel, study, "gi-12", vessel.gasMgmt1),
    AC19: vesselValue(vessel, study, "gi-13", vessel.gasMgmt2),
    AD25: gi(study, "gi-14"), AD26: gi(study, "gi-15"), AD27: gi(study, "gi-16"),
    AD28: gi(study, "gi-17"), AD29: gi(study, "gi-18"), AD30: gi(study, "gi-19"),
    AD33: gi(study, "gi-20"), AD34: gi(study, "gi-21"), AD36: gi(study, "gi-22"),
    AD38: gi(study, "gi-23"), AD41: gi(study, "gi-24"), AD42: gi(study, "gi-25"),
  };
  Object.entries(page1).forEach(([cell, value]) => set(p1, cell, value));

  // PAGE 2 — Fender / Flat Body / Berthing Energy + Mooring Arrangement.
  const flatBody = study.flatBodyData ?? {};
  const fenderReaction = study.fenderReactionData ?? {};
  const berthingEnergy = study.berthingEnergyData ?? {};

  set(p2, "AI7", flatBody.vapourManifoldOffset);
  set(p2, "AE27", flatBody.ballastFwd);
  set(p2, "AH27", flatBody.ballastAft);
  set(p2, "AE28", flatBody.loadedFwd);
  set(p2, "AH28", flatBody.loadedAft);
  set(p2, "AE29", flatBody.upperDeckFwd);
  set(p2, "AH29", flatBody.upperDeckAft);
  set(p2, "AC33", fenderReaction?.allowableHullPressure);

  (fenderReaction.ballastDraft ?? []).slice(0, 4).forEach((row: any, i: number) => {
    set(p2, `AM${11 + i}`, row?.reactionForce);
  });
  (fenderReaction.loadedDraft ?? []).slice(0, 4).forEach((row: any, i: number) => {
    set(p2, `AM${24 + i}`, row?.reactionForce);
  });

  const displacement = Number.parseFloat(clean(berthingEnergy.displacement).replace(/,/g, ""));
  if (Number.isFinite(displacement) && displacement > 0) {
    const BE_VELOCITY = 0.10;
    const BE_CM = 1.75;
    const BE_CE = 0.74;
    const BE_CC = 1.00;
    const BE_CS = 1.00;
    const BE_SAFETY_FACTOR = 2;
    const energy =
      0.5 * (displacement * 1000 / 9.81) * BE_VELOCITY ** 2 *
      BE_CM * BE_CE * BE_CC * BE_CS / 1000 * BE_SAFETY_FACTOR;
    set(p2, "AS46", energy.toFixed(2));
  }

  const mooring = study.mooringArrangementData ?? {};
  const mr = mooring.mooringRope ?? {};
  const tr = mooring.tailRope ?? {};
  set(p2, "Z64", mr.type); set(p2, "Z65", mr.diameter); set(p2, "Z66", mr.length); set(p2, "Z67", mr.mbl);
  set(p2, "AG64", tr.type); set(p2, "AG65", tr.diameter); set(p2, "AG66", tr.length); set(p2, "AG67", tr.mbl);

  // PAGE 3 — Gangway Landing Area. Formula cells in the master calculate length/width and working ranges.
  const gw = study.gangwayData ?? {};
  set(p3, "X23", gw.a); set(p3, "X24", gw.b); set(p3, "X25", gw.c); set(p3, "X26", gw.d);

  // PAGE 4 — Cargo pumps, unloading line, compressor, gas management, manifold layout and performance.
  const cm = study.cargoManagementData ?? {};
  const cp = cm.cargoPump ?? {};
  set(p4, "AA7", cp.cargoPump?.fillRate); set(p4, "AD7", cp.cargoPump?.totalPumps);
  set(p4, "AA8", cp.sprayPump?.fillRate); set(p4, "AD8", cp.sprayPump?.totalPumps);
  set(p4, "AA9", cp.emergencyCargoPump?.fillRate); set(p4, "AD9", cp.emergencyCargoPump?.totalPumps);
  set(p4, "AA22", cp.highDutyCompressor?.units);
  set(p4, "AA23", cp.highDutyCompressor?.rate);
  set(p4, "AA24", cp.highDutyCompressor?.pressure);

  const ua = study.unloadingArmData ?? {};
  const ul = ua.unloadingLine ?? {};
  set(p4, "AA14", ul.vapourFlangeSpec); set(p4, "AA15", ul.liquidFlangeSpec);
  set(p4, "AA18", ul.vapourStrainer); set(p4, "AA19", ul.liquidStrainer);

  const gm = cm.gasManagement ?? {};
  [[27, gm.gcu], [28, gm.gasBurning], [29, gm.reliquefaction]].forEach(([rowAny, entryAny]) => {
    const row = Number(rowAny); const entry: any = entryAny ?? {};
    set(p4, `AA${row}`, entry.capacity);
    set(p4, `AE${row}`, entry.timeStart);
    set(p4, `AG${row}`, entry.timeStop);
  });

  const ml = ua.manifoldLayout ?? {};
  set(p4, "Z47", ml.l1l2); set(p4, "AB47", ml.l2v); set(p4, "AD47", ml.vl3); set(p4, "AF47", ml.l3l4);
  (ua.flowrateRows ?? []).slice(0, 22).forEach((r: any, i: number) => {
    const row = 56 + i;
    set(p4, `AC${row}`, r?.flowrate);
    set(p4, `AF${row}`, r?.pressure);
  });

  // PAGE 5 — Utility and Ship Shore Link / ESD.
  const utility = study.utilityData ?? {};
  set(p5, "AS41", yesNo(utility.utilitySupply?.nitrogenService));
  set(p5, "AS43", yesNo(utility.utilitySupply?.freshWater));

  const ssl = study.shipShoreLinkData ?? {};
  const optical = ssl.opticalFibre ?? {};
  set(p5, "Z47", optical.manufacturer); set(p5, "Z48", optical.connectionType);
  set(p5, "Z49", signedDistance(optical.boxDistance, optical.boxDirection));
  (ssl.opticalSignalArrangement ?? []).slice(0, 6).forEach((r: any, i: number) => {
    set(p5, `AQ${49 + i}`, r?.shipSideSignal);
    set(p5, `AT${49 + i}`, r?.shipSideDirection);
  });

  const electric = ssl.electric ?? {};
  set(p5, "Z54", electric.manufacturer); set(p5, "Z55", electric.connectionType);
  set(p5, "Z56", signedDistance(electric.boxDistance, electric.boxDirection));
  (ssl.electricSignalArrangement ?? []).slice(0, 19).forEach((r: any, i: number) => {
    set(p5, `AP${57 + i}`, r?.shipPinNo);
    set(p5, `AR${57 + i}`, r?.shipSide);
  });

  const pneumatic = ssl.pneumatic ?? {};
  set(p5, "Z60", pneumatic.manufacturer); set(p5, "Z61", pneumatic.connectionType);
  set(p5, "Z62", signedDistance(pneumatic.boxDistance, pneumatic.boxDirection));
  set(p5, "Z63", pneumatic.airPressure);
  (ssl.esd1Items ?? []).slice(0, 15).forEach((v: any, i: number) => {
    set(p5, i < 9 ? `X${66 + i}` : `AE${66 + (i - 9)}`, v);
  });

  // PAGE 6 — CTMS and Fire Fighting.
  const ctms = study.ctmsData ?? {};
  const primary = ctms.primaryLevel ?? {};
  set(p6, "Y7", primary.type === "float_gauge" ? "Float Gauge" : primary.type === "radar_gauge" ? "Radar Gauge" : primary.type);
  set(p6, "Y8", primary.manufacturer); set(p6, "Y9", primary.accuracy); set(p6, "Y10", primary.certifiedBy); set(p6, "Y11", primary.issuedDate);
  const secondary = ctms.secondaryLevel ?? {};
  set(p6, "Y15", secondary.type === "float_gauge" ? "Float Gauge" : secondary.type === "radar_gauge" ? "Radar Gauge" : secondary.type);
  set(p6, "Y16", secondary.manufacturer); set(p6, "Y17", secondary.accuracy); set(p6, "Y18", secondary.certifiedBy); set(p6, "Y19", secondary.issuedDate);
  const temp = ctms.temperature ?? {};
  set(p6, "Y24", temp.accuracyRange1); set(p6, "Y25", temp.accuracyRange2); set(p6, "Y26", temp.certifiedBy); set(p6, "Y27", temp.issuedDate);
  const pressure = ctms.pressure ?? {};
  set(p6, "Y32", pressure.accuracy); set(p6, "Y33", pressure.certifiedBy); set(p6, "Y34", pressure.issuedDate);

  const ff = utility.fireFighting ?? {};
  [ff.exposedDeck, ff.loadingStation, ff.accomHouse, ff.sidePlating, ff.cargoMachineryRm, ff.cargoFrontDome]
    .forEach((v, i) => set(p6, `V${41 + i}`, v));

  // Appendix A — Mooring Pattern image + approved pattern text.
  // B4:AR30 => zero-based anchors: B4 = col 1,row 3 ; AR31 boundary = col 44,row 30.
  const patternImage = study.mooringArrangementData?.patternImage;
  if (patternImage) {
    try {
      let imageUrl = clean(patternImage.dataUrl);
      if (!imageUrl && patternImage.storagePath) {
        // Approval generation receives a signed URL from App.tsx when available.
        imageUrl = clean(patternImage.signedUrl || patternImage.url);
      }
      if (imageUrl) {
        await addRemoteImageToRange(wb, appA, imageUrl, {
          tl: { col: 1, row: 3 },
          br: { col: 44, row: 30 },
        });
      }
    } catch (error) {
      console.warn("Unable to embed Mooring Pattern image in Appendix A:", error);
    }
  }
  set(appA, "B31", patternText(study));

  // Appendix B — SDP dimensional data.
  const sdp = study.sdpData ?? {};
  set(appB, "I30", sdp.outsideDiameter);
  set(appB, "I33", sdp.flangeThickness);
  set(appB, "I36", sdp.raisedFace);
  set(appB, "I39", sdp.insideDiameter);
  set(appB, "I42", sdp.surfaceFinishMax);
  set(appB, "I43", sdp.surfaceFinishMin);
  set(appB, "I45", sdp.actualSDP);

  return toDocument(wb, `Confirmation List Between Ship Shore - ${safeFileName(shipName)}.xlsx`);
}

export async function generateApprovalDocuments(vessel: AnyRecord, study: AnyRecord, approvedBy: string, approvedAt: string) {
  const [confirmationList, compatibilityChecklist] = await Promise.all([
    buildConfirmation(vessel, study),
    buildChecklist(vessel, study, approvedBy, approvedAt),
  ]);
  return { confirmationList, compatibilityChecklist };
}
