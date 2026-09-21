import { useState, useRef, useEffect } from "react";
import {
  Search, Eye, EyeOff, LogOut, ArrowLeft, AlertCircle, CheckCircle2,
  Anchor, ChevronRight, Ship, User, Mail, Lock, X, Globe, Calendar,
  Gauge, BarChart2, RefreshCw, Building2, ShieldCheck, ShieldX,
  Clock, Users, CheckCheck, XCircle, KeyRound, Send, Info,
  FileText, AlertTriangle, Edit3, ClipboardList, BadgeCheck,
  RotateCcw, Pencil, FilePlus, Plus, ZoomIn,
} from "lucide-react";
import heroBg from "../imports/image-8.png";
import {
  notifyAdminNewRegistration,
  notifyUserAccountApproved,
  notifyTerminalOfficerAccessRequest,
  notifyShipOfficerAccessApproved,
  notifyShipOfficerAccessRejected,
  notifyTerminalOfficerStudySubmitted,
  notifyShipOfficerStudyApproved,
  notifyShipOfficerEditApproved,
  notifyShipOfficerRevisionRequested,
  notifyTerminalOfficerEditRequested,
  notifyShipOfficerEditRejected,
  sendOTPEmail,
  adminNotificationEmails,
} from "./emailService";
import {
  supabaseConfigured,
  getSession,
  signIn as cloudSignIn,
  signUp as cloudSignUp,
  signOut as cloudSignOut,
  requestPasswordResetNoEmail,
  checkPasswordResetStatus,
  completePasswordReset,
  fetchPasswordResetRequests,
  updatePasswordResetRequestStatus,
  fetchMyProfile,
  fetchProfiles,
  updateProfileStatus,
  fetchVessels,
  createVessel as createCloudVessel,
  renameVesselEverywhere,
  updateSisterShipVerification,
  fetchStudies,
  saveStudy as saveCloudStudy,
  uploadStudyDocument,
  getStudyDocumentUrl,
  deleteStudyDocument,
} from "./backendService";
import type { CloudPasswordResetRequest } from "./backendService";
import {
  FenderFlatBodySection,
  defaultFlatBodyData, defaultFenderReactionData, defaultBerthingEnergyData, isFenderFlatBodyComplete,
} from "./components/FenderFlatBodySection";
import type { FlatBodyData, FenderReactionData, BerthingEnergyData } from "./components/FenderFlatBodySection";
import {
  MooringArrangementSection,
  defaultMooringArrangementData, isMooringComplete,
} from "./components/MooringArrangementSection";
import type { MooringArrangementData } from "./components/MooringArrangementSection";
import {
  GangwaySection,
  defaultGangwayData, isGangwayComplete,
} from "./components/GangwaySection";
import type { GangwayData } from "./components/GangwaySection";
import {
  UnloadingArmSection,
  defaultUnloadingArmData, isUnloadingArmComplete,
} from "./components/UnloadingArmSection";
import type { UnloadingArmData } from "./components/UnloadingArmSection";
import {
  CargoManagementSection,
  defaultCargoManagementData, isCargoManagementComplete,
} from "./components/CargoManagementSection";
import type { CargoManagementData } from "./components/CargoManagementSection";
import {
  ShipShoreLinkSection,
  defaultShipShoreLinkData, isShipShoreLinkComplete,
} from "./components/ShipShoreLinkSection";
import type { ShipShoreLinkData } from "./components/ShipShoreLinkSection";
import {
  CTMSSection,
  defaultCTMSData, isCTMSComplete,
} from "./components/CTMSSection";
import type { CTMSData } from "./components/CTMSSection";
import {
  SDPsSection,
  defaultSDPData, isSDPComplete,
} from "./components/SDPsSection";
import type { SDPData } from "./components/SDPsSection";
import {
  UtilitySystemSection,
  defaultUtilityData, isUtilityComplete,
} from "./components/UtilitySystemSection";
import type { UtilityData } from "./components/UtilitySystemSection";
import {
  RequiredDocumentsSection,
  defaultRequiredDocumentsData, isRequiredDocumentsComplete,
} from "./components/RequiredDocumentsSection";
import type { DocKey, RequiredDocumentsData, UploadedFile } from "./components/RequiredDocumentsSection";
import {
  AttachmentsSection,
  VesselPhotoSummary,
  defaultAttachmentData,
  isAttachmentComplete,
} from "./components/AttachmentsSection";
import type { AttachmentData } from "./components/AttachmentsSection";
import {
  QualityAssessmentSection,
  defaultQualityAssessmentData,
  isQualityAssessmentComplete,
  getInvalidCertificateCount,
  getExpiringCertificateCount,
} from "./components/QualityAssessmentSection";
import type { QualityAssessmentData } from "./components/QualityAssessmentSection";

// ─────────────────────────────────────────────────────────────────────────────
// VESSELS
// ─────────────────────────────────────────────────────────────────────────────
type SisterShipStatus = "none" | "pending" | "verified" | "rejected";

interface Vessel {
  id: number; name: string; imo: string; callSign: string;
  flag: string; portOfRegistry: string; year: number;
  type: string; capacity: string;
  owner: string; operator: string; classification: string;
  gasMgmt1: string; gasMgmt2: string;
  status: string; createdById?: string;
  isSisterShip?: boolean;
  referenceVesselId?: number;
  sisterShipStatus?: SisterShipStatus;
  sisterShipVerifiedById?: string;
  sisterShipVerifiedAt?: string;
  sisterReferenceStudyId?: string;
}

const INITIAL_VESSELS: Vessel[] = [
  { id:  1, name: "AL HAMRA",               imo: "IMO 9074640", callSign: "ELTL9",   flag: "Liberia",           portOfRegistry: "Monrovia",      year: 1997, type: "Moss-Type",     capacity: "137,129 m³", owner: "AL HAMRA LTD",                              operator: "ADNOC",                                   classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "N/A",         status: "Active" },
  { id:  2, name: "Al Reef",                imo: "IMO 9972945", callSign: "5LPF7",   flag: "Liberia",           portOfRegistry: "Monrovia",      year: 2025, type: "Membrane",      capacity: "175,009 m³", owner: "AL REEF LTD.",                              operator: "ADNOC Logistics & Services",              classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id:  3, name: "AL SHELILA",             imo: "IMO 9965423", callSign: "5LPF5",   flag: "Liberia",           portOfRegistry: "Monrovia",      year: 2024, type: "Membrane",      capacity: "174,838 m³", owner: "AL SHELILA INC",                            operator: "—",                                       classification: "DNV",              gasMgmt1: "GCU",         gasMgmt2: "N/A",         status: "Active" },
  { id:  4, name: "AMANI",                  imo: "IMO 9661869", callSign: "V8V3146", flag: "Brunei Darussalam", portOfRegistry: "Muara",         year: 2016, type: "Membrane",      capacity: "155,024 m³", owner: "BGC Four (NBD) Sendirian Berhad",           operator: "Brunei Gas Carrier Sendirian Berhad",     classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id:  5, name: "ARISTIDIS I",            imo: "IMO 9862906", callSign: "9HA5237", flag: "Malta",             portOfRegistry: "Valetta",       year: 2021, type: "Membrane",      capacity: "174,007 m³", owner: "ATROTOS GAS CARRIER CORP.",                 operator: "CAPITAL GAS MANAGEMENT CORP.",            classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "Reliq Plant", status: "Active" },
  { id:  6, name: "British Listener",       imo: "IMO 9765660", callSign: "MAOR6",   flag: "Isle of Man",       portOfRegistry: "Douglas",       year: 2019, type: "Membrane",      capacity: "173,690 m³", owner: "Hai Kuo Shipping",                          operator: "Daewoo Shipbuilding and Marine Engineering", classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id:  7, name: "British Sponsor",        imo: "IMO 9766580", callSign: "MAOR4",   flag: "Isle of Man",       portOfRegistry: "Douglas",       year: 2019, type: "Membrane",      capacity: "173,690 m³", owner: "Natural Gas Ocean Transportation Inv. No.20", operator: "BP Shipping Ltd",                         classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id:  8, name: "BW HELIOS",              imo: "IMO 9873852", callSign: "9V6826",  flag: "Singapore",         portOfRegistry: "Singapore",     year: 2021, type: "Membrane",      capacity: "174,282 m³", owner: "SELENE NAVIGATION Pte. Ltd",                operator: "BW FLEET MANAGEMENT AS",                  classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "Reliq Plant", status: "Active" },
  { id:  9, name: "CELSIUS CANBERRA",       imo: "IMO 9864796", callSign: "V7A4348", flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2021, type: "Membrane",      capacity: "180,260 m³", owner: "Xiang CH27 HK International Ship Lease Co.", operator: "Celsius Tech Limited",                    classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 10, name: "Celsius Carolina",       imo: "IMO 9878723", callSign: "V7A4385", flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2021, type: "Membrane",      capacity: "180,244 m³", owner: "Frigg Shipco 2 LLC",                        operator: "Celsius Tech Limited",                    classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 11, name: "CELSIUS GREENWICH",      imo: "IMO 9948724", callSign: "V7A6308", flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2024, type: "Membrane",      capacity: "179,999 m³", owner: "XIANG H24 International Ship Lease Co., Ltd", operator: "CELSIUS TECH LTD",                       classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 12, name: "Clean Cajun",            imo: "IMO 9886732", callSign: "9HA5493", flag: "Malta",             portOfRegistry: "Valletta",      year: 2022, type: "Membrane",      capacity: "199,830 m³", owner: "Platia Shipping Limited",                   operator: "Hyundai Heavy Industries",                classification: "Bureau Veritas",   gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 13, name: "Clean Destiny",          imo: "IMO 9943487", callSign: "9HA5750", flag: "Malta",             portOfRegistry: "Valletta",      year: 2023, type: "Membrane",      capacity: "199,881 m³", owner: "Green Ships Limited",                       operator: "Hyundai Heavy Industries",                classification: "Bureau Veritas",   gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 14, name: "Clean Sirocco",          imo: "IMO 9967342", callSign: "9HA6178", flag: "Malta",             portOfRegistry: "Valletta",      year: 2026, type: "Membrane",      capacity: "199,852 m³", owner: "Bright Navigation Limited",                 operator: "Dynagas Ltd",                             classification: "Bureau Veritas",   gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 15, name: "Cool Explorer",          imo: "IMO 9640023", callSign: "9HA3616", flag: "Malta",             portOfRegistry: "Valletta",      year: 2015, type: "Membrane",      capacity: "160,562 m³", owner: "Safe port marine Ltd.",                     operator: "Thenamaris LNG Inc",                      classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "Gas Burning", status: "Active" },
  { id: 16, name: "COOL RANGER",            imo: "IMO 9333606", callSign: "9HA5862", flag: "Malta",             portOfRegistry: "Valletta",      year: 2008, type: "Membrane",      capacity: "155,032 m³", owner: "ANEMOS VENTURES LTD",                       operator: "THENAMARIS LNG INC.",                     classification: "Lloyd's Register", gasMgmt1: "Reliq Plant", gasMgmt2: "GCU",         status: "Active" },
  { id: 17, name: "ELISA HALCYON",          imo: "IMO 9980552", callSign: "FOLI",    flag: "France",            portOfRegistry: "Marseille",     year: 2025, type: "Membrane",      capacity: "174,029 m³", owner: "SNC Van Gogh Bail",                         operator: "Gazocean SAS",                            classification: "Bureau Veritas",   gasMgmt1: "Gas Burning", gasMgmt2: "N/A",         status: "Active" },
  { id: 18, name: "Energy Atlantic",        imo: "IMO 9649328", callSign: "9HA3976", flag: "Malta",             portOfRegistry: "Valletta",      year: 2015, type: "Membrane",      capacity: "159,882 m³", owner: "Spectacle Shipping and Trading LTD",         operator: "Alpha Gas S.A.",                          classification: "Bureau Veritas",   gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 19, name: "Flex Amber",             imo: "IMO 9857377", callSign: "V7A2865", flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2020, type: "Membrane",      capacity: "174,253 m³", owner: "Flex LNG Amber LTD",                        operator: "Flex LNG",                                classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 20, name: "Flex Freedom",           imo: "IMO 9862308", callSign: "V7A2791", flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2020, type: "Membrane",      capacity: "173,637 m³", owner: "Flex Freedom Ltd",                          operator: "DSME",                                    classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 21, name: "Flex Ranger",            imo: "IMO 9709025", callSign: "V7XI9",   flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2018, type: "Membrane",      capacity: "174,202 m³", owner: "Flex LNG Ranger Ltd",                       operator: "Flex LNG Fleet Management AS",            classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 22, name: "Gaslog Georgetown",      imo: "IMO 9864916", callSign: "ZCEZ2",   flag: "Bermuda",           portOfRegistry: "Hamilton",      year: 2020, type: "Membrane GTT",  capacity: "174,345 m³", owner: "Gas - thirty two Ltd.",                     operator: "GASLOG LNG Services Ltd",                 classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 23, name: "GASLOG ITALY",           imo: "IMO 9962407", callSign: "ZCHF5",   flag: "Bermuda",           portOfRegistry: "Hamilton",      year: 2024, type: "Membrane",      capacity: "174,278 m³", owner: "Sea 311 Leasing Co. Limited",                operator: "Gaslog LNG Services Ltd",                 classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "Reliq Plant", status: "Active" },
  { id: 24, name: "GLOBAL SEALINE",         imo: "IMO 9880477", callSign: "V7A4694", flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2022, type: "Membrane",      capacity: "174,254 m³", owner: "Hai Kuo Shipping 2219G Limited",             operator: "Nakilat Shipping (Qatar) Limited",        classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "Reliq Plant", status: "Active" },
  { id: 25, name: "GREENERGY MOON",         imo: "IMO 9961506", callSign: "9V8594",  flag: "Singapore",         portOfRegistry: "Singapore",     year: 2025, type: "Membrane",      capacity: "174,250 m³", owner: "COMPASS SHIPPING 118 PRIVATE LIMITED",      operator: "MOL Global Ship Management Pte. Ltd.",    classification: "ABS & CCS",        gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 26, name: "HL Alyssa Warner",       imo: "IMO 9972359", callSign: "5LVG2",   flag: "Liberia",           portOfRegistry: "Monrovia",      year: 2025, type: "Membrane",      capacity: "174,366 m³", owner: "NEPTUNE 1 S.A.",                            operator: "Northern Marine Management",              classification: "LR & KR",          gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 27, name: "HUASHAN",                imo: "IMO 9958652", callSign: "VRVU8",   flag: "Hong Kong, China",  portOfRegistry: "Hong Kong",     year: 2023, type: "Membrane",      capacity: "174,302 m³", owner: "UNITED PEACE LNG SHIPPING CO., LTD.",       operator: "COSCO SHIPPING LNG (HK) Ship Mgmt Co.",   classification: "ABS & CCS",        gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 28, name: "IBRA LNG",               imo: "IMO 9326689", callSign: "3EGE9",   flag: "Panama",            portOfRegistry: "Panama",        year: 2006, type: "Membrane",      capacity: "148,177 m³", owner: "AREEJ LNG CARRIER S.A.",                    operator: "SHI, Geoje Korea",                        classification: "NKK",              gasMgmt1: "Gas Burning", gasMgmt2: "N/A",         status: "Active" },
  { id: 29, name: "JOHN A. ANGELICOUSSIS",  imo: "IMO 9901350", callSign: "SVDK6",   flag: "Greece",            portOfRegistry: "Piraeus",       year: 2022, type: "Membrane",      capacity: "174,204 m³", owner: "VARTA SHIPPING LTD. (c/o MARAN GAS)",       operator: "MARAN GAS MARITIME INC",                  classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 30, name: "KITA LNG",               imo: "IMO 9636723", callSign: "9HA3422", flag: "Malta",             portOfRegistry: "Valletta",      year: 2014, type: "Membrane",      capacity: "160,119 m³", owner: "Xiang CH8 HK International Ship Lease Co.", operator: "Daewoo Shipbuilding and Marine Eng.",      classification: "Bureau Veritas",   gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 31, name: "KOOL BLIZZARD",          imo: "IMO 9635315", callSign: "V7AF2",   flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2015, type: "Membrane",      capacity: "160,545 m³", owner: "Kool Blizzard Corporation",                 operator: "Samsung Heavy Industries",                classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 32, name: "KOOL CRYSTAL",           imo: "IMO 9624926", callSign: "V7AF6",   flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2013, type: "GTT Mark III",  capacity: "160,645 m³", owner: "KOOL HUSKY CORPORATION",                    operator: "COOL COMPANY MANAGEMENT AS",              classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 33, name: "KOOL HUSKY",             imo: "IMO 9626039", callSign: "V7AF4",   flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2013, type: "GTT Mark III",  capacity: "160,655 m³", owner: "KOOL HUSKY CORPORATION",                    operator: "COOL COMPANY MANAGEMENT AS",              classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 34, name: "Kool Orca",              imo: "IMO 9870525", callSign: "D5XO2",   flag: "Liberia",           portOfRegistry: "Monrovia",      year: 2021, type: "Membrane",      capacity: "174,031 m³", owner: "Respent Marine LTD",                        operator: "Cool Company Management AS",              classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "Reliq Plant", status: "Active" },
  { id: 35, name: "LNG PROSPERITY",         imo: "IMO 9902938", callSign: "5LCE8",   flag: "Liberia",           portOfRegistry: "Monrovia",      year: 2023, type: "Membrane",      capacity: "174,008 m³", owner: "MERIDIAN 28 LIMITED",                       operator: "Bernhard Schulte Shipmanagement (Hellas)", classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 36, name: "MALAGA KNUTSEN",         imo: "IMO 9904182", callSign: "FMRT",    flag: "France (RIF)",      portOfRegistry: "Marseille",     year: 2021, type: "Membrane",      capacity: "173,947 m³", owner: "KNUTSEN",                                   operator: "MILLENAIRE FINANCEMENT",                  classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "Reliq Plant", status: "Active" },
  { id: 37, name: "Maran Gas Delphi",       imo: "IMO 9633173", callSign: "SVBW3",   flag: "Greece",            portOfRegistry: "Piraeus",       year: 2014, type: "Membrane",      capacity: "159,966 m³", owner: "ADA SHIPHOLDING INC. (c/o MARAN GAS)",      operator: "Maran Gas Maritime Inc.",                 classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 38, name: "Maran Gas Kalymnos",     imo: "IMO 9883742", callSign: "SVDI6",   flag: "Greece",            portOfRegistry: "Piraeus",       year: 2021, type: "Membrane",      capacity: "174,122 m³", owner: "CANTANA MARITIME CORP (c/o MARAN GAS)",     operator: "DSME",                                    classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 39, name: "Maran Gas Mystras",      imo: "IMO 9658238", callSign: "SVCB6",   flag: "Greece",            portOfRegistry: "Piraeus",       year: 2015, type: "Membrane",      capacity: "159,855 m³", owner: "BLUESKIES SHIPPING COMPANY LTD.",            operator: "MARAN GAS MARITIME INC.",                 classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 40, name: "MARVEL FALCON",          imo: "IMO 9760768", callSign: "9V5057",  flag: "Singapore",         portOfRegistry: "Singapore",     year: 2018, type: "Membrane",      capacity: "174,232 m³", owner: "TEA TREE SHIPPING PTE. LTD.",                operator: "NYK SHIPMANAGEMENT PTE LTD",              classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 41, name: "Minerva Limnos",         imo: "IMO 9854375", callSign: "9HA5355", flag: "Malta",             portOfRegistry: "Valetta",       year: 2021, type: "Membrane",      capacity: "173,570 m³", owner: "Roland Shipping S.A.",                      operator: "Minerva Gas Inc.",                        classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 42, name: "ORION MONET",            imo: "IMO 9888766", callSign: "9HA5789", flag: "France",            portOfRegistry: "Marseille",     year: 2022, type: "Membrane",      capacity: "174,279 m³", owner: "SNC STELLA LEASE",                          operator: "Bernhard Schulte Shipmanagement Hellas",  classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 43, name: "PATRIS",                 imo: "IMO 9766889", callSign: "D5NT8",   flag: "Liberia",           portOfRegistry: "Monrovia",      year: 2018, type: "Membrane",      capacity: "173,709 m³", owner: "Artemis Gas 1 Shipping Inc.",                operator: "K Line Energy Shipping (UK) Ltd.",        classification: "Lloyd's Register", gasMgmt1: "GCU",         gasMgmt2: "N/A",         status: "Active" },
  { id: 44, name: "BW PAVILION LEEARA",     imo: "IMO 9640645", callSign: "9V2726",  flag: "Singapore",         portOfRegistry: "Singapore",     year: 2015, type: "Membrane",      capacity: "161,866 m³", owner: "BW PAVILION LEEARA PTE LTD",                operator: "BW LNG AS",                               classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 45, name: "PRISM BRILLIANCE",       imo: "IMO 9810551", callSign: "3FXT5",   flag: "Panama",            portOfRegistry: "Panama",        year: 2019, type: "Membrane",      capacity: "180,016 m³", owner: "HHIENS2 Shipholding S.A.",                   operator: "SK SHIPPING CO., LTD",                    classification: "KR & ABS",         gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 46, name: "REX TILLERSON",          imo: "IMO 9953248", callSign: "5LPT9",   flag: "Liberia",           portOfRegistry: "Monrovia",      year: 2024, type: "Membrane",      capacity: "174,083 m³", owner: "ORYX LNG No.1 SHIPPING CORPORATION",        operator: "MOL Global Ship Management Pte. Ltd.",    classification: "ABS & CCS",        gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 47, name: "SAINT BARBARA",          imo: "IMO 9946386", callSign: "FMTQ",    flag: "France",            portOfRegistry: "Marseille",     year: 2023, type: "Membrane",      capacity: "174,137 m³", owner: "SNC CHOPIN LEASING",                        operator: "KNUTSEN OAS",                             classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "Reliq Plant", status: "Active" },
  { id: 48, name: "SEAPEAK CREOLE",         imo: "IMO 9681687", callSign: "C6BF3",   flag: "Bahamas",           portOfRegistry: "Nassau",        year: 2016, type: "Membrane",      capacity: "173,480 m³", owner: "SEA 64 LEASING CO. LIMITED",                operator: "SEAPEAK MARITIME (GLASGOW) LIMITED",      classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 49, name: "Seapeak Glasgow",        imo: "IMO 9781918", callSign: "C6DG2",   flag: "Bahamas",           portOfRegistry: "Nassau",        year: 2018, type: "Membrane",      capacity: "174,162 m³", owner: "Seapeak Glasgow LLC",                       operator: "Seapeak Maritime (Glasgow) Ltd.",         classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "Gas Burning", status: "Active" },
  { id: 50, name: "Seapeak Manila",         imo: "IMO 9770921", callSign: "C6CH8",   flag: "Bahamas",           portOfRegistry: "Nassau",        year: 2018, type: "Membrane",      capacity: "173,579 m³", owner: "Hai Jiao 1606",                             operator: "Seapeak Maritime",                        classification: "DNV",              gasMgmt1: "Reliq Plant", gasMgmt2: "GCU",         status: "Active" },
  { id: 51, name: "SERI CAMELLIA",          imo: "IMO 9714276", callSign: "9MVR8",   flag: "Malaysia",          portOfRegistry: "Port Kelang",   year: 2013, type: "Moss-Type",     capacity: "150,727 m³", owner: "SERI CAMELLIA (L) PRIVATE LIMITED",         operator: "SERI CAMELLIA (L) PRIVATE LIMITED",       classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "N/A",         status: "Active" },
  { id: 52, name: "Seri Cempaka",           imo: "IMO 9714290", callSign: "9MWM8",   flag: "Malaysia",          portOfRegistry: "Port Kelang",   year: 2017, type: "Moss-Type",     capacity: "150,547 m³", owner: "Seri Cempaka (L) Ptd Ltd.",                 operator: "MISC Marine",                             classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "Gas Burning", status: "Active" },
  { id: 53, name: "SM EAGLE",               imo: "IMO 9761827", callSign: "3EMX3",   flag: "Panama",            portOfRegistry: "Panama",        year: 2017, type: "Membrane",      capacity: "174,263 m³", owner: "SMKLC LNG1 S.A.",                           operator: "KLCSM CO., LTD.",                         classification: "KR & ABS",         gasMgmt1: "Gas Burning", gasMgmt2: "Reliq Plant", status: "Active" },
  { id: 54, name: "SOLARIS",                imo: "IMO 9634098", callSign: "ZCEL5",   flag: "Bermuda",           portOfRegistry: "Hamilton",      year: 2014, type: "Membrane",      capacity: "155,107 m³", owner: "GAS-Eight LTD",                             operator: "Gaslog LNG Services Ltd",                 classification: "ABS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 55, name: "TIANSHAN",               imo: "IMO 1024754", callSign: "VRWS4",   flag: "Hong Kong, China",  portOfRegistry: "Hong Kong",     year: 2026, type: "Membrane",      capacity: "174,257 m³", owner: "PCI LNG",                                   operator: "COSCO SHIPPING LNG (HK) Ship Mgmt Co.",   classification: "CCS",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 56, name: "Woodside Donaldson",     imo: "IMO 9369899", callSign: "9V8262",  flag: "Singapore",         portOfRegistry: "Singapore",     year: 2009, type: "GTT Mark III",  capacity: "165,758 m³", owner: "MALT Singapore PTE LTD",                    operator: "Seapeak Maritime Glasgow",                classification: "Bureau Veritas",   gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 57, name: "Woodside Rogers",        imo: "IMO 9627485", callSign: "SVBS6",   flag: "Greece",            portOfRegistry: "Piraeus",       year: 2013, type: "Membrane",      capacity: "159,847 m³", owner: "MARGIE SEAWAY CORPORATION INC. (c/o MARAN GAS)", operator: "MARAN GAS MARITIME INC",               classification: "DNV",              gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
  { id: 58, name: "CELSIUS CHARLOTTE",      imo: "IMO 9878711", callSign: "V7A4386", flag: "Marshall Islands",  portOfRegistry: "Majuro",        year: 2021, type: "Membrane",      capacity: "180,290 m³", owner: "Xiang H24 International Ship Lease Co., Ltd", operator: "Celsius Tech Ltd.",                       classification: "Lloyd's Register", gasMgmt1: "Gas Burning", gasMgmt2: "GCU",         status: "Active" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLIST TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
interface TemplateItem {
  id: string; name: string; desc: string;
  requiresDoc: boolean; requiresExpiry: boolean;
  group?: string; unit?: string;
  inputType?: "text" | "select"; options?: string[];
}

const CY = new Date().getFullYear();
const YEAR_OPTIONS: string[] = Array.from({ length: CY - 1959 + 6 }, (_, i) => String(CY + 5 - i));
const GAS_OPTIONS = ["Gas Burning", "GCU", "Reliq Plant"];
const GAS2_OPTIONS = ["N/A", "Gas Burning", "GCU", "Reliq Plant"];

const CHECKLIST_TEMPLATE: { section: string; items: TemplateItem[] }[] = [
  { section: "Required Documents",              items: [] },
  {
    section: "General Information",
    items: [
      { id: "gi-01", group: "Ship Info", name: "Ship's Name",                          desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-02", group: "Ship Info", name: "IMO Number",                           desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-03", group: "Ship Info", name: "Call Sign",                            desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-04", group: "Ship Info", name: "Flag Country",                         desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-05", group: "Ship Info", name: "Port of Registry",                     desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-06", group: "Ship Info", name: "Year Built",                           desc: "", inputType: "select", requiresDoc: false, requiresExpiry: false, options: YEAR_OPTIONS },
      { id: "gi-07", group: "Ship Info", name: "Owner",                                desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-08", group: "Ship Info", name: "Operator",                             desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-09", group: "Ship Info", name: "Type of Cargo Containment System",     desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-10", group: "Ship Info", name: "Tank Capacity — Total 100% Full",      desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false, unit: "m³" },
      { id: "gi-11", group: "Ship Info", name: "Classification Society",               desc: "", inputType: "text",   requiresDoc: false, requiresExpiry: false },
      { id: "gi-12", group: "Ship Info", name: "1st Gas Management System",            desc: "", inputType: "select", requiresDoc: false, requiresExpiry: false, options: GAS_OPTIONS },
      { id: "gi-13", group: "Ship Info", name: "2nd Gas Management System",            desc: "", inputType: "select", requiresDoc: false, requiresExpiry: false, options: GAS2_OPTIONS },
      { id: "gi-14", group: "Ship Major Dimensions", name: "LOA",                                          desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-15", group: "Ship Major Dimensions", name: "LBP",                                          desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-16", group: "Ship Major Dimensions", name: "Breadth",                                      desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-17", group: "Ship Major Dimensions", name: "Depth",                                        desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-18", group: "Ship Major Dimensions", name: "Upper Deck Height above BL",                   desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-19", group: "Ship Major Dimensions", name: "Manifold Height above BL",                     desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-20", group: "Ship Major Dimensions", name: "Ballast Draft",                                desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-21", group: "Ship Major Dimensions", name: "Loaded Draft",                                 desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-22", group: "Ship Major Dimensions", name: "Displacement",                                 desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "tons" },
      { id: "gi-23", group: "Ship Major Dimensions", name: "Gross Tonnage",                                desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "tons" },
      { id: "gi-24", group: "Ship Major Dimensions", name: "Sunken Bitts Upper Position Height above BL",  desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
      { id: "gi-25", group: "Ship Major Dimensions", name: "Sunken Bitts Lower Position Height above BL",  desc: "", inputType: "text", requiresDoc: false, requiresExpiry: false, unit: "m." },
    ],
  },
  { section: "Fender / Flat Body",             items: [] },
  { section: "Mooring Arrangement",            items: [] },
  { section: "Gangway",                        items: [] },
  { section: "Unloading Arm",                  items: [] },
  { section: "Cargo Management",               items: [] },
  { section: "Ship Shore Link System",         items: [] },
  { section: "CTMS",                           items: [] },
  { section: "Short Distance Pieces (SDPs)",   items: [] },
  { section: "Utility System",                  items: [] },
  { section: "Attachment",                      items: [] },
  { section: "Quality Assessment",               items: [] },
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Role           = "terminal_officer" | "ship_officer" | "viewer";
type AccountStatus  = "pending" | "approved" | "rejected";
type StudyStatus    = "access_requested" | "access_rejected" | "draft" | "submitted" | "approved" | "edit_requested" | "editing";
type Page           = "login" | "register" | "forgot" | "home" | "vessel" | "study" | "admin";
type RegStep        = "form" | "otp" | "submitted";
type ForgotStep     = "email" | "pending" | "password" | "done";
type AdminTab       = "pending" | "approved" | "rejected" | "all";

interface UserAccount {
  id: string; name: string; email: string;
  company: string; role?: Role; status: AccountStatus;
  isAdmin: boolean; registeredAt: string;
  /** Local-preview only. Passwords are never loaded from Supabase. */
  password?: string;
}

interface StudyItem {
  id: string; section: string; name: string; desc: string;
  requiresDoc: boolean; requiresExpiry: boolean;
  value: string; documentName: string; expiryDate: string;
  terminalNote: string; isCorrected: boolean;
}

interface SSCSStudy {
  id: string; vesselId: number; vesselName: string; status: StudyStatus;
  initiatedById: string; initiatedByName: string; initiatedByRole?: Role;
  initiatedAt: string; submittedAt?: string;
  reviewedById?: string; reviewedByName?: string; approvedAt?: string;
  editRequestedById?: string; editRequestedByName?: string; editRequestedAt?: string;
  items: StudyItem[]; shipNotes: string; terminalNotes: string;
  flatBodyData: FlatBodyData;
  fenderReactionData: FenderReactionData;
  berthingEnergyData: BerthingEnergyData;
  mooringArrangementData: MooringArrangementData;
  gangwayData: GangwayData;
  unloadingArmData: UnloadingArmData;
  cargoManagementData: CargoManagementData;
  shipShoreLinkData: ShipShoreLinkData;
  ctmsData: CTMSData;
  sdpData: SDPData;
  utilityData: UtilityData;
  requiredDocuments: RequiredDocumentsData;
  attachmentData: AttachmentData;
  qualityAssessmentData: QualityAssessmentData;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_USERS: UserAccount[] = [
  { id: "admin-001", name: "System Administrator",   email: "admin.demo@lmpt2.local",       password: "DemoAdmin1234",    company: "LMPT2 Operations",      status: "approved", isAdmin: true,  registeredAt: "2024-01-01T00:00:00Z" },
  { id: "user-t01", name: "Demo Terminal Officer",   email: "terminal.demo@lmpt2.local",     password: "DemoTerminal1234", company: "Pacific LNG Terminal",   role: "terminal_officer", status: "approved", isAdmin: false, registeredAt: "2024-06-01T08:00:00Z" },
  { id: "user-s01", name: "Demo Ship Officer",       email: "ship.demo@lmpt2.local",      password: "DemoShip1234",     company: "Pacific LNG Terminal",   role: "ship_officer",     status: "approved", isAdmin: false, registeredAt: "2024-06-10T08:00:00Z" },
  { id: "user-v01", name: "Demo Viewer",             email: "viewer.demo@lmpt2.local",   password: "DemoViewer1234",   company: "Pacific LNG Analytics",  role: "viewer",           status: "approved", isAdmin: false, registeredAt: "2024-06-15T08:00:00Z" },
];

const INITIAL_STUDIES: SSCSStudy[] = [];

const CLOUD_STUDY_DEFAULTS: Record<string, () => any> = {
  flatBodyData: defaultFlatBodyData,
  fenderReactionData: defaultFenderReactionData,
  berthingEnergyData: defaultBerthingEnergyData,
  mooringArrangementData: defaultMooringArrangementData,
  gangwayData: defaultGangwayData,
  unloadingArmData: defaultUnloadingArmData,
  cargoManagementData: defaultCargoManagementData,
  shipShoreLinkData: defaultShipShoreLinkData,
  ctmsData: defaultCTMSData,
  sdpData: defaultSDPData,
  utilityData: defaultUtilityData,
  requiredDocuments: defaultRequiredDocumentsData,
  attachmentData: defaultAttachmentData,
  qualityAssessmentData: defaultQualityAssessmentData,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function generateOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function isExpired(d: string) { return !!d && new Date(d) < new Date(); }

function blankStudy(vessel: Vessel, user: UserAccount, prev?: SSCSStudy, initialStatus?: StudyStatus): SSCSStudy {
  const isVesselOwner = vessel.createdById === user.id;
  const status: StudyStatus = initialStatus ?? (
    user.role === "terminal_officer" || isVesselOwner ? "draft" : "access_requested"
  );
  return {
    id: `study-${Date.now()}`, vesselId: vessel.id, vesselName: vessel.name,
    status, initiatedById: user.id, initiatedByName: user.name,
    initiatedByRole: user.role, initiatedAt: new Date().toISOString(),
    items: CHECKLIST_TEMPLATE.flatMap(sec =>
      sec.items.map(tmpl => {
        const old = prev?.items.find(i => i.id === tmpl.id);
        const expired = old && isExpired(old.expiryDate);
        return {
          id: tmpl.id, section: sec.section, name: tmpl.name, desc: tmpl.desc,
          requiresDoc: tmpl.requiresDoc, requiresExpiry: tmpl.requiresExpiry,
          value:        tmpl.id === "gi-01" ? vessel.name
                      : tmpl.id === "gi-02" ? vessel.imo
                      : old && !expired ? old.value : "",
          documentName: old && !expired ? old.documentName : "",
          expiryDate:   old && !expired ? old.expiryDate   : "",
          terminalNote: "", isCorrected: false,
        };
      })
    ),
    shipNotes: "", terminalNotes: "",
    flatBodyData: prev?.flatBodyData ?? defaultFlatBodyData(),
    fenderReactionData: prev?.fenderReactionData ?? defaultFenderReactionData(),
    berthingEnergyData: prev?.berthingEnergyData ?? defaultBerthingEnergyData(),
    mooringArrangementData: prev?.mooringArrangementData ?? defaultMooringArrangementData(),
    gangwayData: prev?.gangwayData ?? defaultGangwayData(),
    unloadingArmData: prev?.unloadingArmData ?? defaultUnloadingArmData(),
    cargoManagementData: prev?.cargoManagementData ?? defaultCargoManagementData(),
    shipShoreLinkData: prev?.shipShoreLinkData ?? defaultShipShoreLinkData(),
    ctmsData: prev?.ctmsData ?? defaultCTMSData(),
    sdpData: prev?.sdpData ?? defaultSDPData(),
    utilityData: prev?.utilityData ?? defaultUtilityData(),
    requiredDocuments: prev?.requiredDocuments ?? defaultRequiredDocumentsData(),
    attachmentData: prev?.attachmentData ?? defaultAttachmentData(),
    qualityAssessmentData: prev?.qualityAssessmentData ?? defaultQualityAssessmentData(),
  };
}

function completionPct(study: SSCSStudy) {
  const n = study.items.length;
  if (n === 0) return 0;
  const done = study.items.filter(i =>
    i.value && (!i.requiresDoc || i.documentName) && (!i.requiresExpiry || i.expiryDate)
  ).length;
  return Math.round((done / n) * 100);
}

function getLatestStudy(studies: SSCSStudy[], vesselId: number) {
  return studies
    .filter(s => s.vesselId === vesselId)
    .sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime())[0];
}

const SISTER_MAJOR_DIMENSION_IDS = new Set([
  "gi-14", "gi-15", "gi-16", "gi-17", "gi-18", "gi-19",
  "gi-20", "gi-21", "gi-22", "gi-23", "gi-24", "gi-25",
]);

const SISTER_BORROWED_DOC_KEYS: DocKey[] = [
  "d_2_1", "d_2_2", "d_2_3", "d_2_4", "d_2_5",
  "d_3_1", "d_3_2", "d_3_3", "d_3_4",
  "d_4_1", "d_4_2",
];

function getLatestApprovedStudy(studies: SSCSStudy[], vesselId: number) {
  return studies
    .filter(s => s.vesselId === vesselId && s.status === "approved")
    .sort((a, b) => new Date(b.approvedAt ?? b.initiatedAt).getTime() - new Date(a.approvedAt ?? a.initiatedAt).getTime())[0];
}

function mergeSisterReferenceStudy(target: SSCSStudy, reference: SSCSStudy): SSCSStudy {
  const refDocs = reference.requiredDocuments ?? defaultRequiredDocumentsData();
  const ownDocs = target.requiredDocuments ?? defaultRequiredDocumentsData();
  const requiredDocuments = { ...ownDocs };
  for (const key of SISTER_BORROWED_DOC_KEYS) {
    requiredDocuments[key] = [...(refDocs[key] ?? [])];
  }

  return {
    ...target,
    items: target.items.map(item => {
      if (!SISTER_MAJOR_DIMENSION_IDS.has(item.id)) return item;
      const ref = reference.items.find(source => source.id === item.id);
      return ref ? { ...item, value: ref.value } : item;
    }),
    flatBodyData: structuredClone(reference.flatBodyData ?? defaultFlatBodyData()),
    fenderReactionData: structuredClone(reference.fenderReactionData ?? defaultFenderReactionData()),
    berthingEnergyData: structuredClone(reference.berthingEnergyData ?? defaultBerthingEnergyData()),
    mooringArrangementData: structuredClone(reference.mooringArrangementData ?? defaultMooringArrangementData()),
    gangwayData: structuredClone(reference.gangwayData ?? defaultGangwayData()),
    unloadingArmData: structuredClone(reference.unloadingArmData ?? defaultUnloadingArmData()),
    cargoManagementData: structuredClone(reference.cargoManagementData ?? defaultCargoManagementData()),
    shipShoreLinkData: structuredClone(reference.shipShoreLinkData ?? defaultShipShoreLinkData()),
    utilityData: structuredClone(reference.utilityData ?? defaultUtilityData()),
    requiredDocuments,
  };
}

function vesselWithSubmittedGeneralInfo(vessel: Vessel, study?: SSCSStudy): Vessel {
  // Main/Search must show the latest submitted information, not unfinished edits.
  // Draft/editing values stay inside the study until the user submits again.
  const publishedStatuses: StudyStatus[] = ["submitted", "approved", "edit_requested"];
  if (!study?.submittedAt || !publishedStatuses.includes(study.status)) return vessel;

  const gi = (id: string) => study.items.find(item => item.id === id)?.value?.trim() ?? "";
  const yearRaw = gi("gi-06");
  const parsedYear = Number.parseInt(yearRaw, 10);
  const capacityRaw = gi("gi-10");
  const capacity = capacityRaw
    ? `${capacityRaw}${/m³|m3/i.test(capacityRaw) ? "" : " m³"}`
    : vessel.capacity;

  return {
    ...vessel,
    // Vessel identity is canonical in public.vessels. Ship name changes only via
    // the explicit Change action; IMO is immutable after the vessel is created.
    name: vessel.name,
    imo: vessel.imo,
    callSign: gi("gi-03") || vessel.callSign,
    flag: gi("gi-04") || vessel.flag,
    portOfRegistry: gi("gi-05") || vessel.portOfRegistry,
    year: Number.isFinite(parsedYear) ? parsedYear : vessel.year,
    owner: gi("gi-07") || vessel.owner,
    operator: gi("gi-08") || vessel.operator,
    type: gi("gi-09") || vessel.type,
    capacity,
    classification: gi("gi-11") || vessel.classification,
    gasMgmt1: gi("gi-12") || vessel.gasMgmt1,
    gasMgmt2: gi("gi-13") || vessel.gasMgmt2,
  };
}


function withCanonicalVesselIdentity(study: SSCSStudy, vessel?: Vessel): SSCSStudy {
  if (!vessel) return study;
  return {
    ...study,
    vesselName: vessel.name,
    items: study.items.map(item =>
      item.id === "gi-01" ? { ...item, value: vessel.name }
      : item.id === "gi-02" ? { ...item, value: vessel.imo }
      : item
    ),
  };
}


function buildApprovalEmailDraft(vessel: Vessel, study: SSCSStudy) {
  const gi = (id: string) => study.items.find(i => i.id === id)?.value?.trim() ?? "";
  const vesselName = vessel.name || study.vesselName;
  const ballastDraftVal = gi("gi-20");
  const loadedDraftVal = gi("gi-21");
  const upperDeckVal = gi("gi-18");
  const manifoldHVal = gi("gi-19");
  const pn = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? NaN : parsed;
  };

  const pattern = study.mooringArrangementData?.pattern;
  const fwdNums = pattern ? [pattern.fwd1, pattern.fwd2, pattern.fwd3, pattern.fwd4].filter(Boolean) : [];
  const aftNums = pattern ? [pattern.aft1, pattern.aft2, pattern.aft3, pattern.aft4].filter(Boolean) : [];
  const patternStr = fwdNums.length || aftNums.length
    ? `FWD ${fwdNums.join("+")} / AFT ${aftNums.join("+")}`
    : "—";

  const ropeType = study.mooringArrangementData?.mooringRope?.type || "";
  const tailType = study.mooringArrangementData?.tailRope?.type || "";
  const ropeStr = ropeType || tailType ? [ropeType, tailType].filter(Boolean).join(" / ") : "—";

  const gangway = study.gangwayData;
  const gwLen = pn(gangway?.b ?? "") - pn(gangway?.a ?? "");
  const gwWid = pn(gangway?.d ?? "") - pn(gangway?.c ?? "");
  const gwHasVals = !!(gangway?.a && gangway?.b && gangway?.c && gangway?.d);
  const gangwayAreaResult: "ok" | "fail" | null = gwHasVals
    ? (!Number.isNaN(gwLen) && !Number.isNaN(gwWid) && gwLen > 2.45 && gwWid > 0.60 ? "ok" : "fail")
    : null;

  const ud = pn(upperDeckVal);
  const bd = pn(ballastDraftVal);
  const ld = pn(loadedDraftVal);
  const gwUp = Number.isNaN(ud) || Number.isNaN(bd) ? NaN : 22.7 - ud + bd - 3.5;
  const gwLo = Number.isNaN(ud) || Number.isNaN(ld) ? NaN : ud - ld - 12.1;
  const gangwayRangeResult: "ok" | "fail" | null = !Number.isNaN(gwUp) && !Number.isNaN(gwLo)
    ? (gwUp > 0 && gwLo > 0 ? "ok" : "fail")
    : null;

  const mh = pn(manifoldHVal);
  const uaUp = Number.isNaN(mh) || Number.isNaN(bd) ? NaN : 27.5 - mh + bd - 3.5;
  const uaLo = Number.isNaN(mh) || Number.isNaN(ld) ? NaN : mh - ld - 17.5;
  const unloadingArmResult: "ok" | "fail" | null = !Number.isNaN(uaUp) && !Number.isNaN(uaLo)
    ? (uaUp > 0 && uaLo > 0 ? "ok" : "fail")
    : null;

  const ctms = study.ctmsData;
  const ctmsFail: string[] = [];
  if (ctms) {
    const primary = pn(ctms.primaryLevel.accuracy);
    if (!ctms.primaryLevel.accuracy || Number.isNaN(primary) || primary > 7.5) ctmsFail.push("Primary Level Sensor");
    const secondary = pn(ctms.secondaryLevel.accuracy);
    if (!ctms.secondaryLevel.accuracy || Number.isNaN(secondary) || secondary > 7.5) ctmsFail.push("Secondary Level Sensor");
    const t1 = pn(ctms.temperature.accuracyRange1);
    const t2 = pn(ctms.temperature.accuracyRange2);
    if (!ctms.temperature.accuracyRange1 || !ctms.temperature.accuracyRange2 || Number.isNaN(t1) || Number.isNaN(t2) || t1 > 0.2 || t2 > 1.5) ctmsFail.push("Temperature Sensor");
    const pressure = pn(ctms.pressure.accuracy);
    if (!ctms.pressure.accuracy || Number.isNaN(pressure) || pressure > 1) ctmsFail.push("Pressure Sensor");
  }
  const ctmsHasData = !!(ctms && (ctms.primaryLevel.accuracy || ctms.secondaryLevel.accuracy || ctms.temperature.accuracyRange1 || ctms.pressure.accuracy));
  const ctmsResult: "ok" | "fail" | null = ctmsHasData ? (ctmsFail.length === 0 ? "ok" : "fail") : null;
  const ctmsLabel = ctmsResult === "ok"
    ? "All Acceptable"
    : ctmsResult === "fail"
      ? `All Acceptable, except ${ctmsFail.join(", ")}`
      : "—";

  const sdp = study.sdpData;
  const sdpCheck = (value: string, min: number | null, max: number | null) => {
    if (!value) return false;
    const n = pn(value);
    if (Number.isNaN(n)) return false;
    if (min !== null && n < min) return false;
    if (max !== null && n > max) return false;
    return true;
  };
  const sdpHasData = !!(sdp && (sdp.outsideDiameter || sdp.flangeThickness || sdp.raisedFace || sdp.insideDiameter || sdp.surfaceFinishMax));
  const sdpAllOk = !!(sdpHasData && sdp && [
    sdpCheck(sdp.outsideDiameter, 595, 598.5),
    sdpCheck(sdp.flangeThickness, 36.6, 41),
    sdpCheck(sdp.raisedFace, 460, 470),
    sdpCheck(sdp.insideDiameter, null, 387),
    sdpCheck(sdp.surfaceFinishMax, 3.2, 12.5),
    sdpCheck(sdp.surfaceFinishMin, 3.2, 12.5),
  ].every(Boolean));
  const sdpResult: "ok" | "fail" | null = sdpHasData ? (sdpAllOk ? "ok" : "fail") : null;

  const resultText = (result: "ok" | "fail" | null) =>
    result === "ok" ? "Acceptable" : result === "fail" ? "Unacceptable" : "—";

  const subject = `[SSCS | LMPT2] Approved | the LNG/C ${vesselName}`;
  const body = [
    "Dear Sir/Madam,",
    "",
    `The Ship Shore Compatibility Study (SSCS) for the LNG/C ${vesselName} has been approved by LMPT2.`,
    "Please find the approval summary below.",
    "",
    "APPROVAL DETAILS",
    `Study ID: ${study.id}`,
    `Initiated by: ${study.initiatedByName || "—"}`,
    `Approved by: ${study.reviewedByName || "—"}`,
    `Approved date: ${study.approvedAt ? fmtDate(study.approvedAt) : "—"}`,
    "",
    "SSCS SUMMARY",
    `Ship's Name: ${vesselName}`,
    `1st Gas Management System: ${vessel.gasMgmt1 || "—"}`,
    `2nd Gas Management System: ${vessel.gasMgmt2 || "—"}`,
    `Ballast Draft: ${ballastDraftVal ? `${ballastDraftVal} m.` : "—"}`,
    `Loaded Draft: ${loadedDraftVal ? `${loadedDraftVal} m.` : "—"}`,
    "Sunken Bitts: To be calculated",
    `Mooring Pattern: ${patternStr}`,
    `Mooring / Tail Rope: ${ropeStr}`,
    `Gangway Area: ${resultText(gangwayAreaResult)}`,
    `Gangway Working Range: ${resultText(gangwayRangeResult)}`,
    `Unloading Arm Working Range: ${resultText(unloadingArmResult)}`,
    `CTMS: ${ctmsLabel}`,
    `SDPs: ${resultText(sdpResult)}`,
    "",
    ...(study.terminalNotes?.trim() ? ["TERMINAL OFFICER NOTES", study.terminalNotes.trim(), ""] : []),
    "Best regards,",
    "LMPT2 SSCS",
  ].join("\r\n");

  return { subject, body };
}

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_META: Record<Role, { label: string; color: string }> = {
  terminal_officer: { label: "Terminal Officer", color: "text-sky-400 bg-sky-500/10 border-sky-500/20"        },
  ship_officer:     { label: "Ship Officer",     color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  viewer:           { label: "Viewer",           color: "text-slate-400 bg-slate-500/10 border-slate-500/20"    },
};

const STUDY_META: Record<StudyStatus, { label: string; color: string }> = {
  access_requested: { label: "Awaiting Access Approval", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  access_rejected:  { label: "Access Rejected",          color: "text-red-400 bg-red-500/10 border-red-500/20"          },
  draft:            { label: "Draft",                    color: "text-slate-400 bg-slate-500/10 border-slate-500/20"    },
  submitted:        { label: "Submitted",                color: "text-amber-400 bg-amber-500/10 border-amber-500/20"    },
  approved:         { label: "Approved",                 color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  edit_requested:   { label: "Edit Requested",           color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  editing:          { label: "Edit In Progress",         color: "text-sky-400 bg-sky-500/10 border-sky-500/20"          },
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────────────────────────────
function GridBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(rgba(15,61,140,1) 1px,transparent 1px),linear-gradient(90deg,rgba(15,61,140,1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
        <Anchor className="w-4 h-4 text-primary" />
      </div>
      <div className="leading-none">
        <p className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Ship Shore Compatibility Study</p>
        <p className="font-mono text-xs font-bold text-primary tracking-wider">LMPT2</p>
      </div>
    </div>
  );
}

type TaskItem = { study: SSCSStudy; label: string; priority: "high" | "normal" };

function TaskFloater({ tasks, open, onToggle, onSelect }: {
  tasks: TaskItem[]; open: boolean;
  onToggle: () => void; onSelect: (s: SSCSStudy) => void;
}) {
  const priorityColor = (p: TaskItem["priority"]) =>
    p === "high" ? "text-amber-400" : "text-sky-400";

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 bg-card border border-border rounded shadow-2xl overflow-hidden flex flex-col max-h-[440px] mb-1">
          <div className="px-4 py-3 border-b border-border bg-secondary/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-primary" />
              <p className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">Task List</p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{tasks.length} pending</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {tasks.length === 0
              ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-border" />
                  <p className="text-xs text-muted-foreground font-mono">All caught up</p>
                </div>
              )
              : tasks.map((t, i) => (
                <button key={t.study.id} onClick={() => onSelect(t.study)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-secondary transition-colors group ${i < tasks.length - 1 ? "border-b border-border/50" : ""}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">{t.study.vesselName}</p>
                    <StudyBadge status={t.study.status} />
                  </div>
                  <p className={`font-mono text-[10px] ${priorityColor(t.priority)}`}>{t.label}</p>
                </button>
              ))
            }
          </div>
        </div>
      )}
      <button onClick={onToggle}
        className={`relative w-11 h-11 rounded-full shadow-xl border flex items-center justify-center transition-all ${
          open ? "bg-primary text-primary-foreground border-primary shadow-primary/20" : "bg-card text-foreground border-border hover:bg-secondary"
        }`}>
        <ClipboardList className="w-5 h-5" />
        {tasks.length > 0 && !open && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground font-mono text-[10px] font-bold flex items-center justify-center px-1 shadow">{tasks.length}</span>
        )}
      </button>
    </div>
  );
}

function NavBar({ user, pendingCount, onAdmin, onHome, onLogout }: {
  user: UserAccount; pendingCount: number;
  onAdmin: () => void; onHome: () => void; onLogout: () => void;
}) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <button onClick={onHome} className="hover:opacity-80 transition-opacity"><Logo /></button>
        <div className="flex items-center gap-3">
          {user.isAdmin && (
            <button onClick={onAdmin}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-xs font-mono text-primary transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground font-mono text-[10px] font-bold flex items-center justify-center px-1">{pendingCount}</span>
              )}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="capitalize">{user.name.split(" ")[0]}</span>
            </div>
            {user.role && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${ROLE_META[user.role].color}`}>
                {ROLE_META[user.role].label}
              </span>
            )}
            {user.isAdmin && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border text-primary bg-primary/10 border-primary/30">Admin</span>
            )}
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded border border-border hover:bg-secondary">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, icon: Icon, trailing }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder: string; icon: React.ElementType; trailing?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-secondary border border-border rounded pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all" />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  );
}

function VesselBadge({ status }: { status: string }) {
  const ok = status === "Active";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase border ${ok ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />{status}
    </span>
  );
}

function AcctBadge({ status }: { status: AccountStatus }) {
  const cfg = { pending: { cls: "text-amber-400 bg-amber-500/10 border-amber-500/20", Icon: Clock }, approved: { cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircle2 }, rejected: { cls: "text-red-400 bg-red-500/10 border-red-500/20", Icon: XCircle } }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase border ${cfg.cls}`}>
      <cfg.Icon className="w-3 h-3" />{status}
    </span>
  );
}

function StudyBadge({ status }: { status: StudyStatus }) {
  const m = STUDY_META[status];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase border ${m.color}`}>{m.label}</span>;
}

function CertificateInvalidBadge({ count }: { count: number }) {
  return (
    <span
      title={`${count} certificate${count === 1 ? "" : "s"} expired`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase border bg-red-500/10 text-red-500 border-red-500/25"
    >
      <AlertTriangle className="w-3 h-3" />
      Certificate Invalid{count > 1 ? ` (${count})` : ""}
    </span>
  );
}

function CertificateExpiringBadge({ count }: { count: number }) {
  return (
    <span
      title={`${count} certificate${count === 1 ? "" : "s"} will expire within 90 days`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase border bg-amber-500/10 text-amber-400 border-amber-500/30"
    >
      <AlertTriangle className="w-3 h-3" />
      Certificate Expiring{count > 1 ? ` (${count})` : ""}
    </span>
  );
}

function SisterShipBadge({ status }: { status: SisterShipStatus }) {
  const cls = status === "verified"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    : status === "rejected"
      ? "bg-red-500/10 text-red-400 border-red-500/30"
      : "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold tracking-wider uppercase border ${cls}`}>
      <RefreshCw className="w-2.5 h-2.5" /> Sister {status}
    </span>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" | "info" }) {
  return (
    <div className={`fixed bottom-20 right-6 z-[999] flex items-center gap-2.5 px-4 py-3 rounded border shadow-2xl font-mono text-sm animate-in slide-in-from-bottom-4 ${
      type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
      type === "error"   ? "bg-red-500/10 border-red-500/30 text-red-400" :
      "bg-sky-500/10 border-sky-500/30 text-sky-400"
    }`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : type === "error" ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const font = { fontFamily: "'Barlow', sans-serif" };

  // ── Core state ──────────────────────────────────────────────────────────────
  const [page, setPage]               = useState<Page>("login");
  const [users, setUsers]             = useState<UserAccount[]>(supabaseConfigured ? [] : INITIAL_USERS);
  const [studies, setStudies]         = useState<SSCSStudy[]>(supabaseConfigured ? [] : INITIAL_STUDIES);
  const [vessels, setVessels]         = useState<Vessel[]>(supabaseConfigured ? [] : INITIAL_VESSELS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [backendLoading, setBackendLoading] = useState(supabaseConfigured);
  const [backendError, setBackendError] = useState("");
  const studySaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [activeStudy, setActiveStudy] = useState<SSCSStudy | null>(null);
  const [studyTab, setStudyTab]       = useState<string>(CHECKLIST_TEMPLATE[0].section);
  const [generalInfoSubTab, setGeneralInfoSubTab] = useState<string>("Ship Info");
  const [shipNameEditing, setShipNameEditing] = useState(false);
  const [shipNameDraft, setShipNameDraft] = useState("");
  const [shipNameSaving, setShipNameSaving] = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [kickoffVessel, setKickoffVessel] = useState<Vessel | null>(null);

  // ── Login state ─────────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]     = useState("");
  const [loginPw, setLoginPw]           = useState("");
  const [showLoginPw, setShowLoginPw]   = useState(false);
  const [loginErr, setLoginErr]         = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Register state ───────────────────────────────────────────────────────────
  const [regStep, setRegStep]       = useState<RegStep>("form");
  const [regName, setRegName]       = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regEmail, setRegEmail]     = useState("");
  const [regPw, setRegPw]           = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regRole, setRegRole]       = useState<Role>("ship_officer");
  const [showRegPw, setShowRegPw]   = useState(false);
  const [regErr, setRegErr]         = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpInput, setOtpInput]     = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpErr, setOtpErr]         = useState("");

  // ── Forgot password / admin-approved reset state ───────────────────────────────
  const [forgotEmail, setForgotEmail]       = useState("");
  const [forgotStep, setForgotStep]         = useState<ForgotStep>("email");
  const [forgotRequestId, setForgotRequestId] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [forgotNewPw, setForgotNewPw]       = useState("");
  const [forgotConfirmPw, setForgotConfirmPw] = useState("");
  const [forgotErr, setForgotErr]           = useState("");
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [showForgotPw, setShowForgotPw]     = useState(false);

  // ── Search state ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Vessel[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Admin state ──────────────────────────────────────────────────────────────
  const [adminTab, setAdminTab] = useState<AdminTab>("pending");
  const [passwordResetRequests, setPasswordResetRequests] = useState<CloudPasswordResetRequest[]>([]);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // ── Task panel state ─────────────────────────────────────────────────────────
  const [showTaskPanel, setShowTaskPanel] = useState(false);

  // ── SSCS Summary popup ───────────────────────────────────────────────────────
  const [summaryVesselId, setSummaryVesselId] = useState<number | null>(null);

  // ── Add Vessel state ─────────────────────────────────────────────────────────
  const [showAddVessel, setShowAddVessel] = useState(false);
  const [addVName, setAddVName]           = useState("");
  const [addVType, setAddVType]           = useState("LNG Carrier");
  const [addVCapacity, setAddVCapacity]   = useState("");
  const [addVFlag, setAddVFlag]           = useState("");
  const [addVYear, setAddVYear]           = useState(String(new Date().getFullYear()));
  const [addVImo, setAddVImo]             = useState("");
  const [addVStatus, setAddVStatus]       = useState<"Active" | "In Refit">("Active");
  const [addVErr, setAddVErr]             = useState("");
  const [addVIsSister, setAddVIsSister]   = useState(false);
  const [addVReferenceSearch, setAddVReferenceSearch] = useState("");
  const [addVReferenceVesselId, setAddVReferenceVesselId] = useState<number | null>(null);
  const [addVSisterStatement, setAddVSisterStatement] = useState<File | null>(null);

  const pendingCount = users.filter(u => !u.isAdmin && u.status === "pending").length;
  const addVReferenceCandidates = vessels
    .filter(v => !!getLatestApprovedStudy(studies, v.id))
    .filter(v => {
      const q = addVReferenceSearch.trim().toLowerCase();
      return !q || [v.name, v.imo, v.callSign].some(value => (value || "").toLowerCase().includes(q));
    })
    .slice(0, 8);

  function showToast(msg: string, type: "success" | "error" | "info" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function resetAddVesselForm() {
    setAddVName(""); setAddVType("LNG Carrier"); setAddVCapacity(""); setAddVFlag("");
    setAddVYear(String(new Date().getFullYear())); setAddVImo(""); setAddVStatus("Active"); setAddVErr("");
    setAddVIsSister(false); setAddVReferenceSearch(""); setAddVReferenceVesselId(null); setAddVSisterStatement(null);
  }


  function openApprovalEmailDraft(vessel: Vessel, study: SSCSStudy) {
    const recipient = users.find(user => user.id === study.initiatedById)?.email?.trim() ?? "";
    const ccRecipient = ((import.meta.env.VITE_EMAILJS_CC_EMAIL as string | undefined)?.trim() || "pttlng-marinelmpt2@pttlng.com");
    const { subject, body } = buildApprovalEmailDraft(vessel, study);
    const mailto = `mailto:${encodeURIComponent(recipient)}?cc=${encodeURIComponent(ccRecipient)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  async function loadCloudData() {
    if (!supabaseConfigured) return;
    const [cloudUsers, cloudVessels, cloudStudies] = await Promise.all([
      fetchProfiles(),
      fetchVessels(),
      fetchStudies(CLOUD_STUDY_DEFAULTS),
    ]);
    const loadedVessels = cloudVessels as Vessel[];
    const vesselMap = new Map(loadedVessels.map(vessel => [vessel.id, vessel]));
    setUsers(cloudUsers as UserAccount[]);
    setVessels(loadedVessels);
    setStudies((cloudStudies as SSCSStudy[]).map(study => withCanonicalVesselIdentity(study, vesselMap.get(study.vesselId))));
  }

  // Restore Supabase session and hydrate cloud data. In local-preview mode the original
  // in-memory demo data remains available, so the exported project is still previewable
  // before environment variables are configured.
  useEffect(() => {
    if (!supabaseConfigured) {
      setVessels(prev => {
        const userAdded = prev.filter(v => v.createdById);
        return [...INITIAL_VESSELS, ...userAdded];
      });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (!session?.user) return;
        const profile = await fetchMyProfile(session.user.id);
        if (!profile) {
          await cloudSignOut();
          return;
        }
        if (profile.status !== "approved") {
          await cloudSignOut();
          if (!cancelled) setLoginErr(profile.status === "pending"
            ? "Your account is awaiting admin approval."
            : "Your access request was not approved. Contact the administrator.");
          return;
        }
        if (!cancelled) {
          const user = profile as UserAccount;
          setCurrentUser(user);
          await loadCloudData();
          setPage(user.isAdmin ? "admin" : "home");
        }
      } catch (err) {
        console.error("[Supabase restore failed]", err);
        if (!cancelled) setBackendError(err instanceof Error ? err.message : "Unable to connect to Supabase.");
      } finally {
        if (!cancelled) setBackendLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      Object.values(studySaveTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Resume an in-progress no-email password reset request after refresh.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("lmpt2_password_reset");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.requestId && saved?.resetToken && saved?.email) {
        setForgotRequestId(saved.requestId);
        setForgotResetToken(saved.resetToken);
        setForgotEmail(saved.email);
      }
    } catch {
      window.localStorage.removeItem("lmpt2_password_reset");
    }
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    const latestVessels = vessels.map(v =>
      vesselWithSubmittedGeneralInfo(v, getLatestStudy(studies, v.id))
    );
    setSearchResults(q.length >= 1
      ? latestVessels.filter(v => [v.name, v.type, v.flag, v.imo, v.callSign, v.operator, v.owner, v.classification, v.portOfRegistry].some(f => (f || "").toLowerCase().includes(q))).slice(0, 8)
      : []);
  }, [searchQuery, vessels, studies]);

  useEffect(() => {
    function outside(e: MouseEvent) { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  useEffect(() => {
    if (page === "admin" && currentUser?.isAdmin && supabaseConfigured) {
      void loadPasswordResetRequests();
    }
  }, [page, currentUser?.id]);

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail || !loginPw) { setLoginErr("Email and password are required."); return; }
    setLoginLoading(true);
    setLoginErr("");
    setBackendError("");
    try {
      if (supabaseConfigured) {
        const auth = await cloudSignIn(loginEmail.trim(), loginPw);
        const profile = await fetchMyProfile(auth.user.id);
        if (!profile) throw new Error("Your user profile has not been created yet.");
        if (profile.status === "pending") {
          await cloudSignOut();
          setLoginErr("Your account is awaiting admin approval.");
          return;
        }
        if (profile.status === "rejected") {
          await cloudSignOut();
          setLoginErr("Your access request was not approved. Contact the administrator.");
          return;
        }
        const found = profile as UserAccount;
        setCurrentUser(found);
        await loadCloudData();
        setPage(found.isAdmin ? "admin" : "home");
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        const found = users.find(u => u.email === loginEmail && u.password === loginPw);
        if (!found)                           setLoginErr("Invalid email or password.");
        else if (found.status === "pending")  setLoginErr("Your account is awaiting admin approval.");
        else if (found.status === "rejected") setLoginErr("Your access request was not approved. Contact the administrator.");
        else { setCurrentUser(found); setLoginErr(""); setPage(found.isAdmin ? "admin" : "home"); }
      }
    } catch (err) {
      console.error("[Login failed]", err);
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setLoginErr(message.toLowerCase().includes("email not confirmed")
        ? "Email confirmation is enabled in Supabase. Disable Confirm email when using the existing EmailJS OTP flow, or confirm the Supabase email first."
        : message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setRegErr("");
    if (!regName.trim())          return setRegErr("Full name is required.");
    if (!regCompany.trim())       return setRegErr("Company name is required.");
    if (!regEmail.includes("@"))  return setRegErr("Enter a valid email address.");
    if (!supabaseConfigured && users.find(u => u.email === regEmail)) return setRegErr("An account with this email already exists.");
    if (regPw.length < 8)         return setRegErr("Password must be at least 8 characters.");
    if (regPw !== regConfirm)     return setRegErr("Passwords do not match.");
    setOtpSending(true);
    const otp = generateOtp();
    setGeneratedOtp(otp);
    try {
      await sendOTPEmail({ toEmail: regEmail, userName: regName, otp });
      setRegStep("otp");
    } catch (err) {
      console.error("[OTP email failed]", err);
      setRegErr(err instanceof Error ? err.message : "Unable to send OTP email.");
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpErr("");
    if (otpInput.trim() !== generatedOtp) return setOtpErr("Incorrect OTP. Please check the code and try again.");
    try {
      if (supabaseConfigured) {
        const auth = await cloudSignUp({
          email: regEmail.trim(),
          password: regPw,
          fullName: regName.trim(),
          company: regCompany.trim(),
          role: regRole,
        });
        if (auth.user?.identities && auth.user.identities.length === 0) {
          throw new Error("An account with this email already exists.");
        }
        // With EmailJS handling email verification, Supabase Auth should have Confirm email disabled.
        // Admin notification addresses can be configured explicitly because a newly-created
        // pending account is intentionally not allowed to read the full user directory.
        adminNotificationEmails.forEach(adminEmail =>
          notifyAdminNewRegistration({ userName: regName, userEmail: regEmail, userCompany: regCompany, userRole: regRole, adminEmail })
        );
        if (auth.session) await cloudSignOut();
      } else {
        setUsers(prev => [...prev, { id: `user-${Date.now()}`, name: regName, email: regEmail, password: regPw, company: regCompany, role: regRole, status: "pending", isAdmin: false, registeredAt: new Date().toISOString() }]);
        users.filter(u => u.isAdmin).forEach(u =>
          notifyAdminNewRegistration({ userName: regName, userEmail: regEmail, userCompany: regCompany, userRole: regRole, adminEmail: u.email })
        );
      }
      setRegStep("submitted");
    } catch (err) {
      console.error("[Registration failed]", err);
      setOtpErr(err instanceof Error ? err.message : "Unable to create your account.");
    }
  }

  async function handleAccountStatusChange(user: UserAccount, status: "approved" | "rejected") {
    try {
      if (supabaseConfigured) await updateProfileStatus(user.id, status);
      setUsers(prev => prev.map(x => x.id === user.id ? { ...x, status } : x));
      showToast(`${user.name} ${status}.`, status === "approved" ? "success" : "info");

      if (status === "approved") {
        try {
          await notifyUserAccountApproved({
            userName: user.name,
            userEmail: user.email,
            approvedByName: currentUser?.name || "LMPT2 Administrator",
          });
        } catch (emailErr) {
          console.error("[Account approval notification failed]", emailErr);
          showToast("User approved, but the approval email could not be sent.", "info");
        }
      }
    } catch (err) {
      console.error("[Account status update failed]", err);
      showToast(err instanceof Error ? err.message : "Unable to update account status.", "error");
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotErr("");
    if (!forgotEmail.includes("@")) {
      setForgotErr("Enter a valid registered email address.");
      return;
    }
    if (!supabaseConfigured) {
      setForgotErr("Password recovery requires Supabase to be configured.");
      return;
    }
    setForgotLoading(true);
    try {
      const result = await requestPasswordResetNoEmail(forgotEmail.trim());
      setForgotRequestId(result.requestId);
      setForgotResetToken(result.resetToken);
      window.localStorage.setItem("lmpt2_password_reset", JSON.stringify({
        requestId: result.requestId,
        resetToken: result.resetToken,
        email: forgotEmail.trim(),
      }));
      setForgotStep("pending");
    } catch (err) {
      console.error("[Password reset request failed]", err);
      setForgotErr(err instanceof Error ? err.message : "Unable to create password reset request.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleCheckPasswordReset() {
    setForgotErr("");
    if (!forgotRequestId || !forgotResetToken) {
      setForgotErr("Password reset request not found. Start a new request.");
      setForgotStep("email");
      return;
    }
    setForgotLoading(true);
    try {
      const result = await checkPasswordResetStatus(forgotRequestId, forgotResetToken);
      if (result.status === "approved") {
        setForgotNewPw("");
        setForgotConfirmPw("");
        setForgotStep("password");
      } else if (result.status === "rejected") {
        setForgotErr("This password reset request was rejected by an administrator.");
      } else if (result.status === "completed") {
        window.localStorage.removeItem("lmpt2_password_reset");
        setForgotStep("done");
      } else {
        setForgotErr("Your reset request is still waiting for administrator approval.");
      }
    } catch (err) {
      console.error("[Password reset status failed]", err);
      setForgotErr(err instanceof Error ? err.message : "Unable to check password reset status.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotErr("");
    if (forgotNewPw.length < 8) {
      setForgotErr("Password must be at least 8 characters.");
      return;
    }
    if (forgotNewPw !== forgotConfirmPw) {
      setForgotErr("Passwords do not match.");
      return;
    }
    if (!forgotRequestId || !forgotResetToken) {
      setForgotErr("Password reset approval is missing. Start a new request.");
      return;
    }
    setForgotLoading(true);
    try {
      await completePasswordReset(forgotRequestId, forgotResetToken, forgotNewPw);
      window.localStorage.removeItem("lmpt2_password_reset");
      setForgotStep("done");
    } catch (err) {
      console.error("[Password update failed]", err);
      setForgotErr(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setForgotLoading(false);
    }
  }

  function resetForgot() {
    setForgotEmail("");
    setForgotStep("email");
    setForgotRequestId("");
    setForgotResetToken("");
    setForgotNewPw("");
    setForgotConfirmPw("");
    setForgotErr("");
    setForgotLoading(false);
    setShowForgotPw(false);
    window.localStorage.removeItem("lmpt2_password_reset");
  }

  function openForgotPassword() {
    setForgotErr("");
    if (forgotRequestId && forgotResetToken && forgotEmail) {
      setForgotStep("pending");
    } else {
      setForgotStep("email");
    }
    setPage("forgot");
  }

  async function loadPasswordResetRequests() {
    if (!supabaseConfigured || !currentUser?.isAdmin) return;
    setPasswordResetLoading(true);
    try {
      const rows = await fetchPasswordResetRequests();
      setPasswordResetRequests(rows);
    } catch (err) {
      console.error("[Password reset requests load failed]", err);
    } finally {
      setPasswordResetLoading(false);
    }
  }

  async function handlePasswordResetDecision(request: CloudPasswordResetRequest, status: "approved" | "rejected") {
    try {
      const updated = await updatePasswordResetRequestStatus(request.id, status);
      setPasswordResetRequests(prev => prev.map(x => x.id === updated.id ? updated : x));
      showToast(`Password reset ${status} for ${request.email}.`, status === "approved" ? "success" : "info");
    } catch (err) {
      console.error("[Password reset decision failed]", err);
      showToast(err instanceof Error ? err.message : "Unable to update password reset request.", "error");
    }
  }

  function resetReg() {
    setRegStep("form"); setRegName(""); setRegCompany(""); setRegEmail(""); setRegPw(""); setRegConfirm("");
    setRegRole("ship_officer"); setRegErr(""); setOtpInput(""); setOtpErr(""); setGeneratedOtp("");
  }

  async function handleLogout() {
    try {
      if (supabaseConfigured) await cloudSignOut();
    } catch (err) {
      console.warn("[Supabase sign out failed]", err);
    } finally {
      setCurrentUser(null); setLoginEmail(""); setLoginPw(""); setSearchQuery("");
      setSelectedVessel(null); setActiveStudy(null); setPage("login");
      if (supabaseConfigured) { setUsers([]); setVessels([]); setStudies([]); }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STUDY HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  function persistStudy(updated: SSCSStudy, immediate = false) {
    if (!supabaseConfigured || !currentUser) return;
    const existing = studySaveTimers.current[updated.id];
    if (existing) clearTimeout(existing);
    const write = () => saveCloudStudy(updated, currentUser.id).catch(err => {
      console.error("[Study save failed]", err);
      showToast("Cloud save failed. Your latest change is still visible locally.", "error");
    });
    if (immediate) void write();
    else studySaveTimers.current[updated.id] = setTimeout(write, 650);
  }

  function syncStudy(updated: SSCSStudy, immediate = false) {
    setActiveStudy(updated);
    setStudies(prev => prev.map(s => s.id === updated.id ? updated : s));
    persistStudy(updated, immediate);
  }

  function updateItem(itemId: string, field: keyof StudyItem, val: string) {
    if (!activeStudy) return;
    const updated: SSCSStudy = {
      ...activeStudy,
      items: activeStudy.items.map(i => i.id === itemId ? { ...i, [field]: val } : i),
    };
    // Ship Major Dimensions → Displacement is the source of truth for Berthing Energy.
    if (itemId === "gi-22" && field === "value") {
      updated.berthingEnergyData = {
        ...(activeStudy.berthingEnergyData ?? defaultBerthingEnergyData()),
        displacement: val,
      };
    }
    syncStudy(updated);
  }

  function updateStudyField(field: "shipNotes" | "terminalNotes", val: string) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, [field]: val });
  }

  function updateFlatBodyData(data: FlatBodyData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, flatBodyData: data });
  }

  function updateFenderReactionData(data: FenderReactionData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, fenderReactionData: data });
  }

  function updateBerthingEnergyData(data: BerthingEnergyData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, berthingEnergyData: data });
  }

  function updateMooringArrangementData(data: MooringArrangementData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, mooringArrangementData: data });
  }

  function updateGangwayData(data: GangwayData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, gangwayData: data });
  }

  function updateUnloadingArmData(data: UnloadingArmData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, unloadingArmData: data });
  }

  function updateCargoManagementData(data: CargoManagementData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, cargoManagementData: data });
  }

  function updateShipShoreLinkData(data: ShipShoreLinkData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, shipShoreLinkData: data });
  }

  function updateCTMSData(data: CTMSData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, ctmsData: data });
  }

  function updateSDPData(data: SDPData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, sdpData: data });
  }

  function updateUtilityData(data: UtilityData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, utilityData: data });
  }

  function updateRequiredDocuments(data: RequiredDocumentsData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, requiredDocuments: data }, supabaseConfigured);
  }

  function updateAttachmentData(data: AttachmentData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, attachmentData: data }, supabaseConfigured);
  }

  function updateQualityAssessmentData(data: QualityAssessmentData) {
    if (!activeStudy) return;
    syncStudy({ ...activeStudy, qualityAssessmentData: data });
  }

  async function handleDocumentUpload(docKey: string, file: File): Promise<UploadedFile> {
    if (!supabaseConfigured || !activeStudy || !currentUser) {
      throw new Error("Cloud document storage is not available in local-preview mode.");
    }
    // Ensure the parent study exists before Storage RLS evaluates the upload path.
    await saveCloudStudy(activeStudy, currentUser.id);
    return uploadStudyDocument({ studyId: activeStudy.id, docKey, file, userId: currentUser.id });
  }

  async function handleVesselPhotoUpload(file: File): Promise<UploadedFile> {
    return handleDocumentUpload("vessel_photo", file);
  }

  async function handleDocumentDelete(file: UploadedFile) {
    if (supabaseConfigured && file.storagePath) await deleteStudyDocument(file);
  }

  async function handleDocumentDownload(file: UploadedFile) {
    if (file.storagePath && supabaseConfigured) return getStudyDocumentUrl(file.storagePath);
    if (file.dataUrl) return file.dataUrl;
    throw new Error("Document source is unavailable.");
  }

  function openStudy(study: SSCSStudy) {
    const vessel = vessels.find(candidate => candidate.id === study.vesselId);
    setActiveStudy(withCanonicalVesselIdentity(study, vessel));
    setShipNameEditing(false);
    setShipNameDraft("");
    setPage("study");
  }

  async function handleRenameVessel() {
    if (!activeStudy || !currentUser) return;
    const vessel = vessels.find(v => v.id === activeStudy.vesselId);
    if (!vessel) return;

    const newName = shipNameDraft.trim();
    if (!newName) {
      showToast("Ship name is required.", "error");
      return;
    }
    if (newName === vessel.name) {
      setShipNameEditing(false);
      setShipNameDraft("");
      return;
    }

    setShipNameSaving(true);
    try {
      let updatedVessel: Vessel = { ...vessel, name: newName };
      if (supabaseConfigured) {
        updatedVessel = await renameVesselEverywhere(vessel.id, newName) as Vessel;
      }

      const renameStudy = (study: SSCSStudy): SSCSStudy => {
        if (study.vesselId !== vessel.id) return study;
        return {
          ...study,
          vesselName: newName,
          items: study.items.map(item => item.id === "gi-01" ? { ...item, value: newName } : item),
        };
      };

      setVessels(prev => prev.map(v => v.id === vessel.id ? updatedVessel : v));
      setStudies(prev => prev.map(renameStudy));
      setActiveStudy(prev => prev ? renameStudy(prev) : prev);
      setSelectedVessel(prev => prev?.id === vessel.id ? updatedVessel : prev);
      setShipNameEditing(false);
      setShipNameDraft("");
      showToast(`Ship name changed to ${newName}. All vessel-name fields were updated.`, "success");
    } catch (err) {
      console.error("[Vessel rename failed]", err);
      showToast(err instanceof Error ? err.message : "Unable to change ship name.", "error");
    } finally {
      setShipNameSaving(false);
    }
  }

  function initiateStudy(vessel: Vessel, fromExisting?: SSCSStudy) {
    if (!currentUser) return;
    const newStudy = blankStudy(vessel, currentUser, fromExisting);
    setStudies(prev => [...prev, newStudy]);
    setActiveStudy(newStudy);
    persistStudy(newStudy, true);
    setKickoffVessel(null);
    setPage("study");
    // If access_requested, notify all terminal officers
    if (newStudy.status === "access_requested") {
      users.filter(u => u.role === "terminal_officer" && u.status === "approved").forEach(u =>
        notifyTerminalOfficerAccessRequest({ vesselName: vessel.name, requesterName: currentUser.name, requesterEmail: currentUser.email, terminalEmail: u.email })
      );
    }
  }

  function approveAccess(study: SSCSStudy) {
    syncStudy({ ...study, status: "draft" }, true);
    showToast(`Access granted to ${study.initiatedByName}. Study is now open for data entry.`, "success");
    const shipUser = users.find(u => u.id === study.initiatedById);
    if (shipUser && currentUser)
      notifyShipOfficerAccessApproved({ vesselName: study.vesselName, approvedByName: currentUser.name, shipEmail: shipUser.email });
  }

  function rejectAccess(study: SSCSStudy) {
    syncStudy({ ...study, status: "access_rejected" }, true);
    showToast(`Access request from ${study.initiatedByName} rejected.`, "info");
    const shipUser = users.find(u => u.id === study.initiatedById);
    if (shipUser && currentUser)
      notifyShipOfficerAccessRejected({ vesselName: study.vesselName, rejectedByName: currentUser.name, shipEmail: shipUser.email });
  }

  async function handleAddVessel(e: React.FormEvent) {
    e.preventDefault();
    setAddVErr("");
    if (!addVName.trim()) return setAddVErr("Vessel name is required.");
    if (!addVImo.trim())  return setAddVErr("IMO number is required.");
    if (vessels.find(v => v.imo.toLowerCase() === addVImo.trim().toLowerCase()))
      return setAddVErr("A vessel with this IMO number already exists.");
    if (!currentUser) return;

    const referenceVessel = addVIsSister
      ? vessels.find(v => v.id === addVReferenceVesselId)
      : undefined;
    if (addVIsSister && !referenceVessel)
      return setAddVErr("Please select the reference vessel for this sister ship.");
    if (addVIsSister && referenceVessel && !getLatestApprovedStudy(studies, referenceVessel.id))
      return setAddVErr("The reference vessel must have an approved SSCS study before it can be used as a sister ship reference.");
    if (addVIsSister && !addVSisterStatement)
      return setAddVErr("Please attach the Sister Ship Statement.");

    let newVessel: Vessel = {
      id: Date.now(), name: addVName.trim(), type: addVType,
      capacity: addVCapacity.trim() || "—", flag: addVFlag.trim() || "—",
      year: parseInt(addVYear) || new Date().getFullYear(),
      imo: addVImo.trim(), status: addVStatus, createdById: currentUser.id,
      callSign: "—", portOfRegistry: "—",
      owner: "—", operator: "—", classification: "—",
      gasMgmt1: "—", gasMgmt2: "N/A",
      isSisterShip: addVIsSister,
      referenceVesselId: addVIsSister ? referenceVessel?.id : undefined,
      sisterShipStatus: addVIsSister ? "pending" : "none",
    };
    if (supabaseConfigured) {
      try {
        newVessel = await createCloudVessel(newVessel) as Vessel;
      } catch (err) {
        console.error("[Vessel create failed]", err);
        setAddVErr(err instanceof Error ? err.message : "Unable to save vessel to the cloud database.");
        return;
      }
    }

    let newStudy: SSCSStudy | null = null;
    let statementUploadFailed = false;
    if (currentUser.role === "ship_officer" || addVIsSister) {
      newStudy = blankStudy(newVessel, currentUser, undefined, "draft");
      if (supabaseConfigured) {
        try {
          await saveCloudStudy(newStudy, currentUser.id);
          if (addVIsSister && addVSisterStatement) {
            const statement = await uploadStudyDocument({
              studyId: newStudy.id,
              docKey: "d_6_1",
              file: addVSisterStatement,
              userId: currentUser.id,
            });
            newStudy = {
              ...newStudy,
              requiredDocuments: {
                ...(newStudy.requiredDocuments ?? defaultRequiredDocumentsData()),
                d_6_1: [statement],
              },
            };
            await saveCloudStudy(newStudy, currentUser.id);
          }
        } catch (err) {
          console.error("[Sister ship statement upload failed]", err);
          statementUploadFailed = true;
        }
      } else if (addVIsSister && addVSisterStatement) {
        const statement = await new Promise<UploadedFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: addVSisterStatement.name,
            size: addVSisterStatement.size,
            type: addVSisterStatement.type,
            uploadedAt: new Date().toISOString(),
            dataUrl: reader.result as string,
          });
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(addVSisterStatement);
        });
        newStudy = {
          ...newStudy,
          requiredDocuments: {
            ...(newStudy.requiredDocuments ?? defaultRequiredDocumentsData()),
            d_6_1: [statement],
          },
        };
      }
    }

    setVessels(prev => [...prev, newVessel]);
    if (newStudy) setStudies(prev => [...prev, newStudy!]);
    setShowAddVessel(false);
    resetAddVesselForm();
    setSelectedVessel(newVessel);

    if (currentUser.role === "ship_officer" && newStudy) {
      setActiveStudy(newStudy);
      showToast(
        statementUploadFailed
          ? `${newVessel.name} added, but the Sister Ship Statement upload failed. Please upload it again in Required Documents.`
          : addVIsSister
            ? `${newVessel.name} added as a sister ship. Waiting for Terminal Officer verification.`
            : `${newVessel.name} added. You are authorised to fill the SSCS study.`,
        statementUploadFailed ? "error" : "success",
      );
      setPage("study");
    } else {
      showToast(
        addVIsSister
          ? `${newVessel.name} added as a sister ship. Terminal Officer verification is required.`
          : `${newVessel.name} added to vessel database.`,
        statementUploadFailed ? "error" : "success",
      );
      setPage("vessel");
    }
  }

  async function verifySisterShip(vessel: Vessel) {
    if (!currentUser || currentUser.role !== "terminal_officer") return;
    const referenceVessel = vessel.referenceVesselId
      ? vessels.find(v => v.id === vessel.referenceVesselId)
      : undefined;
    const referenceStudy = referenceVessel
      ? getLatestApprovedStudy(studies, referenceVessel.id)
      : undefined;
    const targetStudy = getLatestStudy(studies, vessel.id);

    if (!referenceVessel || !referenceStudy) {
      showToast("The reference vessel does not have an approved SSCS study.", "error");
      return;
    }
    if (!targetStudy) {
      showToast("No SSCS study exists for this sister ship.", "error");
      return;
    }
    const statementFiles = targetStudy.requiredDocuments?.d_6_1 ?? [];
    if (statementFiles.length === 0) {
      showToast("Sister Ship Statement is required before verification.", "error");
      return;
    }

    const mergedStudy = mergeSisterReferenceStudy(targetStudy, referenceStudy);
    try {
      let updatedVessel: Vessel = {
        ...vessel,
        sisterShipStatus: "verified",
        sisterShipVerifiedById: currentUser.id,
        sisterShipVerifiedAt: new Date().toISOString(),
        sisterReferenceStudyId: referenceStudy.id,
      };
      if (supabaseConfigured) {
        updatedVessel = await updateSisterShipVerification({
          vesselId: vessel.id,
          status: "verified",
          referenceStudyId: referenceStudy.id,
          verifiedById: currentUser.id,
        }) as Vessel;
        await saveCloudStudy(mergedStudy, currentUser.id);
      }
      setVessels(prev => prev.map(v => v.id === vessel.id ? updatedVessel : v));
      setSelectedVessel(updatedVessel);
      setStudies(prev => prev.map(study => study.id === mergedStudy.id ? mergedStudy : study));
      if (activeStudy?.id === mergedStudy.id) setActiveStudy(mergedStudy);
      showToast(`Sister ship verified. Reference data copied from ${referenceVessel.name}.`, "success");
    } catch (err) {
      console.error("[Sister ship verification failed]", err);
      showToast(err instanceof Error ? err.message : "Unable to verify sister ship.", "error");
    }
  }

  async function rejectSisterShip(vessel: Vessel) {
    if (!currentUser || currentUser.role !== "terminal_officer") return;
    try {
      let updatedVessel: Vessel = { ...vessel, sisterShipStatus: "rejected", sisterReferenceStudyId: undefined };
      if (supabaseConfigured) {
        updatedVessel = await updateSisterShipVerification({ vesselId: vessel.id, status: "rejected" }) as Vessel;
      }
      setVessels(prev => prev.map(v => v.id === vessel.id ? updatedVessel : v));
      setSelectedVessel(updatedVessel);
      showToast("Sister ship reference rejected. Vessel-specific data must be completed normally.", "info");
    } catch (err) {
      console.error("[Sister ship rejection failed]", err);
      showToast(err instanceof Error ? err.message : "Unable to reject sister ship reference.", "error");
    }
  }

  function notifyTerminalOfficersOfEditRequest(study: SSCSStudy, requester: UserAccount) {
    users
      .filter(u => u.role === "terminal_officer" && u.status === "approved")
      .forEach(u => {
        void notifyTerminalOfficerEditRequested({
          vesselName: study.vesselName,
          requesterName: requester.name,
          requesterEmail: requester.email,
          terminalEmail: u.email,
        }).catch(err => console.error("[Edit request email failed]", err));
      });
  }

  function notifyShipOfficerOfEditApproval(study: SSCSStudy, approvedByName: string) {
    const shipUser = users.find(u => u.id === study.initiatedById);
    if (!shipUser) return;
    void notifyShipOfficerEditApproved({
      vesselName: study.vesselName,
      approvedByName,
      shipEmail: shipUser.email,
    }).catch(err => console.error("[Edit approval email failed]", err));
  }

  function notifyShipOfficerOfEditRejection(study: SSCSStudy, rejectedByName: string) {
    const shipUser = users.find(u => u.id === study.initiatedById);
    if (!shipUser) return;
    void notifyShipOfficerEditRejected({
      vesselName: study.vesselName,
      rejectedByName,
      shipEmail: shipUser.email,
    }).catch(err => console.error("[Edit rejection email failed]", err));
  }

  function submitStudy() {
    if (!activeStudy || !currentUser) return;
    const studyVessel = vessels.find(v => v.id === activeStudy.vesselId);
    if (studyVessel?.isSisterShip && studyVessel.sisterShipStatus === "pending") {
      showToast("Terminal Officer must verify the sister ship reference before submission.", "error");
      return;
    }
    const pct = completionPct(activeStudy);
    if (pct < 100) { showToast("Please complete all checklist items before submitting.", "error"); return; }

    const canonicalName = studyVessel?.name || activeStudy.vesselName;
    const submittedStudy: SSCSStudy = {
      ...activeStudy,
      vesselName: canonicalName,
      items: activeStudy.items.map(item =>
        item.id === "gi-01" ? { ...item, value: canonicalName }
        : item.id === "gi-02" && studyVessel ? { ...item, value: studyVessel.imo }
        : item
      ),
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };

    syncStudy(submittedStudy, true);
    // Reflect the submitted General Information on the main vessel list immediately.
    setVessels(prev => prev.map(v =>
      v.id === submittedStudy.vesselId ? vesselWithSubmittedGeneralInfo(v, submittedStudy) : v
    ));
    showToast("Study submitted to Terminal Officer for review.", "success");
    // Notify all terminal officers
    users.filter(u => u.role === "terminal_officer").forEach(u =>
      notifyTerminalOfficerStudySubmitted({ vesselName: submittedStudy.vesselName, submitterName: currentUser.name, terminalEmail: u.email })
    );
  }

  function approveStudy() {
    if (!activeStudy || !currentUser) return;
    syncStudy({ ...activeStudy, status: "approved", reviewedById: currentUser.id, reviewedByName: currentUser.name, approvedAt: new Date().toISOString() }, true);
    showToast("Study approved and locked.", "success");
    const shipUser = users.find(u => u.id === activeStudy.initiatedById);
    if (shipUser)
      notifyShipOfficerStudyApproved({ vesselName: activeStudy.vesselName, approvedByName: currentUser.name, shipEmail: shipUser.email });
  }

  function requestRevision() {
    if (!activeStudy || !currentUser) return;
    syncStudy({ ...activeStudy, status: "draft" }, true);
    const shipUser = users.find(u => u.id === activeStudy.initiatedById);
    if (shipUser) {
      void notifyShipOfficerRevisionRequested({
        vesselName: activeStudy.vesselName,
        requestedByName: currentUser.name,
        shipEmail: shipUser.email,
      }).catch(err => console.error("[Revision request email failed]", err));
    }
    showToast("Revision requested. Study returned to draft.", "info");
  }

  function requestEdit() {
    if (!activeStudy || !currentUser) return;
    syncStudy({ ...activeStudy, status: "edit_requested", editRequestedById: currentUser.id, editRequestedByName: currentUser.name, editRequestedAt: new Date().toISOString() }, true);
    notifyTerminalOfficersOfEditRequest(activeStudy, currentUser);
    showToast("Edit request sent to Terminal Officer.", "info");
  }

  function approveEditRequest() {
    if (!activeStudy || !currentUser) return;
    syncStudy({ ...activeStudy, status: "editing" }, true);
    notifyShipOfficerOfEditApproval(activeStudy, currentUser.name);
    showToast("Edit request approved. User may now edit.", "success");
  }

  function rejectEditRequest() {
    if (!activeStudy || !currentUser) return;
    syncStudy({ ...activeStudy, status: "approved", editRequestedById: undefined, editRequestedByName: undefined, editRequestedAt: undefined }, true);
    notifyShipOfficerOfEditRejection(activeStudy, currentUser.name);
    showToast("Edit request rejected. Study remains locked.", "info");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TASK LIST (computed once, used by all authenticated pages)
  // ─────────────────────────────────────────────────────────────────────────
  const myTasks: TaskItem[] = (() => {
    if (!currentUser) return [];
    const uid = currentUser.id;
    const role = currentUser.role;
    return studies.flatMap(s => {
      if (role === "terminal_officer") {
        if (s.status === "access_requested") return [{ study: s, label: "Access request — approve or reject", priority: "high" as const }];
        if (s.status === "submitted")        return [{ study: s, label: "Study submitted — review & approve", priority: "high" as const }];
        if (s.status === "edit_requested")   return [{ study: s, label: "Edit requested — approve or reject", priority: "normal" as const }];
      } else if (role === "ship_officer") {
        if (s.initiatedById === uid) {
          if (s.status === "draft")            return [{ study: s, label: "Draft incomplete — continue filling", priority: "normal" as const }];
          if (s.status === "access_requested") return [{ study: s, label: "Awaiting Terminal Officer access approval", priority: "normal" as const }];
          if (s.status === "editing")          return [{ study: s, label: "Edit approved — continue editing", priority: "high" as const }];
        }
      }
      return [];
    });
  })();

  function goToStudyFromTask(s: SSCSStudy) {
    const v = vessels.find(v => v.id === s.vesselId);
    if (v) setSelectedVessel(v);
    setActiveStudy(s);
    setShowTaskPanel(false);
    setPage("study");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN PAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (backendLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center" style={font}>
      <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
        <RefreshCw className="w-5 h-5 animate-spin text-primary" /> Connecting to Supabase…
      </div>
    </div>
  );

  if (page === "login") return (
    <div className="min-h-screen bg-background flex relative overflow-hidden" style={font}>
      <GridBg />
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1400&h=900&fit=crop&auto=format)" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1C42]/93 via-[#0F3D8C]/80 to-[#1558C8]/65" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-9 h-9 rounded bg-white/15 border border-white/30 flex items-center justify-center">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-blue-200/70 tracking-widest uppercase">Ship Shore Compatibility Study</p>
              <p className="font-mono text-sm font-bold text-white tracking-widest">LMPT2</p>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white leading-[1.1] mb-5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            LNG VESSEL<br /><span className="text-blue-300">COMPATIBILITY</span><br />PLATFORM
          </h1>
          <p className="text-blue-100/80 text-base leading-relaxed max-w-xs">Comprehensive ship-shore compatibility assessments for LNG carriers and terminal operators.</p>
        </div>
        <div className="relative z-10">
          {!supabaseConfigured && <p className="font-mono text-[10px] text-blue-200/70 uppercase tracking-widest mb-3">Local Demo Accounts</p>}
          <div className="grid grid-cols-2 gap-2">
            {(!supabaseConfigured ? [
              { role: "Terminal Officer", email: "terminal.demo@lmpt2.local", pw: "DemoTerminal1234", color: "border-sky-400/25 bg-sky-400/10"    },
              { role: "Ship Officer",     email: "ship.demo@lmpt2.local", pw: "DemoShip1234",    color: "border-violet-400/25 bg-violet-400/10" },
              { role: "Viewer",           email: "viewer.demo@lmpt2.local",     pw: "DemoViewer1234",  color: "border-white/15 bg-white/8"   },
              { role: "Admin",            email: "admin.demo@lmpt2.local",  pw: "DemoAdmin1234",   color: "border-blue-300/25 bg-blue-300/10"       },
            ] : []).map(a => (
              <button key={a.role} onClick={() => { setLoginEmail(a.email); setLoginPw(a.pw); }}
                className={`text-left p-2.5 rounded border transition-colors hover:brightness-125 ${a.color}`}>
                <p className="font-mono text-[10px] text-blue-200/70 uppercase tracking-wide">{a.role}</p>
                <p className="font-mono text-xs text-white/90 mt-0.5">{a.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <div className="mb-2 lg:hidden"><Logo /></div>
          <div className="mb-8 mt-6 lg:mt-0">
            <h2 className="font-mono text-xl font-bold text-foreground tracking-wide mb-1">SIGN IN</h2>
            <p className="text-sm text-muted-foreground">Access the vessel compatibility database.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {(loginErr || backendError) && (
              <div className="flex items-start gap-2.5 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{loginErr || backendError}</span>
              </div>
            )}
            <Field label="Email Address" value={loginEmail} onChange={setLoginEmail} type="email" placeholder="operator@terminal.lng" icon={Mail} />
            <Field label="Password" value={loginPw} onChange={setLoginPw} type={showLoginPw ? "text" : "password"} placeholder="••••••••" icon={Lock}
              trailing={<button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="text-muted-foreground hover:text-foreground transition-colors">{showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
            <div className="flex justify-end">
              <button type="button" onClick={openForgotPassword}
                className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">Forgot password?</button>
            </div>
            <button type="submit" disabled={loginLoading}
              className="w-full bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase py-2.5 rounded hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loginLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Authenticating…</> : <>Sign In<ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">No account?{" "}
              <button onClick={() => { resetReg(); setPage("register"); }} className="text-primary hover:text-primary/80 font-mono font-semibold transition-colors">Register Access</button>
            </p>
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // REGISTER PAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (page === "register") return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden" style={font}>
      <GridBg />
      <div className="w-full max-w-md relative z-10">
        <button onClick={() => setPage("login")} className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Sign In
        </button>
        <div className="mb-6"><Logo /></div>

        {/* Step bar */}
        <div className="flex items-center mb-8">
          {[{ n: 1, label: "Details", done: regStep !== "form" }, { n: 2, label: "Verify", done: regStep === "submitted" }, { n: 3, label: "Done", done: false }].map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${s.done ? "bg-primary text-primary-foreground" : (i === ["form","otp","submitted"].indexOf(regStep)) ? "bg-primary/20 text-primary border-2 border-primary" : "bg-secondary text-muted-foreground border border-border"}`}>
                  {s.done ? <CheckCheck className="w-3.5 h-3.5" /> : s.n}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider mt-1 text-muted-foreground">{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-2 mb-4 ${s.done ? "bg-primary/50" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {regStep === "form" && (
          <>
            <div className="mb-6">
              <h2 className="font-mono text-xl font-bold text-foreground tracking-wide mb-1">REQUEST ACCESS</h2>
              <p className="text-sm text-muted-foreground">Fill in your details. An OTP will be sent to verify your email.</p>
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              {regErr && <div className="flex items-start gap-2.5 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{regErr}</span></div>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name"     value={regName}    onChange={setRegName}    placeholder="J. Ramirez"     icon={User} />
                <Field label="Company Name"  value={regCompany} onChange={setRegCompany} placeholder="Pacific LNG Co." icon={Building2} />
              </div>
              <Field label="Work Email" value={regEmail} onChange={setRegEmail} type="email" placeholder="you@company.com" icon={Mail} />
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Role Requested</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["terminal_officer", "ship_officer", "viewer"] as Role[]).map(r => (
                    <button key={r} type="button" onClick={() => setRegRole(r)}
                      className={`p-3 rounded border text-left transition-all ${regRole === r ? `border-current ${ROLE_META[r].color}` : "border-border hover:border-border/80 text-muted-foreground"}`}>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wide">{ROLE_META[r].label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Password" value={regPw} onChange={setRegPw} type={showRegPw ? "text" : "password"} placeholder="Min. 8 characters" icon={Lock}
                trailing={<button type="button" onClick={() => setShowRegPw(!showRegPw)} className="text-muted-foreground hover:text-foreground transition-colors">{showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
              <Field label="Confirm Password" value={regConfirm} onChange={setRegConfirm} type="password" placeholder="Repeat password" icon={Lock} />
              <button type="submit" disabled={otpSending}
                className="w-full bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase py-2.5 rounded hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {otpSending ? <><RefreshCw className="w-4 h-4 animate-spin" />Sending OTP…</> : <><Send className="w-4 h-4" />Send OTP to Email</>}
              </button>
            </form>
          </>
        )}

        {regStep === "otp" && (
          <>
            <div className="mb-6">
              <h2 className="font-mono text-xl font-bold text-foreground tracking-wide mb-1">VERIFY EMAIL</h2>
              <p className="text-sm text-muted-foreground">OTP sent to <span className="text-foreground font-mono">{regEmail}</span>. Enter the 6-digit code.</p>
            </div>
            {otpErr && <div className="flex items-start gap-2.5 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{otpErr}</span></div>}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">6-Digit OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="_ _ _ _ _ _" maxLength={6}
                    className="w-full bg-secondary border border-border rounded pl-10 pr-4 py-3 text-center text-2xl font-mono text-foreground tracking-[0.5em] placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase py-2.5 rounded hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />Verify & Submit Request
              </button>
              <button type="button" onClick={() => { setRegStep("form"); setOtpInput(""); setOtpErr(""); }}
                className="w-full text-xs font-mono text-muted-foreground hover:text-foreground transition-colors py-1.5">← Change email or resend OTP</button>
            </form>
          </>
        )}

        {regStep === "submitted" && (
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-mono text-xl font-bold text-foreground tracking-wide mb-2">REQUEST SUBMITTED</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">Email verified. Your <span className={`font-semibold ${ROLE_META[regRole].color.split(" ")[0]}`}>{ROLE_META[regRole].label}</span> account is pending admin approval.</p>
            </div>
            <div className="w-full p-4 rounded border border-border bg-secondary text-left space-y-2">
              {[{ l: "Name", v: regName }, { l: "Company", v: regCompany }, { l: "Email", v: regEmail }, { l: "Role", v: ROLE_META[regRole].label }].map(r => (
                <div key={r.l} className="flex justify-between"><span className="text-xs text-muted-foreground">{r.l}</span><span className="text-xs font-mono text-foreground">{r.v}</span></div>
              ))}
            </div>
            <button onClick={() => { resetReg(); setPage("login"); }} className="text-xs font-mono text-primary hover:text-primary/80 transition-colors border border-primary/30 hover:border-primary/60 px-4 py-2 rounded">Return to Sign In →</button>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD — ADMIN-APPROVED, NO EMAIL/SMTP
  // ─────────────────────────────────────────────────────────────────────────
  if (page === "forgot") return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden" style={font}>
      <GridBg />
      <div className="w-full max-w-sm relative z-10">
        <button onClick={() => { setForgotErr(""); setPage("login"); }} className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-8"><ArrowLeft className="w-3.5 h-3.5" />Back to Sign In</button>
        <div className="mb-8"><Logo /></div>

        {forgotStep === "email" && (
          <>
            <div className="mb-8"><h2 className="font-mono text-xl font-bold text-foreground tracking-wide mb-1">RESET PASSWORD</h2><p className="text-sm text-muted-foreground">Enter your registered email. An administrator must approve the reset request before you can choose a new password.</p></div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotErr && <div className="flex items-start gap-2.5 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{forgotErr}</span></div>}
              <Field label="Registered Email" value={forgotEmail} onChange={setForgotEmail} type="email" placeholder="you@company.com" icon={Mail} />
              <button type="submit" disabled={forgotLoading} className="w-full bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase py-2.5 rounded hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {forgotLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Submitting…</> : <>Request Password Reset<ChevronRight className="w-4 h-4" /></>}
              </button>
            </form>
          </>
        )}

        {forgotStep === "pending" && (
          <div className="p-5 rounded border border-amber-500/30 bg-amber-500/5 flex flex-col items-center gap-3 text-center">
            <Clock className="w-10 h-10 text-amber-400" />
            <div><p className="font-mono font-semibold text-foreground text-sm">Waiting for Administrator Approval</p><p className="text-xs text-muted-foreground mt-1">Reset request for <span className="font-mono text-foreground">{forgotEmail}</span> has been submitted. No email will be sent.</p></div>
            {forgotErr && <div className="w-full p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs">{forgotErr}</div>}
            <button type="button" onClick={() => void handleCheckPasswordReset()} disabled={forgotLoading} className="w-full bg-primary text-primary-foreground font-mono font-semibold text-xs tracking-widest uppercase py-2.5 rounded hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {forgotLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Checking…</> : <>Check Approval Status<RefreshCw className="w-4 h-4" /></>}
            </button>
            <button onClick={() => { resetForgot(); }} className="text-xs font-mono text-primary hover:text-primary/80 mt-1">Start another request →</button>
          </div>
        )}

        {forgotStep === "password" && (
          <>
            <div className="mb-8"><h2 className="font-mono text-xl font-bold text-foreground tracking-wide mb-1">SET NEW PASSWORD</h2><p className="text-sm text-muted-foreground">Your reset request was approved. Choose a new password for <span className="font-mono text-foreground">{forgotEmail}</span>.</p></div>
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              {forgotErr && <div className="flex items-start gap-2.5 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{forgotErr}</span></div>}
              <Field label="New Password" value={forgotNewPw} onChange={setForgotNewPw} type={showForgotPw ? "text" : "password"} placeholder="Minimum 8 characters" icon={Lock}
                trailing={<button type="button" onClick={() => setShowForgotPw(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">{showForgotPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
              <Field label="Confirm New Password" value={forgotConfirmPw} onChange={setForgotConfirmPw} type={showForgotPw ? "text" : "password"} placeholder="Repeat new password" icon={Lock} />
              <button type="submit" disabled={forgotLoading} className="w-full bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase py-2.5 rounded hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {forgotLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Updating…</> : <>Update Password<CheckCircle2 className="w-4 h-4" /></>}
              </button>
            </form>
          </>
        )}

        {forgotStep === "done" && (
          <div className="p-5 rounded border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <div><p className="font-mono font-semibold text-foreground text-sm">Password Updated</p><p className="text-xs text-muted-foreground mt-1">Your new password is ready to use.</p></div>
            <button onClick={() => { resetForgot(); setPage("login"); }} className="text-xs font-mono text-primary hover:text-primary/80 mt-2">Return to Sign In →</button>
          </div>
        )}
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );

  if (!currentUser) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN PAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (page === "admin" && currentUser.isAdmin) {
    const nonAdmins = users.filter(u => !u.isAdmin);
    const tabUsers = adminTab === "all" ? nonAdmins : nonAdmins.filter(u => u.status === adminTab);
    const tabs: { key: AdminTab; label: string; n: number }[] = [
      { key: "pending",  label: "Pending",  n: nonAdmins.filter(u => u.status === "pending").length  },
      { key: "approved", label: "Approved", n: nonAdmins.filter(u => u.status === "approved").length },
      { key: "rejected", label: "Rejected", n: nonAdmins.filter(u => u.status === "rejected").length },
      { key: "all",      label: "All",      n: nonAdmins.length },
    ];
    const pendingPasswordResets = passwordResetRequests.filter(r => r.status === "pending");
    return (
      <div className="min-h-screen bg-background" style={font}>
        <NavBar user={currentUser} pendingCount={pendingCount} onAdmin={() => setPage("admin")} onHome={() => setPage("home")} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-5 h-5 text-primary" /><h1 className="font-mono text-xl font-bold text-foreground tracking-wide">ADMIN PANEL</h1></div>
              <p className="text-sm text-muted-foreground">Review and manage user access requests.</p>
            </div>
            <button onClick={() => setPage("home")} className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border hover:bg-secondary px-3 py-2 rounded shrink-0">
              <Ship className="w-3.5 h-3.5" />Vessel Database
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[{ label: "Total", n: nonAdmins.length, icon: Users, c: "text-foreground" }, { label: "Pending", n: nonAdmins.filter(u => u.status === "pending").length, icon: Clock, c: "text-amber-400" }, { label: "Approved", n: nonAdmins.filter(u => u.status === "approved").length, icon: CheckCircle2, c: "text-emerald-400" }, { label: "Rejected", n: nonAdmins.filter(u => u.status === "rejected").length, icon: XCircle, c: "text-red-400" }].map(({ label, n, icon: Icon, c }) => (
              <div key={label} className="border border-border rounded bg-card p-4"><div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${c}`} /><span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{label}</span></div><p className={`font-mono text-2xl font-bold ${c}`}>{n}</p></div>
            ))}
          </div>
          <div className="border border-border rounded bg-card mb-8 overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 py-4 bg-secondary/50 border-b border-border">
              <div>
                <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /><p className="font-mono text-sm font-semibold text-foreground">PASSWORD RESET REQUESTS</p></div>
                <p className="text-xs text-muted-foreground mt-1">No email is sent. Confirm the user's identity outside the website before approving.</p>
              </div>
              <button type="button" onClick={() => void loadPasswordResetRequests()} disabled={passwordResetLoading} className="flex items-center gap-1.5 px-3 py-2 rounded border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-60">
                <RefreshCw className={`w-3.5 h-3.5 ${passwordResetLoading ? "animate-spin" : ""}`} />Refresh
              </button>
            </div>
            {pendingPasswordResets.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No pending password reset requests.</div>
            ) : (
              <div>
                {pendingPasswordResets.map((request, i) => {
                  const account = users.find(u => u.id === request.userId || u.email.toLowerCase() === request.email.toLowerCase());
                  return (
                    <div key={request.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 ${i < pendingPasswordResets.length - 1 ? "border-b border-border/50" : ""}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{account?.name || request.email}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{request.email}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Requested {new Date(request.requestedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => void handlePasswordResetDecision(request, "approved")} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"><ShieldCheck className="w-3 h-3" />Approve Reset</button>
                        <button type="button" onClick={() => void handlePasswordResetDecision(request, "rejected")} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"><ShieldX className="w-3 h-3" />Reject</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-1 mb-4 border-b border-border">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setAdminTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-all border-b-2 -mb-px ${adminTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}<span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${adminTab === t.key ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{t.n}</span>
              </button>
            ))}
          </div>
          {tabUsers.length === 0
            ? <div className="border border-border rounded bg-card flex flex-col items-center gap-3 py-16 text-center"><Users className="w-10 h-10 text-border" /><p className="text-muted-foreground text-sm">No users in this category.</p></div>
            : <div className="border border-border rounded overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-secondary border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  <span>User</span><span className="hidden md:block">Company</span><span className="hidden sm:block">Role</span><span>Status</span><span>Actions</span>
                </div>
                {tabUsers.map((u, i) => (
                  <div key={u.id} className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center ${i < tabUsers.length - 1 ? "border-b border-border/50" : ""}`}>
                    <div><p className="text-sm text-foreground font-medium truncate">{u.name}</p><p className="font-mono text-[10px] text-muted-foreground">{u.email}</p></div>
                    <p className="hidden md:block text-xs text-muted-foreground">{u.company}</p>
                    <div className="hidden sm:block">{u.role ? <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${ROLE_META[u.role].color}`}>{ROLE_META[u.role].label}</span> : "—"}</div>
                    <AcctBadge status={u.status} />
                    <div className="flex items-center gap-2">
                      {u.status !== "approved" && <button onClick={() => void handleAccountStatusChange(u, "approved")} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"><ShieldCheck className="w-3 h-3" />Approve</button>}
                      {u.status !== "rejected" && <button onClick={() => void handleAccountStatusChange(u, "rejected")} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"><ShieldX className="w-3 h-3" />Reject</button>}
                    </div>
                  </div>
                ))}
              </div>}
        </div>
        <TaskFloater tasks={myTasks} open={showTaskPanel} onToggle={() => setShowTaskPanel(p => !p)} onSelect={goToStudyFromTask} />
        {toast && <Toast {...toast} />}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HOME PAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (page === "home") {
    const showDrop = searchFocused && searchResults.length > 0;
    const display  = searchQuery.trim() ? searchResults : vessels;
    const canAddVessel = currentUser?.role === "terminal_officer" || currentUser?.role === "ship_officer";
    return (
      <div className="min-h-screen bg-background" style={font}>
        <NavBar user={currentUser} pendingCount={pendingCount} onAdmin={() => setPage("admin")} onHome={() => setPage("home")} onLogout={handleLogout} />
        <div className="relative overflow-hidden" style={{ minHeight: 260 }}>
          {/* LNG terminal aerial hero photo */}
          <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }} />
          {/* Navy gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,28,66,0.88) 0%, rgba(15,61,140,0.72) 50%, rgba(21,88,200,0.55) 100%)" }} />
          {/* Bottom fade into page background */}
          <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: "linear-gradient(to bottom, transparent, #F4F8FC)" }} />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-14">
            <p className="font-mono text-xs text-blue-200 uppercase tracking-widest mb-2 opacity-80">Vessel Database</p>
            <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              SHIP SHORE COMPATIBILITY STUDY
            </h2>
            <p className="font-mono text-lg font-bold text-blue-200 mb-7 tracking-widest drop-shadow">LMPT2 — LNG TERMINAL</p>
            <div ref={searchRef} className="relative max-w-xl">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)}
                  placeholder="Search vessel name, IMO number, type or flag…"
                  className="w-full bg-white/95 border border-white/30 rounded-lg shadow-xl pl-11 pr-10 py-3.5 text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-sm" />
                {searchQuery && <button onClick={() => { setSearchQuery(""); setSearchFocused(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
              {showDrop && (
                <div className="absolute top-full mt-1.5 left-0 right-0 bg-card border border-border rounded shadow-2xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border"><p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{searchResults.length} vessel{searchResults.length !== 1 ? "s" : ""} found</p></div>
                  {searchResults.map((v, i) => (
                    <button key={v.id} onClick={() => { setSelectedVessel(v); setSearchFocused(false); setPage("vessel"); }}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors text-left group ${i < searchResults.length - 1 ? "border-b border-border/50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <Ship className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <div><p className="text-sm text-foreground font-medium">{v.name}</p><p className="font-mono text-[10px] text-muted-foreground">{v.type} · {v.flag}</p></div>
                      </div>
                      <div className="flex items-center gap-3"><VesselBadge status={v.status} /><ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" /></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{searchQuery.trim() ? `Results for "${searchQuery}"` : "All Vessels"}</p>
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs text-muted-foreground">{display.length} vessel{display.length !== 1 ? "s" : ""}</p>
              {canAddVessel && (
                <button onClick={() => setShowAddVessel(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/40 bg-primary/8 text-primary hover:bg-primary/15 font-mono font-semibold text-xs uppercase tracking-wide transition-colors">
                  <Plus className="w-3.5 h-3.5" />Add Vessel
                </button>
              )}
            </div>
          </div>
          {display.length === 0
            ? <div className="border border-border rounded bg-card flex flex-col items-center gap-4 py-16 text-center">
                <Ship className="w-10 h-10 text-border" />
                <div>
                  <p className="text-muted-foreground text-sm">{searchQuery.trim() ? `No vessels matched "${searchQuery}"` : "No vessels in the database yet."}</p>
                  {searchQuery.trim() && <button onClick={() => setSearchQuery("")} className="text-xs font-mono text-primary hover:text-primary/80 mt-1">Clear search</button>}
                </div>
                {canAddVessel && !searchQuery.trim() && (
                  <button onClick={() => setShowAddVessel(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase px-5 py-2.5 rounded hover:bg-primary/90 active:scale-[0.98] transition-all">
                    <Plus className="w-4 h-4" />Add Vessel
                  </button>
                )}
              </div>
            : <div className="border border-border rounded overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 bg-secondary border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  <span>Vessel Name</span><span className="hidden md:block">Type</span><span className="hidden sm:block">Capacity</span><span className="hidden lg:block">Flag / Year</span><span>Status</span><span>SSCS</span>
                </div>
                {display.map((v, i) => {
                  const study = getLatestStudy(studies, v.id);
                  const mainVessel = vesselWithSubmittedGeneralInfo(v, study);
                  const invalidCertificateCount = study
                    ? getInvalidCertificateCount(study.qualityAssessmentData)
                    : 0;
                  const expiringCertificateCount = study?.status === "approved"
                    ? getExpiringCertificateCount(study.qualityAssessmentData, 90)
                    : 0;
                  return (
                    <div key={v.id}
                      className={`w-full grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-secondary/60 transition-colors group ${i < display.length - 1 ? "border-b border-border/50" : ""}`}>
                      <button className="flex items-center gap-3 min-w-0 text-left" onClick={() => { setSelectedVessel(mainVessel); setPage("vessel"); }}>
                        <div className="w-7 h-7 rounded bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                          <Ship className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground font-medium truncate group-hover:text-primary transition-colors">{mainVessel.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-[10px] text-muted-foreground">{mainVessel.imo}</p>
                            {study && <StudyBadge status={study.status} />}
                            {v.isSisterShip && <SisterShipBadge status={v.sisterShipStatus ?? "pending"} />}
                            {invalidCertificateCount > 0 && (
                              <CertificateInvalidBadge count={invalidCertificateCount} />
                            )}
                            {expiringCertificateCount > 0 && (
                              <CertificateExpiringBadge count={expiringCertificateCount} />
                            )}
                          </div>
                        </div>
                      </button>
                      <span className="hidden md:block font-mono text-xs text-muted-foreground whitespace-nowrap">{mainVessel.type}</span>
                      <span className="hidden sm:block font-mono text-xs text-foreground whitespace-nowrap">{mainVessel.capacity}</span>
                      <span className="hidden lg:block text-xs text-muted-foreground whitespace-nowrap">{mainVessel.flag} · {mainVessel.year}</span>
                      <VesselBadge status={v.status} />
                      <button
                        title="SSCS Summary"
                        onClick={() => setSummaryVesselId(v.id)}
                        className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all shrink-0">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>}
          {searchQuery.trim() && searchResults.length === 0 && <p className="text-center text-xs text-muted-foreground mt-4 font-mono">No vessels matched — try a different term</p>}
        </div>

        {/* SSCS Summary Modal */}
        {summaryVesselId !== null && (() => {
          const sv = vessels.find(v => v.id === summaryVesselId);
          const ss = getLatestStudy(studies, summaryVesselId);
          if (!sv) return null;

          const gi = (id: string) => ss?.items.find(i => i.id === id)?.value ?? "";
          const vesselPhotos = ss?.attachmentData?.vesselPhotos ?? [];
          const showSubmittedPhotos = !!ss && !["access_requested", "access_rejected", "draft"].includes(ss.status);

          // Linked values from General Info
          const ballastDraftVal  = gi("gi-20");
          const loadedDraftVal   = gi("gi-21");
          const upperDeckVal     = gi("gi-18");
          const manifoldHVal     = gi("gi-19");

          const pn = (s: string) => { const n = parseFloat(s); return isNaN(n) ? NaN : n; };

          // Mooring pattern
          const mp = ss?.mooringArrangementData?.pattern;
          const fwdNums = mp ? [mp.fwd1, mp.fwd2, mp.fwd3, mp.fwd4].filter(Boolean) : [];
          const aftNums = mp ? [mp.aft1, mp.aft2, mp.aft3, mp.aft4].filter(Boolean) : [];
          const patternStr = fwdNums.length || aftNums.length
            ? `FWD ${fwdNums.join("+")} / AFT ${aftNums.join("+")}`
            : "—";

          // Rope types
          const ropeT  = ss?.mooringArrangementData?.mooringRope?.type || "";
          const tailT  = ss?.mooringArrangementData?.tailRope?.type    || "";
          const ropeStr = ropeT || tailT ? [ropeT, tailT].filter(Boolean).join(" / ") : "—";

          // Gangway landing area
          const gwd = ss?.gangwayData;
          const gwLen = pn(gwd?.b ?? "") - pn(gwd?.a ?? "");
          const gwWid = pn(gwd?.d ?? "") - pn(gwd?.c ?? "");
          const gwHasVals = !!(gwd?.a && gwd?.b && gwd?.c && gwd?.d);
          const gangwayAreaResult: "ok" | "fail" | null = gwHasVals
            ? (!isNaN(gwLen) && !isNaN(gwWid) && gwLen > 2.45 && gwWid > 0.60 ? "ok" : "fail")
            : null;

          // Gangway working range
          const ud = pn(upperDeckVal), bd = pn(ballastDraftVal), ld = pn(loadedDraftVal);
          const gwUp = isNaN(ud) || isNaN(bd) ? NaN : 22.7 - ud + bd - 3.5;
          const gwLo = isNaN(ud) || isNaN(ld) ? NaN : ud - ld - 12.1;
          const gangwayRangeResult: "ok" | "fail" | null = !isNaN(gwUp) && !isNaN(gwLo)
            ? (gwUp > 0 && gwLo > 0 ? "ok" : "fail") : null;

          // Unloading arm working range
          const mh = pn(manifoldHVal);
          const uaUp = isNaN(mh) || isNaN(bd) ? NaN : 27.5 - mh + bd - 3.5;
          const uaLo = isNaN(mh) || isNaN(ld) ? NaN : mh - ld - 17.5;
          const uaRangeResult: "ok" | "fail" | null = !isNaN(uaUp) && !isNaN(uaLo)
            ? (uaUp > 0 && uaLo > 0 ? "ok" : "fail") : null;

          // CTMS
          const ctms = ss?.ctmsData;
          const ctmsFail: string[] = [];
          if (ctms) {
            const plN = pn(ctms.primaryLevel.accuracy);
            if (!ctms.primaryLevel.accuracy || isNaN(plN) || plN > 7.5) ctmsFail.push("Primary Level Sensor");
            const slN = pn(ctms.secondaryLevel.accuracy);
            if (!ctms.secondaryLevel.accuracy || isNaN(slN) || slN > 7.5) ctmsFail.push("Secondary Level Sensor");
            const t1 = pn(ctms.temperature.accuracyRange1), t2 = pn(ctms.temperature.accuracyRange2);
            if (!ctms.temperature.accuracyRange1 || !ctms.temperature.accuracyRange2 || isNaN(t1) || isNaN(t2) || t1 > 0.2 || t2 > 1.5) ctmsFail.push("Temperature Sensor");
            const pN = pn(ctms.pressure.accuracy);
            if (!ctms.pressure.accuracy || isNaN(pN) || pN > 1) ctmsFail.push("Pressure Sensor");
          }
          const ctmsHasData = !!(ctms && (ctms.primaryLevel.accuracy || ctms.secondaryLevel.accuracy || ctms.temperature.accuracyRange1 || ctms.pressure.accuracy));
          const ctmsResult: "ok" | "fail" | null = ctmsHasData ? (ctmsFail.length === 0 ? "ok" : "fail") : null;
          const ctmsLabel = ctmsResult === "ok" ? "All Acceptable"
            : ctmsResult === "fail" ? `All Acceptable, except ${ctmsFail.join(", ")}`
            : "—";

          // SDPs
          const sdp = ss?.sdpData;
          const sdpCheck = (val: string, min: number | null, max: number | null) => {
            if (!val) return false;
            const n = pn(val);
            if (isNaN(n)) return false;
            if (min !== null && n < min) return false;
            if (max !== null && n > max) return false;
            return true;
          };
          const sdpHasData = !!(sdp && (sdp.outsideDiameter || sdp.flangeThickness || sdp.raisedFace || sdp.insideDiameter || sdp.surfaceFinishMax));
          const sdpAllOk = sdpHasData && sdp && [
            sdpCheck(sdp.outsideDiameter, 595, 598.5),
            sdpCheck(sdp.flangeThickness, 36.6, 41),
            sdpCheck(sdp.raisedFace, 460, 470),
            sdpCheck(sdp.insideDiameter, null, 387),
            sdpCheck(sdp.surfaceFinishMax, 3.2, 12.5),
            sdpCheck(sdp.surfaceFinishMin, 3.2, 12.5),
          ].every(Boolean);
          const sdpResult: "ok" | "fail" | null = sdpHasData ? (sdpAllOk ? "ok" : "fail") : null;

          function ResultBadge({ r, label }: { r: "ok" | "fail" | null; label?: string }) {
            if (r === null) return <span className="font-mono text-xs text-muted-foreground/50">—</span>;
            if (r === "ok") return <span className="font-mono text-xs font-bold text-emerald-400">{label ?? "Acceptable"}</span>;
            return <span className="font-mono text-xs font-bold text-red-400">{label ?? "Unacceptable"}</span>;
          }

          const rows: { label: string; node: React.ReactNode }[] = [
            { label: "Ship's Name",                node: <span className="font-mono text-xs text-foreground font-semibold">{sv.name}</span> },
            { label: "1st Gas Management System",  node: <span className="font-mono text-xs text-foreground">{sv.gasMgmt1 || "—"}</span> },
            { label: "2nd Gas Management System",  node: <span className="font-mono text-xs text-foreground">{sv.gasMgmt2 || "—"}</span> },
            { label: "Ballast Draft",              node: <span className="font-mono text-xs text-foreground">{ballastDraftVal ? `${ballastDraftVal} m.` : "—"}</span> },
            { label: "Loaded Draft",               node: <span className="font-mono text-xs text-foreground">{loadedDraftVal ? `${loadedDraftVal} m.` : "—"}</span> },
            { label: "Sunken Bitts",               node: <span className="font-mono text-xs text-muted-foreground italic">To be calculated</span> },
            { label: "Mooring Pattern",            node: <span className="font-mono text-xs text-foreground">{patternStr}</span> },
            { label: "Mooring / Tail Rope",        node: <span className="font-mono text-xs text-foreground">{ropeStr}</span> },
            { label: "Gangway Area",               node: <ResultBadge r={gangwayAreaResult} /> },
            { label: "Gangway Working Range",      node: <ResultBadge r={gangwayRangeResult} /> },
            { label: "Unloading Arm Working Range", node: <ResultBadge r={uaRangeResult} /> },
            { label: "CTMS",                       node: <ResultBadge r={ctmsResult} label={ctmsLabel} /> },
            { label: "SDPs",                       node: <ResultBadge r={sdpResult} /> },
          ];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              onClick={() => setSummaryVesselId(null)}>
              <div className="w-full max-w-lg bg-card border border-border rounded shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Modal header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-secondary/30">
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">SSCS Summary</p>
                    <p className="font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {sv.name.toUpperCase()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {ss ? <StudyBadge status={ss.status} /> : <span className="font-mono text-[10px] text-muted-foreground">No study yet</span>}
                    </div>
                  </div>
                  <button onClick={() => setSummaryVesselId(null)} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {showSubmittedPhotos && vesselPhotos.length > 0 && (
                  <VesselPhotoSummary
                    files={vesselPhotos}
                    getFileUrl={supabaseConfigured ? handleDocumentDownload : undefined}
                  />
                )}

                {/* Rows */}
                <div className="divide-y divide-border/50 max-h-[70vh] overflow-y-auto">
                  {rows.map(({ label, node }) => (
                    <div key={label} className="flex items-start justify-between gap-4 px-5 py-2.5">
                      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap shrink-0">{label}</span>
                      <span className="text-right">{node}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border bg-secondary/20 flex items-center justify-between">
                  <p className="font-mono text-[10px] text-muted-foreground">{sv.imo} · {sv.type}</p>
                  {ss && (
                    <button onClick={() => { setSummaryVesselId(null); setSelectedVessel(sv); openStudy(ss); }}
                      className="font-mono text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                      Open Study <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Add Vessel Modal */}
        {showAddVessel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  <h2 className="font-mono text-sm font-bold text-foreground uppercase tracking-wide">Add New Vessel</h2>
                </div>
                <button onClick={() => { setShowAddVessel(false); resetAddVesselForm(); }} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleAddVessel} className="p-6 space-y-4">
                {addVErr && (
                  <div className="flex items-start gap-2.5 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{addVErr}
                  </div>
                )}
                {currentUser?.role === "ship_officer" && (
                  <div className="flex items-start gap-2.5 p-3 rounded bg-sky-500/8 border border-sky-500/20 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-400" />
                    <span>As Ship Officer, you will be automatically authorised as the SSCS operator for this vessel.</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Vessel Name *</label>
                    <div className="relative"><Ship className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input value={addVName} onChange={e => setAddVName(e.target.value)} placeholder="e.g. Pacific Explorer" className="w-full bg-secondary border border-border rounded pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Vessel Type</label>
                    <select value={addVType} onChange={e => setAddVType(e.target.value)} className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60">
                      {["LNG Carrier", "Q-Flex LNG Carrier", "Q-Max LNG Carrier", "FSRU", "LNGC"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Status</label>
                    <select value={addVStatus} onChange={e => setAddVStatus(e.target.value as "Active" | "In Refit")} className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60">
                      <option>Active</option><option>In Refit</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">IMO Number *</label>
                    <input value={addVImo} onChange={e => setAddVImo(e.target.value)} placeholder="IMO 9XXXXXXX" className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Year Built</label>
                    <input type="number" value={addVYear} onChange={e => setAddVYear(e.target.value)} min="1950" max={new Date().getFullYear()} className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Capacity (m³)</label>
                    <input value={addVCapacity} onChange={e => setAddVCapacity(e.target.value)} placeholder="e.g. 155,000 m³" className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Flag State</label>
                    <input value={addVFlag} onChange={e => setAddVFlag(e.target.value)} placeholder="e.g. Marshall Islands" className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60" />
                  </div>
                </div>

                <div className="border border-border rounded bg-secondary/20 p-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addVIsSister}
                      onChange={e => {
                        setAddVIsSister(e.target.checked);
                        if (!e.target.checked) {
                          setAddVReferenceSearch("");
                          setAddVReferenceVesselId(null);
                          setAddVSisterStatement(null);
                        }
                      }}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="font-mono text-xs font-bold text-foreground uppercase tracking-widest">Sister Ship</span>
                  </label>

                  {addVIsSister && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-start gap-2 p-2.5 rounded border border-amber-500/20 bg-amber-500/5">
                        <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-muted-foreground">Select an existing vessel with an approved SSCS study. Terminal Officer must verify the sister-ship relationship before reference data is locked and reused.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Refer to vessel *</label>
                        {addVReferenceVesselId ? (
                          <div className="flex items-center gap-2 rounded border border-sky-500/30 bg-sky-500/5 px-3 py-2.5">
                            <Ship className="w-3.5 h-3.5 text-sky-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono text-foreground truncate">{vessels.find(v => v.id === addVReferenceVesselId)?.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{vessels.find(v => v.id === addVReferenceVesselId)?.imo}</p>
                            </div>
                            <button type="button" onClick={() => { setAddVReferenceVesselId(null); setAddVReferenceSearch(""); }} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <input
                                value={addVReferenceSearch}
                                onChange={e => setAddVReferenceSearch(e.target.value)}
                                placeholder="Search vessel name / IMO / call sign"
                                className="w-full bg-secondary border border-border rounded pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto border border-border rounded divide-y divide-border">
                              {addVReferenceCandidates.length > 0 ? addVReferenceCandidates.map(candidate => (
                                <button
                                  type="button"
                                  key={candidate.id}
                                  onClick={() => { setAddVReferenceVesselId(candidate.id); setAddVReferenceSearch(candidate.name); }}
                                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-secondary transition-colors"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-mono text-foreground truncate">{candidate.name}</p>
                                    <p className="text-[10px] font-mono text-muted-foreground">{candidate.imo}</p>
                                  </div>
                                  <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 shrink-0">Approved SSCS</span>
                                </button>
                              )) : (
                                <p className="px-3 py-3 text-[11px] font-mono text-muted-foreground">No approved reference vessel found.</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Sister Ship Statement *</label>
                        <label className="flex items-center gap-2 border border-dashed border-border hover:border-primary/50 rounded px-3 py-2.5 cursor-pointer transition-colors">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="flex-1 text-[11px] font-mono text-muted-foreground truncate">{addVSisterStatement?.name || "Attach Sister Ship Statement"}</span>
                          <span className="text-[10px] font-mono text-primary">Browse</span>
                          <input type="file" className="hidden" onChange={e => setAddVSisterStatement(e.target.files?.[0] ?? null)} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase py-2.5 rounded hover:bg-primary/90 active:scale-[0.98] transition-all">
                    <Plus className="w-4 h-4" />Add Vessel
                  </button>
                  <button type="button" onClick={() => { setShowAddVessel(false); resetAddVesselForm(); }} className="px-5 py-2.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary font-mono text-sm transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <TaskFloater tasks={myTasks} open={showTaskPanel} onToggle={() => setShowTaskPanel(p => !p)} onSelect={goToStudyFromTask} />
        {toast && <Toast {...toast} />}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VESSEL DETAIL PAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (page === "vessel" && selectedVessel) {
    const v       = selectedVessel;
    const study   = getLatestStudy(studies, v.id);
    const role    = currentUser.role;
    const isTerminal = role === "terminal_officer";
    const isShip     = role === "ship_officer";

    const expiredItems = study?.status === "approved"
      ? study.items.filter(i => i.requiresExpiry && isExpired(i.expiryDate)) : [];
    const vesselInactive = v.status === "In Refit";
    const canKickoff = isShip && study?.status === "approved" && (vesselInactive || expiredItems.length > 0);
    const canInitiate = (isTerminal || isShip) && !study;
    const sisterReferenceVessel = v.referenceVesselId ? vessels.find(candidate => candidate.id === v.referenceVesselId) : undefined;
    const sisterReferenceStudy = v.sisterReferenceStudyId
      ? studies.find(candidate => candidate.id === v.sisterReferenceStudyId)
      : sisterReferenceVessel ? getLatestApprovedStudy(studies, sisterReferenceVessel.id) : undefined;

    // Vessel Detail should reflect the information entered in the latest SSCS study.
    // Fall back to the vessel master record only when a General Information field is blank.
    const studyValue = (itemId: string) =>
      study?.items.find(item => item.id === itemId)?.value?.trim() ?? "";
    const detailName           = v.name;
    const detailImo            = v.imo;
    const detailCallSign       = studyValue("gi-03") || v.callSign || "—";
    const detailFlag           = studyValue("gi-04") || v.flag || "—";
    const detailPort           = studyValue("gi-05") || v.portOfRegistry || "—";
    const detailYear           = studyValue("gi-06") || (v.year ? String(v.year) : "—");
    const detailOwner          = studyValue("gi-07") || v.owner || "—";
    const detailOperator       = studyValue("gi-08") || v.operator || "—";
    const detailContainment    = studyValue("gi-09") || v.type || "—";
    const detailCapacityRaw    = studyValue("gi-10");
    const detailCapacity       = detailCapacityRaw
      ? `${detailCapacityRaw}${/m³|m3/i.test(detailCapacityRaw) ? "" : " m³"}`
      : (v.capacity || "—");
    const detailClassification = studyValue("gi-11") || v.classification || "—";
    const detailGas1           = studyValue("gi-12") || v.gasMgmt1 || "";
    const detailGas2           = studyValue("gi-13") || v.gasMgmt2 || "";
    const detailGasManagement  = [detailGas1, detailGas2]
      .filter(value => value && value !== "N/A")
      .join(" / ") || "—";

    return (
      <div className="min-h-screen bg-background" style={font}>
        <NavBar user={currentUser} pendingCount={pendingCount} onAdmin={() => setPage("admin")} onHome={() => setPage("home")} onLogout={handleLogout} />
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button onClick={() => setPage("home")} className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-6"><ArrowLeft className="w-3.5 h-3.5" />Back to Vessel List</button>

          {/* Vessel header */}
          <div className="border border-border rounded bg-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1"><Ship className="w-5 h-5 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{detailName.toUpperCase()}</h1>
                </div>
                <p className="font-mono text-xs text-muted-foreground mb-3">{detailImo}</p>
                <div className="flex items-center gap-2 flex-wrap"><VesselBadge status={v.status} /><span className="font-mono text-xs text-muted-foreground">{detailContainment}</span></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-right shrink-0">
                {[
                  { l: "Capacity",         v2: detailCapacity },
                  { l: "Year Built",       v2: detailYear },
                  { l: "IMO",              v2: detailImo },
                  { l: "Call Sign",        v2: detailCallSign },
                  { l: "Flag State",       v2: detailFlag },
                  { l: "Port of Registry", v2: detailPort },
                ].map(({ l, v2 }) => (
                  <div key={l}><p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{l}</p><p className="font-mono text-xs text-foreground">{v2}</p></div>
                ))}
              </div>
            </div>
            {(detailOwner !== "—" || detailOperator !== "—" || detailClassification !== "—" || detailGasManagement !== "—") && (
              <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { l: "Owner",               v2: detailOwner },
                  { l: "Operator",            v2: detailOperator },
                  { l: "Classification",      v2: detailClassification },
                  { l: "Gas Management",      v2: detailGasManagement },
                ].map(({ l, v2 }) => (
                  <div key={l}><p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{l}</p><p className="font-mono text-xs text-foreground">{v2}</p></div>
                ))}
              </div>
            )}
          </div>

          {v.isSisterShip && (
            <div className={`border rounded p-5 mb-6 ${
              v.sisterShipStatus === "verified" ? "border-emerald-500/30 bg-emerald-500/5"
              : v.sisterShipStatus === "rejected" ? "border-red-500/30 bg-red-500/5"
              : "border-amber-500/30 bg-amber-500/5"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className={`w-4 h-4 ${v.sisterShipStatus === "verified" ? "text-emerald-400" : v.sisterShipStatus === "rejected" ? "text-red-400" : "text-amber-400"}`} />
                    <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">Sister Ship Reference</p>
                    <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                      v.sisterShipStatus === "verified" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : v.sisterShipStatus === "rejected" ? "text-red-400 border-red-500/30 bg-red-500/10"
                      : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    }`}>{v.sisterShipStatus ?? "pending"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Refer to <span className="font-mono text-foreground">{sisterReferenceVessel?.name ?? "—"}</span>
                    {sisterReferenceVessel?.imo ? ` · ${sisterReferenceVessel.imo}` : ""}
                  </p>
                  {v.sisterShipStatus === "verified" && sisterReferenceStudy && (
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">Reference SSCS: {sisterReferenceStudy.id}</p>
                  )}
                  {v.sisterShipStatus === "pending" && !sisterReferenceStudy && (
                    <p className="text-[11px] text-red-400 mt-2">The reference vessel has no approved SSCS study and cannot be verified yet.</p>
                  )}
                </div>
                {isTerminal && v.sisterShipStatus === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => verifySisterShip(v)}
                      disabled={!sisterReferenceStudy}
                      className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />Verify Sister Ship
                    </button>
                    <button
                      onClick={() => rejectSisterShip(v)}
                      className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors"
                    >
                      <ShieldX className="w-3.5 h-3.5" />Reject
                    </button>
                  </div>
                )}
              </div>
              {v.sisterShipStatus === "verified" && (
                <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-emerald-500/15">
                  Ship Major Dimensions, Fender / Flat Body, Mooring Arrangement, Gangway, Unloading Arm, Cargo Management, Ship Shore Link System and Utility System are inherited from the verified reference study. Required Documents 2.1–2.5, 3.x and 4.x are referenced from the same study; 2.6 remains vessel-specific.
                </p>
              )}
            </div>
          )}

          {/* SSCS Study section */}
          <div className="border border-border rounded bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h2 className="font-mono text-sm font-bold text-foreground uppercase tracking-wide">SSCS Study</h2>
              {study && <StudyBadge status={study.status} />}
            </div>

            {/* ── No study yet ─────────────────────────────────────────── */}
            {!study && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <FilePlus className="w-10 h-10 text-border" />
                <div>
                  <p className="text-sm text-muted-foreground">No compatibility study exists for this vessel.</p>
                  {role === "viewer" && <p className="text-xs text-muted-foreground/60 mt-1">Viewers cannot initiate studies.</p>}
                </div>
                {isTerminal && (
                  <button onClick={() => initiateStudy(v)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase px-5 py-2.5 rounded hover:bg-primary/90 active:scale-[0.98] transition-all">
                    <FilePlus className="w-4 h-4" />Initiate SSCS Study
                  </button>
                )}
                {isShip && (
                  <button onClick={() => initiateStudy(v)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground font-mono font-semibold text-sm tracking-widest uppercase px-5 py-2.5 rounded hover:bg-primary/90 active:scale-[0.98] transition-all">
                    <Send className="w-4 h-4" />Request SSCS Study Access
                  </button>
                )}
              </div>
            )}

            {/* ── ACCESS REQUESTED ──────────────────────────────────────── */}
            {study?.status === "access_requested" && (
              <div className="space-y-4">
                {isTerminal && (
                  <div className="p-5 rounded border border-yellow-500/30 bg-yellow-500/5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <p className="font-mono text-xs font-bold text-yellow-400 uppercase tracking-wide">Pending Access Request</p>
                    </div>
                    <p className="text-sm text-muted-foreground">A Ship Officer is requesting permission to work on this vessel. Verify this is an authorised operator before granting access.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { l: "Requested by", v2: study.initiatedByName },
                        { l: "Company",      v2: users.find(u => u.id === study.initiatedById)?.company ?? "—" },
                        { l: "Submitted",    v2: fmtDate(study.initiatedAt) },
                      ].map(({ l, v2 }) => (
                        <div key={l} className="bg-secondary/70 rounded p-3">
                          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{l}</p>
                          <p className="text-xs text-foreground font-mono">{v2}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => approveAccess(study)}
                        className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 font-mono font-semibold text-xs uppercase px-4 py-2.5 rounded transition-colors">
                        <ShieldCheck className="w-3.5 h-3.5" />Grant Access
                      </button>
                      <button onClick={() => rejectAccess(study)}
                        className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 font-mono font-semibold text-xs uppercase px-4 py-2.5 rounded transition-colors">
                        <ShieldX className="w-3.5 h-3.5" />Reject Request
                      </button>
                    </div>
                  </div>
                )}
                {isShip && study.initiatedById === currentUser.id && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold text-foreground">Access Request Pending</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">Your request is awaiting Terminal Officer approval. You will be notified once access is granted.</p>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">Submitted {fmtDate(study.initiatedAt)}</p>
                  </div>
                )}
                {isShip && study.initiatedById !== currentUser.id && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <Clock className="w-8 h-8 text-border" />
                    <p className="text-sm text-muted-foreground">An access request from another operator is under Terminal Officer review.</p>
                  </div>
                )}
                {role === "viewer" && (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <Clock className="w-8 h-8 text-border" />
                    <p className="text-sm text-muted-foreground">An access request is pending Terminal Officer review.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ACCESS REJECTED ───────────────────────────────────────── */}
            {study?.status === "access_rejected" && (
              <div className="space-y-4">
                <div className="p-4 rounded border border-red-500/25 bg-red-500/5 flex items-start gap-3">
                  <ShieldX className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-mono text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Access Request Rejected</p>
                    <p className="text-xs text-muted-foreground">The Terminal Officer rejected the access request submitted by <span className="font-mono text-foreground">{study.initiatedByName}</span>.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isTerminal && (
                    <button onClick={() => initiateStudy(v)}
                      className="flex items-center gap-2 bg-primary text-primary-foreground font-mono font-semibold text-xs tracking-widest uppercase px-4 py-2 rounded hover:bg-primary/90 transition-all">
                      <FilePlus className="w-3.5 h-3.5" />Initiate Study Directly
                    </button>
                  )}
                  {isShip && (
                    <button onClick={() => initiateStudy(v)}
                      className="flex items-center gap-2 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary font-mono font-semibold text-xs uppercase px-4 py-2 rounded transition-colors">
                      <Send className="w-3.5 h-3.5" />Re-submit Access Request
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── KICKOFF PANEL (ship officer, existing approved study) ──── */}
            {study && !["access_requested","access_rejected"].includes(study.status) && kickoffVessel?.id === v.id && (
              <div className="mb-5 p-4 rounded border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /><p className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wide">SSCS Kickoff — Access Request</p></div>
                <p className="text-sm text-muted-foreground">Submitting a kickoff request for Terminal Officer approval. Valid items will be pre-filled once access is granted.</p>
                <ul className="space-y-1.5">
                  {vesselInactive && <li className="flex items-center gap-2 text-xs text-amber-300"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Vessel is <span className="font-mono font-semibold">In Refit (Inactive)</span></li>}
                  {expiredItems.map(ei => (
                    <li key={ei.id} className="flex items-center gap-2 text-xs text-amber-300"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" /><span className="font-mono font-semibold">{ei.name}</span> — expired {fmtDate(ei.expiryDate + "T00:00:00Z")}</li>
                  ))}
                </ul>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => initiateStudy(v, study)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground font-mono font-semibold text-xs tracking-widest uppercase px-4 py-2 rounded hover:bg-primary/90 transition-all">
                    <Send className="w-3.5 h-3.5" />Submit Kickoff Request
                  </button>
                  <button onClick={() => setKickoffVessel(null)} className="text-xs font-mono text-muted-foreground hover:text-foreground px-4 py-2 rounded border border-border hover:bg-secondary">Cancel</button>
                </div>
              </div>
            )}

            {/* ── ACTIVE STUDY SUMMARY ──────────────────────────────────── */}
            {study && !["access_requested","access_rejected"].includes(study.status) && !kickoffVessel && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { l: "Study ID",     v2: study.id.slice(0, 16) },
                    { l: "Initiated by", v2: study.initiatedByName },
                    { l: "Initiated",    v2: fmtDate(study.initiatedAt) },
                    { l: "Approved by",  v2: study.reviewedByName ?? "—" },
                  ].map(({ l, v2 }) => (
                    <div key={l} className="bg-secondary rounded p-3">
                      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{l}</p>
                      <p className="text-xs text-foreground font-mono truncate">{v2}</p>
                    </div>
                  ))}
                </div>

                {study.status === "approved" && expiredItems.length > 0 && (
                  <div className="flex items-start gap-2.5 p-3 rounded bg-amber-500/8 border border-amber-500/25">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div><p className="text-amber-400 font-mono text-xs font-semibold uppercase tracking-wide mb-1">{expiredItems.length} checklist item{expiredItems.length > 1 ? "s" : ""} expired</p>
                      <p className="text-muted-foreground text-xs">{expiredItems.map(i => i.name).join(", ")}</p></div>
                  </div>
                )}

                {study.status === "edit_requested" && (
                  <div className="flex items-start gap-2.5 p-3 rounded bg-orange-500/8 border border-orange-500/25">
                    <Edit3 className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <div><p className="text-orange-400 font-mono text-xs font-semibold uppercase tracking-wide mb-1">Edit Request Pending</p>
                      <p className="text-muted-foreground text-xs"><span className="font-mono text-foreground">{study.editRequestedByName}</span> requested to edit on {fmtDate(study.editRequestedAt! + "")}.</p></div>
                  </div>
                )}

                {/* Cross-company notice for other Ship Officers */}
                {isShip && study.initiatedById !== currentUser.id && (
                  <div className="flex items-start gap-2 p-3 rounded bg-secondary border border-border text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-400" />
                    <span>This study was authorised for <span className="font-mono text-foreground">{study.initiatedByName}</span>. Only the authorised Ship Officer and Terminal Officer can modify this study.</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Always: view study */}
                  <button onClick={() => openStudy(study)}
                    className="flex items-center gap-2 px-4 py-2 rounded border border-border hover:bg-secondary text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                    <ClipboardList className="w-3.5 h-3.5" />View Study
                  </button>


                  {/* Terminal Officer: open a pre-filled email draft; nothing is sent automatically. */}
                  {isTerminal && study.status === "approved" && (
                    <button onClick={() => openApprovalEmailDraft(v, study)}
                      className="flex items-center gap-2 px-4 py-2 rounded border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 text-xs font-mono text-sky-400 transition-colors">
                      <Mail className="w-3.5 h-3.5" />Send an Approval
                    </button>
                  )}

                  {/* Terminal: review submitted */}
                  {isTerminal && study.status === "submitted" && (
                    <button onClick={() => openStudy(study)}
                      className="flex items-center gap-2 bg-primary text-primary-foreground font-mono font-semibold text-xs tracking-widest uppercase px-4 py-2 rounded hover:bg-primary/90 transition-all">
                      <BadgeCheck className="w-3.5 h-3.5" />Review & Approve
                    </button>
                  )}

                  {/* Terminal: approve/reject edit request */}
                  {isTerminal && study.status === "edit_requested" && (
                    <>
                      <button onClick={() => { syncStudy({ ...study, status: "editing" }); notifyShipOfficerOfEditApproval(study, currentUser.name); showToast("Edit request approved.", "success"); }}
                        className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono font-semibold text-xs uppercase px-4 py-2 rounded transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" />Approve Edit
                      </button>
                      <button onClick={() => { syncStudy({ ...study, status: "approved", editRequestedById: undefined, editRequestedByName: undefined, editRequestedAt: undefined }); notifyShipOfficerOfEditRejection(study, currentUser.name); showToast("Edit request rejected.", "info"); }}
                        className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-mono font-semibold text-xs uppercase px-4 py-2 rounded transition-colors">
                        <XCircle className="w-3.5 h-3.5" />Reject Edit
                      </button>
                    </>
                  )}

                  {/* Authorised Ship Officer: continue or request edit */}
                  {isShip && study.initiatedById === currentUser.id && (study.status === "draft" || (study.status === "editing" && study.editRequestedById === currentUser.id)) && (
                    <button onClick={() => openStudy(study)}
                      className="flex items-center gap-2 bg-primary text-primary-foreground font-mono font-semibold text-xs tracking-widest uppercase px-4 py-2 rounded hover:bg-primary/90 transition-all">
                      <Pencil className="w-3.5 h-3.5" />{study.status === "draft" ? "Continue Filling" : "Continue Editing"}
                    </button>
                  )}
                  {isShip && study.initiatedById === currentUser.id && study.status === "approved" && !study.editRequestedById && !canKickoff && (
                    <button onClick={() => { syncStudy({ ...study, status: "edit_requested", editRequestedById: currentUser.id, editRequestedByName: currentUser.name, editRequestedAt: new Date().toISOString() }); notifyTerminalOfficersOfEditRequest(study, currentUser); showToast("Edit request sent to Terminal Officer.", "info"); }}
                      className="flex items-center gap-2 px-4 py-2 rounded border border-orange-500/30 bg-orange-500/8 text-orange-400 hover:bg-orange-500/15 text-xs font-mono font-semibold uppercase transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />Request to Edit
                    </button>
                  )}

                  {/* Authorised Ship Officer: kickoff when expired/inactive */}
                  {canKickoff && study.initiatedById === currentUser.id && !kickoffVessel && (
                    <button onClick={() => setKickoffVessel(v)}
                      className="flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-mono font-semibold text-xs uppercase px-4 py-2 rounded transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />Request SSCS Kickoff
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <TaskFloater tasks={myTasks} open={showTaskPanel} onToggle={() => setShowTaskPanel(p => !p)} onSelect={goToStudyFromTask} />
        {toast && <Toast {...toast} />}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STUDY PAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (page === "study" && activeStudy) {
    const role       = currentUser.role;
    const isTerminal = role === "terminal_officer";
    const isShip     = role === "ship_officer";
    const st         = activeStudy.status;
    const uid        = currentUser.id;

    const canEdit =
      (st === "draft"    && (isTerminal || uid === activeStudy.initiatedById)) ||
      (st === "submitted" && isTerminal) ||
      (st === "approved"  && isTerminal) ||
      (st === "editing"   && (isTerminal || uid === activeStudy.editRequestedById));

    const showTerminalFields = isTerminal && (st === "submitted" || st === "approved" || st === "editing");
    const pct = completionPct(activeStudy);

    const vessel = vessels.find(v => v.id === activeStudy.vesselId);
    const canRenameShip = Boolean(vessel && (isTerminal || currentUser.isAdmin || vessel.createdById === uid));
    const verifiedSisterShip = Boolean(vessel?.isSisterShip && vessel.sisterShipStatus === "verified");
    const referenceVessel = vessel?.referenceVesselId ? vessels.find(candidate => candidate.id === vessel.referenceVesselId) : undefined;
    const inheritedSectionReadOnly = (section: string) => verifiedSisterShip && [
      "Fender / Flat Body",
      "Mooring Arrangement",
      "Gangway",
      "Unloading Arm",
      "Cargo Management",
      "Ship Shore Link System",
      "Utility System",
    ].includes(section);

    return (
      <div className="min-h-screen bg-background" style={font}>
        <NavBar user={currentUser} pendingCount={pendingCount} onAdmin={() => setPage("admin")} onHome={() => setPage("home")} onLogout={handleLogout} />

        <div className="max-w-4xl mx-auto px-6 py-8">
          <button onClick={() => { if (vessel) setSelectedVessel(vessel); setPage("vessel"); }}
            className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />Back to {activeStudy.vesselName}
          </button>

          {/* Study header */}
          <div className="border border-border rounded bg-card p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">SSCS Study · {activeStudy.id.slice(0, 20)}</p>
                <h1 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{activeStudy.vesselName.toUpperCase()}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <StudyBadge status={st} />
                  {vessel && <VesselBadge status={vessel.status} />}
                </div>
              </div>
              {canEdit && st !== "approved" && (
                <div className="text-right">
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Completion</p>
                  <p className={`font-mono text-2xl font-bold ${pct === 100 ? "text-emerald-400" : "text-primary"}`}>{pct}%</p>
                  <div className="w-32 h-1.5 rounded-full bg-secondary mt-1.5 overflow-hidden ml-auto">
                    <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-400" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-border">
              {[
                { l: "Initiated by",  v: activeStudy.initiatedByName },
                { l: "Initiated",     v: fmtDate(activeStudy.initiatedAt) },
                { l: "Submitted",     v: activeStudy.submittedAt ? fmtDate(activeStudy.submittedAt) : "—" },
                { l: "Approved by",   v: activeStudy.reviewedByName ?? "—" },
              ].map(({ l, v }) => (
                <div key={l}><p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{l}</p><p className="text-xs font-mono text-foreground">{v}</p></div>
              ))}
            </div>
          </div>

          {verifiedSisterShip && referenceVessel && (
            <div className="mb-4 flex items-start gap-2.5 rounded border border-sky-500/25 bg-sky-500/5 px-4 py-3">
              <Info className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-sky-400 font-bold">Verified Sister Ship · Refer to {referenceVessel.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Reference sections are read-only in this study. Vessel-specific information, Required Document 2.6, CTMS, SDPs, Attachment and Quality Assessment remain local to this vessel.</p>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="border border-border rounded bg-card px-5 py-3.5 mb-6 flex flex-wrap gap-2 items-center">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mr-2">Actions:</p>

            {/* Ship Officer: submit */}
            {(isShip || (isTerminal && (st === "draft"))) && (st === "draft" || st === "editing") && (
              <button onClick={submitStudy}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground font-mono font-semibold text-xs tracking-widest uppercase px-3.5 py-2 rounded hover:bg-primary/90 transition-all">
                <Send className="w-3.5 h-3.5" />Submit for Review
              </button>
            )}

            {/* Terminal Officer: approve */}
            {isTerminal && st === "submitted" && (
              <button onClick={approveStudy}
                className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors">
                <BadgeCheck className="w-3.5 h-3.5" />Approve Study
              </button>
            )}

            {/* Terminal Officer: request revision */}
            {isTerminal && st === "submitted" && (
              <button onClick={requestRevision}
                className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />Request Revision
              </button>
            )}

            {/* Terminal Officer: approved — save edits */}
            {isTerminal && st === "approved" && (
              <button onClick={() => showToast("Changes saved by Terminal Officer.", "success")}
                className="flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />Save Changes
              </button>
            )}

            {/* Ship Officer: request to edit */}
            {isShip && st === "approved" && !activeStudy.editRequestedById && (
              <button onClick={requestEdit}
                className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors">
                <Edit3 className="w-3.5 h-3.5" />Request to Edit
              </button>
            )}

            {/* Terminal Officer: approve/reject edit request */}
            {isTerminal && st === "edit_requested" && (
              <>
                <button onClick={approveEditRequest}
                  className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" />Approve Edit
                </button>
                <button onClick={rejectEditRequest}
                  className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors">
                  <XCircle className="w-3.5 h-3.5" />Reject Edit
                </button>
              </>
            )}

            {/* Save Draft — always visible when editing */}
            {canEdit && (st === "draft" || st === "editing") && (
              <button onClick={() => {
                showToast("Draft saved. You can continue later.", "success");
                if (vessel) setSelectedVessel(vessel);
                setPage("vessel");
              }} className="flex items-center gap-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary font-mono font-semibold text-xs uppercase px-3.5 py-2 rounded transition-colors ml-auto">
                <CheckCheck className="w-3.5 h-3.5" />Save Draft
              </button>
            )}

            {/* Status messages */}
            {isShip && st === "submitted" && <p className="text-xs font-mono text-muted-foreground">Awaiting Terminal Officer review.</p>}
            {isShip && st === "edit_requested" && uid === activeStudy.editRequestedById && <p className="text-xs font-mono text-amber-400">Edit request pending approval.</p>}
            {role === "viewer" && <p className="text-xs font-mono text-muted-foreground">You have read-only access to this study.</p>}
          </div>

          {/* Checklist — tab navigation */}
          <div className="mb-2 overflow-x-auto">
            <div className="flex gap-1 min-w-max border border-border rounded bg-card p-1">
              {CHECKLIST_TEMPLATE.map((tab, idx) => {
                const isFenderTab      = tab.section === "Fender / Flat Body";
                const isMooringTab     = tab.section === "Mooring Arrangement";
                const isGangwayTab     = tab.section === "Gangway";
                const isUnloadingTab   = tab.section === "Unloading Arm";
                const isCargoMgmtTab   = tab.section === "Cargo Management";
                const isSSLTab         = tab.section === "Ship Shore Link System";
                const isCTMSTab        = tab.section === "CTMS";
                const isSDPTab         = tab.section === "Short Distance Pieces (SDPs)";
                const isUtilityTab     = tab.section === "Utility System";
                const isReqDocsTab     = tab.section === "Required Documents";
                const isAttachmentTab  = tab.section === "Attachment";
                const isQualityTab     = tab.section === "Quality Assessment";
                const tabItems = activeStudy.items.filter(i => i.section === tab.section);
                const filledCount = tabItems.filter(i => i.value && (!i.requiresDoc || i.documentName) && (!i.requiresExpiry || i.expiryDate)).length;
                const isActive = studyTab === tab.section;

                const isComplete = isReqDocsTab
                  ? isRequiredDocumentsComplete(activeStudy.requiredDocuments, Boolean(vessel?.isSisterShip))
                  : isAttachmentTab
                  ? isAttachmentComplete(activeStudy.attachmentData)
                  : isQualityTab
                  ? isQualityAssessmentComplete(activeStudy.qualityAssessmentData)
                  : isFenderTab
                  ? isFenderFlatBodyComplete(activeStudy.flatBodyData, activeStudy.fenderReactionData)
                  : isMooringTab
                  ? isMooringComplete(activeStudy.mooringArrangementData)
                  : isGangwayTab
                  ? isGangwayComplete(activeStudy.gangwayData)
                  : isUnloadingTab
                  ? isUnloadingArmComplete(activeStudy.unloadingArmData)
                  : isCargoMgmtTab
                  ? isCargoManagementComplete(activeStudy.cargoManagementData)
                  : isSSLTab
                  ? isShipShoreLinkComplete(activeStudy.shipShoreLinkData)
                  : isCTMSTab
                  ? isCTMSComplete(activeStudy.ctmsData)
                  : isSDPTab
                  ? isSDPComplete(activeStudy.sdpData)
                  : isUtilityTab
                  ? isUtilityComplete(activeStudy.utilityData)
                  : tabItems.length > 0 && filledCount === tabItems.length;

                const hasContent = isReqDocsTab || isAttachmentTab || isQualityTab || isFenderTab || isMooringTab || isGangwayTab || isUnloadingTab || isCargoMgmtTab || isSSLTab || isCTMSTab || isSDPTab || isUtilityTab || tabItems.length > 0;

                return (
                  <button key={tab.section} onClick={() => setStudyTab(tab.section)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                      isActive ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}>
                    <span className="font-mono text-[10px] opacity-50">{isReqDocsTab ? "0" : idx}.</span>
                    {tab.section}
                    {hasContent && (
                      isComplete ? (
                        <span className={`ml-1 w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center ${isActive ? "bg-emerald-400/30 text-emerald-200" : "bg-emerald-500/20 text-emerald-400"}`}>✓</span>
                      ) : (
                        <span className={`ml-1 w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center ${isActive ? "bg-yellow-400/30 text-yellow-200" : "bg-yellow-400/20 text-yellow-500"}`}>!</span>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active tab content */}
          {(() => {
            const activeSection = CHECKLIST_TEMPLATE.find(t => t.section === studyTab);

            // Required Documents — custom section
            if (studyTab === "Required Documents") {
              return (
                <RequiredDocumentsSection
                  canEdit={canEdit}
                  data={activeStudy.requiredDocuments ?? defaultRequiredDocumentsData()}
                  onChange={updateRequiredDocuments}
                  onUploadFile={supabaseConfigured ? handleDocumentUpload : undefined}
                  onDeleteFile={supabaseConfigured ? handleDocumentDelete : undefined}
                  getDownloadUrl={supabaseConfigured ? handleDocumentDownload : undefined}
                  sisterShip={Boolean(vessel?.isSisterShip)}
                  sisterShipVerified={verifiedSisterShip}
                  referenceVesselName={referenceVessel?.name}
                  inheritedKeys={verifiedSisterShip ? SISTER_BORROWED_DOC_KEYS : []}
                />
              );
            }

            // Attachment — vessel photo upload
            if (studyTab === "Attachment") {
              return (
                <AttachmentsSection
                  canEdit={canEdit}
                  data={activeStudy.attachmentData ?? defaultAttachmentData()}
                  onChange={updateAttachmentData}
                  onUploadFile={supabaseConfigured ? handleVesselPhotoUpload : undefined}
                  onDeleteFile={supabaseConfigured ? handleDocumentDelete : undefined}
                  getFileUrl={supabaseConfigured ? handleDocumentDownload : undefined}
                />
              );
            }

            // Quality Assessment — certificate validity and inspection history
            if (studyTab === "Quality Assessment") {
              return (
                <QualityAssessmentSection
                  canEdit={canEdit}
                  data={activeStudy.qualityAssessmentData ?? defaultQualityAssessmentData()}
                  onChange={updateQualityAssessmentData}
                />
              );
            }

            // Fender / Flat Body — custom section
            if (studyTab === "Fender / Flat Body") {
              return (
                <FenderFlatBodySection
                  canEdit={canEdit && !inheritedSectionReadOnly("Fender / Flat Body")}
                  flatBodyData={activeStudy.flatBodyData ?? defaultFlatBodyData()}
                  fenderReactionData={activeStudy.fenderReactionData ?? defaultFenderReactionData()}
                  berthingEnergyData={{
                    ...(activeStudy.berthingEnergyData ?? defaultBerthingEnergyData()),
                    displacement: activeStudy.items.find(i => i.id === "gi-22")?.value ?? "",
                  }}
                  onFlatBodyChange={updateFlatBodyData}
                  onFenderReactionChange={updateFenderReactionData}
                  onBerthingEnergyChange={updateBerthingEnergyData}
                />
              );
            }

            // Mooring Arrangement — custom section
            if (studyTab === "Mooring Arrangement") {
              return (
                <MooringArrangementSection
                  canEdit={canEdit && !inheritedSectionReadOnly("Mooring Arrangement")}
                  data={activeStudy.mooringArrangementData ?? defaultMooringArrangementData()}
                  onChange={updateMooringArrangementData}
                />
              );
            }

            // Unloading Arm — custom section
            if (studyTab === "Unloading Arm") {
              const getItem = (id: string) => activeStudy.items.find(i => i.id === id)?.value ?? "";
              return (
                <UnloadingArmSection
                  canEdit={canEdit && !inheritedSectionReadOnly("Unloading Arm")}
                  data={activeStudy.unloadingArmData ?? defaultUnloadingArmData()}
                  onChange={updateUnloadingArmData}
                  manifoldHeightBL={getItem("gi-19")}
                  ballastDraft={getItem("gi-20")}
                  loadedDraft={getItem("gi-21")}
                />
              );
            }

            // Gangway — custom section
            if (studyTab === "Gangway") {
              const getItem = (id: string) => activeStudy.items.find(i => i.id === id)?.value ?? "";
              return (
                <GangwaySection
                  canEdit={canEdit && !inheritedSectionReadOnly("Gangway")}
                  data={activeStudy.gangwayData ?? defaultGangwayData()}
                  onChange={updateGangwayData}
                  upperDeckHeightBL={getItem("gi-18")}
                  ballastDraft={getItem("gi-20")}
                  loadedDraft={getItem("gi-21")}
                />
              );
            }

            // Ship Shore Link System — custom section
            if (studyTab === "Ship Shore Link System") {
              return (
                <ShipShoreLinkSection
                  canEdit={canEdit && !inheritedSectionReadOnly("Ship Shore Link System")}
                  data={activeStudy.shipShoreLinkData ?? defaultShipShoreLinkData()}
                  onChange={updateShipShoreLinkData}
                />
              );
            }

            // Cargo Management — custom section
            if (studyTab === "Cargo Management") {
              return (
                <CargoManagementSection
                  canEdit={canEdit && !inheritedSectionReadOnly("Cargo Management")}
                  data={activeStudy.cargoManagementData ?? defaultCargoManagementData()}
                  onChange={updateCargoManagementData}
                />
              );
            }

            // CTMS — custom section
            if (studyTab === "CTMS") {
              return (
                <CTMSSection
                  canEdit={canEdit}
                  data={activeStudy.ctmsData ?? defaultCTMSData()}
                  onChange={updateCTMSData}
                />
              );
            }

            // Short Distance Pieces (SDPs) — custom section
            if (studyTab === "Short Distance Pieces (SDPs)") {
              return (
                <SDPsSection
                  canEdit={canEdit}
                  data={activeStudy.sdpData ?? defaultSDPData()}
                  onChange={updateSDPData}
                />
              );
            }

            // Utility System — custom section
            if (studyTab === "Utility System") {
              return (
                <UtilitySystemSection
                  canEdit={canEdit && !inheritedSectionReadOnly("Utility System")}
                  data={activeStudy.utilityData ?? defaultUtilityData()}
                  onChange={updateUtilityData}
                />
              );
            }

            if (!activeSection || activeSection.items.length === 0) {
              return (
                <div className="border border-border rounded bg-card flex flex-col items-center gap-3 py-14 text-center mb-6">
                  <ClipboardList className="w-8 h-8 text-border" />
                  <p className="text-sm text-muted-foreground">No items in this section yet.</p>
                </div>
              );
            }

            // Group template items by their group field
            const groupMap: Record<string, TemplateItem[]> = {};
            for (const tmpl of activeSection.items) {
              const g = tmpl.group || "";
              if (!groupMap[g]) groupMap[g] = [];
              groupMap[g].push(tmpl);
            }

            const inputCls = "w-full bg-yellow-100 border border-yellow-400 rounded px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition-all";
            const selectCls = inputCls + " cursor-pointer";

            const groupNames = Object.keys(groupMap);
            const useSubTabs = studyTab === "General Information" && groupNames.length > 1;
            const activeGroup = useSubTabs ? generalInfoSubTab : null;

            const renderItems = (tmplItems: TemplateItem[], forceReadOnly = false) => (
              <div className="divide-y divide-border/40">
                {tmplItems.map(tmpl => {
                  const item = activeStudy.items.find(i => i.id === tmpl.id);
                  if (!item) return null;
                  const canonicalIdentityValue = tmpl.id === "gi-01"
                    ? (vessel?.name ?? item.value)
                    : tmpl.id === "gi-02"
                      ? (vessel?.imo ?? item.value)
                      : item.value;
                  const filled = canonicalIdentityValue.trim() !== "";
                  const isShipName = tmpl.id === "gi-01";
                  const isImo = tmpl.id === "gi-02";
                  return (
                    <div key={item.id} className={`px-5 py-2.5 transition-colors ${filled ? "bg-emerald-500/[0.03]" : ""}`}>
                      <div className="grid items-center gap-x-4" style={{ gridTemplateColumns: "minmax(180px,38%) 1fr auto" }}>
                        <span className="flex items-center gap-2 text-xs text-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${filled ? "bg-emerald-400" : "bg-border"}`} />
                          {item.name}
                          {isImo && <Lock className="w-3 h-3 text-muted-foreground" />}
                          {item.isCorrected && <span className="font-mono text-[9px] text-sky-400 border border-sky-500/30 rounded px-1">Corrected</span>}
                        </span>
                        {isShipName ? (
                          canEdit && canRenameShip && !forceReadOnly ? (
                            shipNameEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={shipNameDraft}
                                  onChange={e => setShipNameDraft(e.target.value)}
                                  placeholder="New ship name"
                                  className={inputCls}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleRenameVessel}
                                  disabled={shipNameSaving}
                                  className="shrink-0 rounded bg-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                  {shipNameSaving ? "Saving…" : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setShipNameEditing(false); setShipNameDraft(""); }}
                                  disabled={shipNameSaving}
                                  className="shrink-0 rounded border border-border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="flex-1 rounded border border-border bg-secondary/50 px-2.5 py-1.5 text-sm text-foreground">{canonicalIdentityValue || "—"}</span>
                                <button
                                  type="button"
                                  onClick={() => { setShipNameDraft(canonicalIdentityValue); setShipNameEditing(true); }}
                                  className="shrink-0 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10"
                                >
                                  Change
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-sm text-foreground">{canonicalIdentityValue || <span className="text-muted-foreground/50">—</span>}</span>
                          )
                        ) : isImo ? (
                          <div className="flex items-center gap-2">
                            <span className="flex-1 rounded border border-border bg-secondary/50 px-2.5 py-1.5 text-sm text-foreground">{canonicalIdentityValue || "—"}</span>
                            <span className="shrink-0 rounded border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Locked</span>
                          </div>
                        ) : canEdit && !forceReadOnly ? (
                          tmpl.inputType === "select" ? (
                            <select value={item.value} onChange={e => updateItem(item.id, "value", e.target.value)} className={selectCls}>
                              <option value="">— Select —</option>
                              {(tmpl.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input type="text" value={item.value} onChange={e => updateItem(item.id, "value", e.target.value)} placeholder="—" className={inputCls} />
                          )
                        ) : (
                          <span className="text-sm text-foreground">{canonicalIdentityValue || <span className="text-muted-foreground/50">—</span>}</span>
                        )}
                        <span className={`font-mono text-xs text-muted-foreground whitespace-nowrap ${tmpl.unit ? "" : "invisible"}`}>{tmpl.unit ?? "·"}</span>
                      </div>
                      {showTerminalFields && (
                        <div className="mt-1.5 pl-[calc(180px+1rem)]">
                          <input type="text" value={item.terminalNote} onChange={e => updateItem(item.id, "terminalNote", e.target.value)}
                            placeholder="Terminal note…"
                            className="w-full max-w-md bg-sky-500/5 border border-sky-500/20 rounded px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-sky-500/40 transition-all" />
                        </div>
                      )}
                      {!showTerminalFields && item.terminalNote && (
                        <div className="mt-1 pl-[calc(180px+1rem)]">
                          <p className="text-[10px] text-sky-400/80 bg-sky-500/5 rounded px-2 py-0.5 inline-block">{item.terminalNote}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );

            if (useSubTabs) {
              const visibleGroup = groupNames.includes(generalInfoSubTab) ? generalInfoSubTab : groupNames[0];
              return (
                <div className="border border-border rounded bg-card overflow-hidden mb-6">
                  {/* Sub-tab bar */}
                  <div className="flex border-b border-border bg-secondary/30">
                    {groupNames.map(gName => {
                      const gItems = groupMap[gName];
                      const gStudyItems = gItems.map(t => activeStudy.items.find(i => i.id === t.id)).filter(Boolean) as typeof activeStudy.items;
                      const gFilled = gStudyItems.filter(i => i.value.trim() !== "").length;
                      const gComplete = gFilled === gStudyItems.length && gStudyItems.length > 0;
                      const isGActive = visibleGroup === gName;
                      return (
                        <button
                          key={gName}
                          onClick={() => setGeneralInfoSubTab(gName)}
                          className={`flex items-center gap-1.5 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest transition-all border-b-2 -mb-px ${
                            isGActive ? "border-primary text-primary bg-card" : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {gName}
                          {gComplete ? (
                            <span className={`w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center ${isGActive ? "bg-emerald-400/30 text-emerald-600" : "bg-emerald-500/20 text-emerald-400"}`}>✓</span>
                          ) : (
                            <span className={`w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center ${isGActive ? "bg-yellow-400/30 text-yellow-600" : "bg-yellow-400/20 text-yellow-500"}`}>!</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {renderItems(groupMap[visibleGroup], verifiedSisterShip && visibleGroup === "Ship Major Dimensions")}
                </div>
              );
            }

            return (
              <div className="space-y-4 mb-6">
                {Object.entries(groupMap).map(([groupName, tmplItems]) => (
                  <div key={groupName} className="border border-border rounded bg-card overflow-hidden">
                    {groupName && (
                      <div className="px-5 py-2.5 bg-secondary/50 border-b border-border">
                        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{groupName}</p>
                      </div>
                    )}
                    {renderItems(tmplItems, verifiedSisterShip && studyTab === "General Information" && groupName === "Ship Major Dimensions")}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Notes */}
          <div className="border border-border rounded bg-card p-5 mb-6 space-y-4">
            <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">General Notes</h3>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Ship className="w-3 h-3" />Ship Officer Notes</label>
              {(isShip || (isTerminal && (st === "draft" || st === "editing"))) && canEdit ? (
                <textarea value={activeStudy.shipNotes} onChange={e => updateStudyField("shipNotes", e.target.value)} placeholder="Additional notes from Ship Officer…"
                  rows={3} className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none" />
              ) : (
                <p className="text-sm text-foreground bg-secondary/50 rounded px-3 py-2 min-h-[4rem]">{activeStudy.shipNotes || <span className="text-muted-foreground/50">—</span>}</p>
              )}
            </div>
            {(showTerminalFields || activeStudy.terminalNotes) && (
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-sky-400/80 uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Terminal Officer Notes</label>
                {showTerminalFields ? (
                  <textarea value={activeStudy.terminalNotes} onChange={e => updateStudyField("terminalNotes", e.target.value)} placeholder="Terminal Officer review notes and remarks…"
                    rows={3} className="w-full bg-sky-500/5 border border-sky-500/20 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 resize-none" />
                ) : (
                  <p className="text-sm text-sky-300/80 bg-sky-500/5 rounded px-3 py-2 min-h-[4rem]">{activeStudy.terminalNotes || <span className="text-muted-foreground/50">—</span>}</p>
                )}
              </div>
            )}
          </div>
        </div>
        <TaskFloater tasks={myTasks} open={showTaskPanel} onToggle={() => setShowTaskPanel(p => !p)} onSelect={goToStudyFromTask} />
        {toast && <Toast {...toast} />}
      </div>
    );
  }

  return null;
}
