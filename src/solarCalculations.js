// Typical efficiency of an inverter converting DC battery power to AC loads.
export const INVERTER_EFFICIENCY = 0.9;

export const SURGE_MULTIPLIERS = {
  fridge: 3,
  fridge_small: 3,
  fridge_large: 3,
  freezer: 3,
  ac_1hp: 3,
  ac_1_5hp: 3,
  ac_2hp: 3,
  water_pump: 3,
  washing_machine: 2,
  microwave: 1.5,
  iron: 1.2,
};

export function clampNumber(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function applianceWh(appliance) {
  return appliance.watts * appliance.hoursPerDay * (appliance.qty || 1);
}

export function appliancePeakWatts(appliance) {
  return appliance.watts * (appliance.qty || 1);
}

export function applianceSurgeWatts(appliance) {
  const multiplier = SURGE_MULTIPLIERS[appliance.id] || 1;
  return appliance.watts * multiplier * (appliance.qty || 1);
}

// Inverters in the Nigerian market are sold by VA rating at ~0.8 power factor.
export const INVERTER_POWER_FACTOR = 0.8;
export const INVERTER_VA_SIZES = [800, 1100, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7500, 10000, 12000, 15000, 20000];
// Largest common MPPT controller class; bigger arrays split across parallel units.
export const MAX_CONTROLLER_AMPS = 100;
// One mounting rack kit holds up to this many panels.
export const PANELS_PER_RACK_KIT = 4;

export function inverterVAForWatts(inverterWatts) {
  const requiredVA = inverterWatts / INVERTER_POWER_FACTOR;
  return INVERTER_VA_SIZES.find((s) => s >= requiredVA) || Math.ceil(requiredVA / 5000) * 5000;
}

// Typical generator fuel burn per kWh generated (small gensets, part load).
export const GEN_LITRES_PER_KWH = { petrol: 0.6, diesel: 0.35 };
export const BACKUP_SOURCES = ["petrol", "diesel", "grid"];

export function calcRoi({ totalWh, backupSource, backupPrice, systemCost }) {
  const dailyKwh = Math.max(0, totalWh) / 1000;
  const price = Number.isFinite(Number(backupPrice)) ? Math.max(0, Number(backupPrice)) : 0;
  const monthlyKwh = dailyKwh * 30;
  const monthlyCost = backupSource === "grid"
    ? Math.round(monthlyKwh * price)
    : Math.round(monthlyKwh * (GEN_LITRES_PER_KWH[backupSource] ?? GEN_LITRES_PER_KWH.petrol) * price);
  const cost = Number.isFinite(Number(systemCost)) ? Math.max(0, Number(systemCost)) : 0;
  const paybackMonths = cost > 0 && monthlyCost > 0 ? Math.round((cost / monthlyCost) * 10) / 10 : null;
  return { dailyKwh, monthlyCost, annualCost: monthlyCost * 12, paybackMonths };
}

export function formatInverterVA(va) {
  if (va < 1000) return `${va}VA`;
  const kva = va / 1000;
  return `${Number.isInteger(kva) ? kva : kva.toFixed(1)}kVA`;
}

export function getRecommendedVoltage(totalWh, peakWatts) {
  if (peakWatts >= 3000 || totalWh >= 3500) return 48;
  if (peakWatts >= 1000 || totalWh >= 1000) return 24;
  return 12;
}

export function autonomyDaysForTarget(target) {
  if (target === "daytime") return 1;
  if (target === "full-day") return 2;
  if (target === "generator") return 3;
  return 1;
}

export const DEFAULT_SUN_HOURS = 5;

export function calcResults({
  appliances,
  sunHours,
  autonomyDays,
  batteryType,
  systemVoltage,
  batteryTypes,
}) {
  const totalWh = appliances.reduce((s, a) => s + applianceWh(a), 0);
  const peakWatts = appliances.reduce((s, a) => s + appliancePeakWatts(a), 0);
  const surgeWatts = Math.max(peakWatts, appliances.reduce((s, a) => s + applianceSurgeWatts(a), 0));
  const bat = batteryTypes.find((b) => b.id === batteryType) || batteryTypes[0];
  const psh = clampNumber(sunHours, 1, 10, DEFAULT_SUN_HOURS);

  // Energy that must be drawn from the battery, accounting for inverter losses.
  const dailyFromBattery = totalWh / INVERTER_EFFICIENCY;
  const usableWh = (dailyFromBattery * autonomyDays) / bat.dod;
  const requiredBankAh = usableWh / systemVoltage;
  const stdSizes = [100, 150, 200, 250];
  const targetAhPerString = requiredBankAh > 0 ? requiredBankAh / Math.ceil(requiredBankAh / 200) : 0;
  const chosenBatteryAh = stdSizes.find((s) => s >= targetAhPerString) || 200;
  const parallelStrings = Math.max(1, Math.ceil(requiredBankAh / chosenBatteryAh));
  const baseBatteryVoltage = 12;
  const seriesCount = Math.max(1, Math.ceil(systemVoltage / baseBatteryVoltage));
  const physicalBatteryCount = parallelStrings * seriesCount;

  const systemPanelWatts = (dailyFromBattery / bat.efficiency / psh) * 1.25;
  const chosenPanelW = stdPanelSize(systemPanelWatts);
  const panelCount = Math.max(1, Math.ceil(systemPanelWatts / chosenPanelW));

  const inverterSize = Math.ceil((surgeWatts * 1.25) / 100) * 100;
  const rawControllerAmps = (chosenPanelW * panelCount / systemVoltage) * 1.25;
  const chargeControllerCount = Math.max(1, Math.ceil(rawControllerAmps / MAX_CONTROLLER_AMPS));
  const chargeControllerAmps = Math.ceil(rawControllerAmps / chargeControllerCount / 10) * 10;
  const chargeControllerTotalAmps = Math.ceil(rawControllerAmps / 10) * 10;
  const roofAreaSqm = Math.ceil(panelCount * 2.2 * 10) / 10;

  return {
    totalWh,
    peakWatts,
    surgeWatts,
    battery: {
      count: physicalBatteryCount,
      ah: chosenBatteryAh,
      totalAh: parallelStrings * chosenBatteryAh,
      requiredAh: requiredBankAh,
      seriesCount,
      parallelStrings,
      physicalBatteryCount,
      backupHours: peakWatts > 0
        ? Math.round(((parallelStrings * chosenBatteryAh * systemVoltage * bat.dod * INVERTER_EFFICIENCY) / peakWatts) * 10) / 10
        : 0,
      baseVoltage: baseBatteryVoltage,
      wiringText: `${parallelStrings} parallel string${parallelStrings !== 1 ? "s" : ""} of ${seriesCount} × ${baseBatteryVoltage}V batteries in series`,
    },
    panels: { count: panelCount, watts: chosenPanelW, totalWatts: panelCount * chosenPanelW, requiredPanelWatts: Math.round(systemPanelWatts), roofAreaSqm, mountingKits: Math.max(1, Math.ceil(panelCount / PANELS_PER_RACK_KIT)) },
    inverter: inverterSize,
    inverterVA: inverterVAForWatts(inverterSize),
    chargeController: chargeControllerAmps,
    chargeControllerCount,
    chargeControllerTotalAmps,
    psh,
    systemVoltage,
    bat,
  };
}

function stdPanelSize(systemPanelWatts) {
  const panelWattages = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];
  const target = systemPanelWatts > 0 ? systemPanelWatts / Math.ceil(systemPanelWatts / 400) : 0;
  return panelWattages.find((p) => p >= target) || 400;
}

export function buildShareText({
  results,
  appliances,
  sunHours,
  backupTargetLabel,
  propertyTypeLabel,
  installerPreferenceLabel,
  confidenceWarnings,
  quoteChecklist,
  maintenanceReminders,
}) {
  const mustRun = appliances
    .filter((a) => (a.priority || "must") === "must")
    .map((a) => `${a.qty || 1}x ${a.name}`)
    .join(", ") || "Not specified";
  const niceToHave = appliances
    .filter((a) => a.priority === "nice")
    .map((a) => `${a.qty || 1}x ${a.name}`)
    .join(", ") || "None";

  return [
    "SolarSizer recommendation",
    `${sunHours} peak sun hrs/day · ${results.totalWh.toLocaleString()} Wh/day · ${results.peakWatts.toLocaleString()}W running peak · ${results.surgeWatts.toLocaleString()}W surge estimate`,
    `Goal: ${backupTargetLabel} · ${propertyTypeLabel} · ${installerPreferenceLabel}`,
    `Battery: ${results.battery.physicalBatteryCount} × ${results.battery.ah}Ah ${results.battery.baseVoltage}V batteries (${results.battery.wiringText})`,
    `Panels: ${results.panels.count} × ${results.panels.watts}W (${results.panels.totalWatts}W total) · Roof space: ~${results.panels.roofAreaSqm}sqm · Mounting: ${results.panels.mountingKits} rack kit${results.panels.mountingKits !== 1 ? "s" : ""}`,
    `Inverter: ${results.inverter}W (≈${formatInverterVA(results.inverterVA)} at 0.8 PF — shop size) · Controller: ${results.chargeControllerCount > 1 ? `${results.chargeControllerCount} × ` : ""}${results.chargeController}A MPPT`,
    `Est. backup time at peak load: ${results.battery.backupHours} hrs (no sun)`,
    `Must-run loads: ${mustRun}`,
    `Nice-to-have loads: ${niceToHave}`,
    "",
    "Confidence warnings:",
    ...confidenceWarnings.map((item) => `- ${item}`),
    "",
    "Quote checklist:",
    ...quoteChecklist.map((item) => `- ${item}`),
    "",
    "Maintenance reminders:",
    ...maintenanceReminders.map((item) => `- ${item}`),
    "",
    "Disclaimer: Sizing estimate only. Installer must verify on site.",
  ].join("\n");
}
