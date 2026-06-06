import assert from "node:assert/strict";
import test from "node:test";
import {
  buildShareText,
  calcResults,
  getRecommendedVoltage,
} from "../src/solarCalculations.js";

const batteryTypes = [
  { id: "agm", name: "AGM", dod: 0.5, efficiency: 0.9 },
  { id: "lithium", name: "Lithium", dod: 0.9, efficiency: 0.97 },
];

const countries = [
  {
    code: "NG",
    states: [{ name: "Lagos", psh: 4.5, zone: "South West" }],
  },
];

test("calcResults includes physical battery layout and surge-aware inverter sizing", () => {
  const results = calcResults({
    appliances: [
      { id: "fridge", name: "Refrigerator", watts: 150, hoursPerDay: 10, qty: 1 },
      { id: "ac_1hp", name: "AC", watts: 900, hoursPerDay: 4, qty: 1 },
    ],
    country: "NG",
    location: "Lagos",
    autonomyDays: 1,
    batteryType: "agm",
    systemVoltage: 24,
    batteryTypes,
    countries,
  });

  assert.equal(results.battery.seriesCount, 2);
  assert.equal(results.battery.physicalBatteryCount, results.battery.seriesCount * results.battery.parallelStrings);
  assert.ok(results.surgeWatts > results.peakWatts);
  assert.ok(results.inverter >= results.surgeWatts);
  assert.ok(results.panels.roofAreaSqm > 0);
});

test("getRecommendedVoltage escalates as load increases", () => {
  assert.equal(getRecommendedVoltage(500, 300), 12);
  assert.equal(getRecommendedVoltage(1500, 800), 24);
  assert.equal(getRecommendedVoltage(4000, 2500), 48);
});

test("buildShareText includes report context and disclaimer", () => {
  const results = calcResults({
    appliances: [{ id: "router", name: "WiFi Router", watts: 10, hoursPerDay: 24, qty: 1, priority: "must" }],
    country: "NG",
    location: "Lagos",
    autonomyDays: 1,
    batteryType: "agm",
    systemVoltage: 12,
    batteryTypes,
    countries,
  });

  const text = buildShareText({
    results,
    appliances: [{ id: "router", name: "WiFi Router", watts: 10, hoursPerDay: 24, qty: 1, priority: "must" }],
    location: "Lagos",
    countryName: "Nigeria",
    backupTargetLabel: "Overnight backup",
    propertyTypeLabel: "Flat / Apartment",
    installerPreferenceLabel: "Compare quotes first",
    confidenceWarnings: ["Installer must confirm cable size."],
    quoteChecklist: ["Panel brand and wattage"],
    maintenanceReminders: ["Clean panels monthly"],
  });

  assert.match(text, /Overnight backup/);
  assert.match(text, /Quote checklist/);
  assert.match(text, /Maintenance reminders/);
  assert.match(text, /Sizing estimate only\. Installer must verify on site\./);
});
