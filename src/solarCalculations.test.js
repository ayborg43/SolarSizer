import test from "node:test";
import assert from "node:assert/strict";
import {
  INVERTER_EFFICIENCY,
  SURGE_MULTIPLIERS,
  applianceSurgeWatts,
  appliancePeakWatts,
  applianceWh,
  autonomyDaysForTarget,
  buildShareText,
  calcResults,
  clampNumber,
  getRecommendedVoltage,
} from "./solarCalculations.js";

const batteryTypes = [
  { id: "agm", name: "AGM Battery", dod: 0.5, efficiency: 0.9 },
  { id: "lithium", name: "Lithium Iron Phosphate", dod: 0.9, efficiency: 0.97 },
];

const countries = [
  { code: "NG", name: "Nigeria", states: [{ name: "Lagos", psh: 4.5, zone: "South West" }] },
];

const fridge = { id: "fridge", name: "Refrigerator", watts: 150, hoursPerDay: 10, qty: 1 };

function baseArgs(overrides = {}) {
  return {
    appliances: [fridge],
    country: "NG",
    location: "Lagos",
    autonomyDays: 1,
    batteryType: "agm",
    systemVoltage: 24,
    batteryTypes,
    countries,
    ...overrides,
  };
}

test("clampNumber clamps to range and falls back on bad input", () => {
  assert.equal(clampNumber(5, 1, 10), 5);
  assert.equal(clampNumber(-3, 1, 10), 1);
  assert.equal(clampNumber(99, 1, 10), 10);
  assert.equal(clampNumber("abc", 1, 10, 7), 7);
  assert.equal(clampNumber(undefined, 0, 24, 1), 1);
});

test("applianceWh multiplies watts, hours and quantity", () => {
  assert.equal(applianceWh({ watts: 100, hoursPerDay: 5, qty: 2 }), 1000);
  assert.equal(applianceWh({ watts: 100, hoursPerDay: 5 }), 500); // qty defaults to 1
});

test("appliancePeakWatts respects quantity", () => {
  assert.equal(appliancePeakWatts({ watts: 150, qty: 3 }), 450);
});

test("applianceSurgeWatts applies surge multiplier, defaults to 1", () => {
  assert.equal(applianceSurgeWatts({ id: "fridge", watts: 150, qty: 1 }), 150 * SURGE_MULTIPLIERS.fridge);
  assert.equal(applianceSurgeWatts({ id: "bulb_led", watts: 10, qty: 2 }), 20);
});

test("getRecommendedVoltage thresholds", () => {
  assert.equal(getRecommendedVoltage(200, 300), 12);
  assert.equal(getRecommendedVoltage(1500, 800), 24);
  assert.equal(getRecommendedVoltage(500, 1200), 24);
  assert.equal(getRecommendedVoltage(4000, 500), 48);
  assert.equal(getRecommendedVoltage(100, 3500), 48);
});

test("autonomyDaysForTarget mapping and default", () => {
  assert.equal(autonomyDaysForTarget("daytime"), 1);
  assert.equal(autonomyDaysForTarget("full-day"), 2);
  assert.equal(autonomyDaysForTarget("generator"), 3);
  assert.equal(autonomyDaysForTarget("overnight"), 1);
});

test("calcResults sizes battery bank including inverter efficiency", () => {
  const r = calcResults(baseArgs());
  assert.equal(r.totalWh, 1500);
  const expectedRequiredAh = (1500 / INVERTER_EFFICIENCY / 0.5) / 24;
  assert.ok(Math.abs(r.battery.requiredAh - expectedRequiredAh) < 0.01);
  // Chosen bank must cover the requirement
  assert.ok(r.battery.totalAh >= r.battery.requiredAh);
  // 24V system from 12V blocks → 2 in series
  assert.equal(r.battery.seriesCount, 2);
  assert.equal(r.battery.physicalBatteryCount, r.battery.seriesCount * r.battery.parallelStrings);
});

test("calcResults sizes panels including inverter and battery efficiency", () => {
  const r = calcResults(baseArgs());
  const expectedPanelWatts = (1500 / INVERTER_EFFICIENCY / 0.9 / 4.5) * 1.25;
  // Array must cover the requirement, but with at most one extra panel of
  // headroom — this catches both undersizing (e.g. dropping the inverter
  // efficiency term) and runaway oversizing.
  assert.ok(r.panels.totalWatts >= expectedPanelWatts);
  assert.ok(r.panels.totalWatts < expectedPanelWatts + r.panels.watts);
  assert.ok(r.panels.count >= 1);
  assert.ok(r.panels.roofAreaSqm > 0);
});

test("calcResults falls back to first battery type when unknown", () => {
  const r = calcResults(baseArgs({ batteryType: "nonexistent" }));
  assert.equal(r.bat.id, "agm");
  assert.ok(Number.isFinite(r.battery.totalAh));
});

test("calcResults inverter covers surge with headroom", () => {
  const r = calcResults(baseArgs());
  assert.ok(r.inverter >= r.surgeWatts * 1.25);
  assert.equal(r.inverter % 100, 0);
});

test("lithium needs less battery capacity than AGM for same load", () => {
  const agm = calcResults(baseArgs());
  const li = calcResults(baseArgs({ batteryType: "lithium" }));
  assert.ok(li.battery.requiredAh < agm.battery.requiredAh);
});

test("more autonomy days means a bigger bank", () => {
  const d1 = calcResults(baseArgs());
  const d3 = calcResults(baseArgs({ autonomyDays: 3 }));
  assert.ok(d3.battery.totalAh > d1.battery.totalAh);
});

test("calcResults handles zero load without NaN", () => {
  const r = calcResults(baseArgs({ appliances: [{ id: "fridge", name: "Fridge", watts: 150, hoursPerDay: 0, qty: 1 }] }));
  assert.equal(r.totalWh, 0);
  for (const v of [r.battery.count, r.battery.ah, r.battery.totalAh, r.panels.count, r.panels.watts, r.inverter, r.chargeController]) {
    assert.ok(Number.isFinite(v), `expected finite number, got ${v}`);
  }
  assert.ok(r.battery.parallelStrings >= 1);
  assert.ok(r.panels.count >= 1);
});

test("calcResults handles empty appliance list without NaN", () => {
  const r = calcResults(baseArgs({ appliances: [] }));
  assert.equal(r.totalWh, 0);
  assert.ok(Number.isFinite(r.battery.totalAh));
  assert.ok(Number.isFinite(r.panels.totalWatts));
});

test("calcResults falls back to first country/state when unknown", () => {
  const r = calcResults(baseArgs({ country: "XX", location: "Nowhere" }));
  assert.equal(r.psh, 4.5);
  assert.equal(r.zone, "South West");
});

test("buildShareText includes key sections", () => {
  const r = calcResults(baseArgs());
  const text = buildShareText({
    results: r,
    appliances: [{ ...fridge, priority: "must" }, { id: "tv", name: "TV", watts: 60, hoursPerDay: 4, qty: 1, priority: "nice" }],
    location: "Lagos",
    countryName: "Nigeria",
    backupTargetLabel: "Overnight backup",
    propertyTypeLabel: "Flat / Apartment",
    installerPreferenceLabel: "Compare quotes first",
    confidenceWarnings: ["warning A"],
    quoteChecklist: ["checklist A"],
    maintenanceReminders: ["reminder A"],
  });
  assert.match(text, /SolarSizer recommendation/);
  assert.match(text, /Lagos, Nigeria/);
  assert.match(text, /Must-run loads: 1x Refrigerator/);
  assert.match(text, /Nice-to-have loads: 1x TV/);
  assert.match(text, /- warning A/);
  assert.match(text, /- checklist A/);
  assert.match(text, /- reminder A/);
  assert.match(text, /Disclaimer/);
});
