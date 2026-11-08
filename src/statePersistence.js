import {
  APPLIANCES,
  BATTERY_TYPES,
  COUNTRIES,
  INSTALLER_PREFS,
  LOAD_PROFILES,
  PROPERTY_TYPES,
  SYSTEM_VOLTAGES,
} from "./data.js";
import { clampNumber } from "./solarCalculations.js";

export const WIZARD_STORAGE_KEY = "solarsizer-wizard-v1";

const BACKUP_TARGETS = ["daytime", "overnight", "full-day", "generator"];

const FIELDS = [
  "step", "country", "location", "appliances", "backupTarget", "propertyType",
  "installerPreference", "fridgeOvernight", "acDaily", "autonomyDays",
  "batteryType", "systemVoltage", "expandedBattery", "activeProfile",
  "darkMode", "showStepHelp", "voltageManuallySet",
  "backupSource", "backupPrice", "systemCost",
];

function boolOr(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeAppliance(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string") return null;
  const base = APPLIANCES.find((a) => a.id === raw.id);
  const isCustom = raw.id.startsWith("custom_");
  if (!base && !isCustom) return null;
  return {
    id: raw.id,
    name: base ? base.name : String(raw.name || "Custom appliance").slice(0, 60),
    icon: base ? base.icon : "🔌",
    watts: clampNumber(raw.watts, 1, 10000, base ? base.watts : 100),
    hoursPerDay: clampNumber(raw.hoursPerDay, 0, 24, 1),
    qty: Math.round(clampNumber(raw.qty, 1, 50, 1)),
    priority: raw.priority === "nice" ? "nice" : "must",
  };
}

export function parseWizardState(text) {
  if (typeof text !== "string" || !text) return null;
  let raw;
  try { raw = JSON.parse(text); } catch { return null; }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const countryData = COUNTRIES.find((c) => c.code === raw.country) || COUNTRIES[0];
  const location = countryData.states.some((s) => s.name === raw.location)
    ? raw.location
    : countryData.defaultState;
  const batteryIds = BATTERY_TYPES.map((b) => b.id);

  return {
    step: Math.round(clampNumber(raw.step, 0, 4, 0)),
    country: countryData.code,
    location,
    appliances: Array.isArray(raw.appliances)
      ? raw.appliances.map(sanitizeAppliance).filter(Boolean)
      : [],
    backupTarget: BACKUP_TARGETS.includes(raw.backupTarget) ? raw.backupTarget : "overnight",
    propertyType: PROPERTY_TYPES.some((p) => p.id === raw.propertyType) ? raw.propertyType : "flat",
    installerPreference: INSTALLER_PREFS.some((p) => p.id === raw.installerPreference) ? raw.installerPreference : "compare",
    fridgeOvernight: boolOr(raw.fridgeOvernight, true),
    acDaily: boolOr(raw.acDaily, false),
    autonomyDays: Math.round(clampNumber(raw.autonomyDays, 1, 6, 1)),
    backupSource: ["petrol", "diesel", "grid"].includes(raw.backupSource) ? raw.backupSource : "petrol",
    backupPrice: clampNumber(raw.backupPrice, 0, 100000, 1000),
    systemCost: clampNumber(raw.systemCost, 0, 1000000000, 0),
    batteryType: batteryIds.includes(raw.batteryType) ? raw.batteryType : "agm",
    systemVoltage: SYSTEM_VOLTAGES.includes(raw.systemVoltage) ? raw.systemVoltage : 24,
    expandedBattery: batteryIds.includes(raw.expandedBattery) ? raw.expandedBattery : null,
    activeProfile: LOAD_PROFILES.some((p) => p.id === raw.activeProfile) ? raw.activeProfile : null,
    darkMode: boolOr(raw.darkMode, false),
    showStepHelp: boolOr(raw.showStepHelp, true),
    voltageManuallySet: boolOr(raw.voltageManuallySet, false),
  };
}

export function serializeWizardState(state) {
  const picked = {};
  for (const field of FIELDS) picked[field] = state[field];
  return JSON.stringify(picked);
}

export function loadWizardState(storage) {
  try {
    return parseWizardState(storage.getItem(WIZARD_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveWizardState(storage, state) {
  try {
    storage.setItem(WIZARD_STORAGE_KEY, serializeWizardState(state));
  } catch { /* storage full or blocked — persistence is best-effort */ }
}

export function clearWizardState(storage) {
  try {
    storage.removeItem(WIZARD_STORAGE_KEY);
  } catch { /* ignore */ }
}

export function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
