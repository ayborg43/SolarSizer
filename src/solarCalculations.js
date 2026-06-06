export const SURGE_MULTIPLIERS = {
  fridge: 3,
  freezer: 3,
  ac_1hp: 3,
  ac_1_5hp: 3,
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

export function calcResults({
  appliances,
  country,
  location,
  autonomyDays,
  batteryType,
  systemVoltage,
  batteryTypes,
  countries,
}) {
  const totalWh = appliances.reduce((s, a) => s + applianceWh(a), 0);
  const peakWatts = appliances.reduce((s, a) => s + appliancePeakWatts(a), 0);
  const surgeWatts = Math.max(peakWatts, appliances.reduce((s, a) => s + applianceSurgeWatts(a), 0));
  const bat = batteryTypes.find((b) => b.id === batteryType);
  const countryData = countries.find((c) => c.code === country) || countries[0];
  const stateData = countryData.states.find((s) => s.name === location) || countryData.states[0];

  const usableWh = (totalWh * autonomyDays) / bat.dod;
  const requiredBankAh = usableWh / systemVoltage;
  const stdSizes = [100, 150, 200, 250];
  const chosenBatteryAh = stdSizes.find((s) => s >= requiredBankAh / Math.ceil(requiredBankAh / 200)) || 200;
  const parallelStrings = Math.max(1, Math.ceil(requiredBankAh / chosenBatteryAh));
  const baseBatteryVoltage = 12;
  const seriesCount = Math.max(1, Math.ceil(systemVoltage / baseBatteryVoltage));
  const physicalBatteryCount = parallelStrings * seriesCount;

  const systemPanelWatts = (totalWh / bat.efficiency / stateData.psh) * 1.25;
  const chosenPanelW = stdPanelSize(systemPanelWatts);
  const panelCount = Math.ceil(systemPanelWatts / chosenPanelW);

  const inverterSize = Math.ceil((surgeWatts * 1.25) / 100) * 100;
  const chargeControllerAmps = Math.ceil((chosenPanelW * panelCount / systemVoltage) * 1.25 / 10) * 10;
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
      baseVoltage: baseBatteryVoltage,
      wiringText: `${parallelStrings} parallel string${parallelStrings !== 1 ? "s" : ""} of ${seriesCount} × ${baseBatteryVoltage}V batteries in series`,
    },
    panels: { count: panelCount, watts: chosenPanelW, totalWatts: panelCount * chosenPanelW, roofAreaSqm },
    inverter: inverterSize,
    chargeController: chargeControllerAmps,
    psh: stateData.psh,
    zone: stateData.zone,
    systemVoltage,
    bat,
  };
}

function stdPanelSize(systemPanelWatts) {
  const panelWattages = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];
  return panelWattages.find((p) => p >= systemPanelWatts / Math.ceil(systemPanelWatts / 400)) || 400;
}

export function buildShareText({
  results,
  appliances,
  location,
  countryName,
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
    `${location}, ${countryName} · ${results.totalWh.toLocaleString()} Wh/day · ${results.peakWatts.toLocaleString()}W running peak · ${results.surgeWatts.toLocaleString()}W surge estimate`,
    `Goal: ${backupTargetLabel} · ${propertyTypeLabel} · ${installerPreferenceLabel}`,
    `Battery: ${results.battery.physicalBatteryCount} × ${results.battery.ah}Ah ${results.battery.baseVoltage}V batteries (${results.battery.wiringText})`,
    `Panels: ${results.panels.count} × ${results.panels.watts}W (${results.panels.totalWatts}W total) · Roof space: ~${results.panels.roofAreaSqm}sqm`,
    `Inverter: ${results.inverter}W · Controller: ${results.chargeController}A MPPT`,
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
