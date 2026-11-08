import test from "node:test";
import assert from "node:assert/strict";
import {
  INVERTER_EFFICIENCY,
  SURGE_MULTIPLIERS,
  applianceSurgeWatts,
  appliancePeakWatts,
  applianceWh,
  buildShareText,
  calcResults,
  calcRoi,
  clampNumber,
  formatInverterVA,
  getRecommendedVoltage,
} from "./solarCalculations.js";

const batteryTypes = [
  { id: "agm", name: "AGM Battery", dod: 0.5, efficiency: 0.9 },
  { id: "lithium", name: "Lithium Iron Phosphate", dod: 0.9, efficiency: 0.97 },
];

const fridge = { id: "fridge", name: "Refrigerator", watts: 150, hoursPerDay: 10, qty: 1 };

function baseArgs(overrides = {}) {
  return {
    appliances: [fridge],
    sunHours: 4.5,
    autonomyDays: 1,
    batteryType: "agm",
    systemVoltage: 24,
    batteryTypes,
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

test("calcResults exposes the raw panel requirement before rounding up to whole panels", () => {
  const r = calcResults(baseArgs());
  const expectedPanelWatts = (1500 / INVERTER_EFFICIENCY / 0.9 / 4.5) * 1.25;
  assert.ok(Number.isFinite(r.panels.requiredPanelWatts));
  // Raw requirement is the un-rounded figure the "Why" explanation must quote,
  // and the installed array must cover it with less than one panel of excess.
  assert.ok(Math.abs(r.panels.requiredPanelWatts - expectedPanelWatts) < 1);
  assert.ok(r.panels.requiredPanelWatts <= r.panels.totalWatts);
  assert.ok(r.panels.totalWatts - r.panels.requiredPanelWatts < r.panels.watts);
});

test("calcResults picks the smallest standard battery combination covering the requirement", () => {
  // 252W × 9h = 2268Wh → required ≈ 210Ah at 24V AGM. A 1×250Ah string covers
  // it; the bank must not balloon to 300Ah (2×150Ah) or more.
  const r = calcResults(baseArgs({ appliances: [{ id: "custom", name: "Load", watts: 252, hoursPerDay: 9, qty: 1 }] }));
  assert.ok(r.battery.totalAh >= r.battery.requiredAh);
  assert.ok(r.battery.totalAh <= 260, `bank ${r.battery.totalAh}Ah excessively oversizes ${r.battery.requiredAh.toFixed(0)}Ah requirement`);
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

test("calcResults uses entered sun hours and falls back to 5 when invalid", () => {
  assert.equal(calcResults(baseArgs({ sunHours: 6 })).psh, 6);
  assert.equal(calcResults(baseArgs({ sunHours: "bad" })).psh, 5);
  assert.equal(calcResults(baseArgs({ sunHours: 99 })).psh, 10);
  // Fewer sun hours must mean a larger panel array
  assert.ok(calcResults(baseArgs({ sunHours: 3 })).panels.totalWatts > calcResults(baseArgs({ sunHours: 6 })).panels.totalWatts);
});

test("calcResults snaps inverter to a standard VA market size at 0.8 power factor", () => {
  const r = calcResults(baseArgs());
  assert.ok(r.inverterVA >= r.inverter / 0.8, "VA rating must cover watts at 0.8 PF");
  assert.ok(r.inverterVA < (r.inverter / 0.8) * 1.6, "VA rating must be the next size up, not oversized");
  assert.equal(formatInverterVA(800), "800VA");
  assert.equal(formatInverterVA(1500), "1.5kVA");
  assert.equal(formatInverterVA(2000), "2kVA");
  assert.equal(formatInverterVA(2500), "2.5kVA");
});

test("calcResults reports mounting kits and charge-controller quantity", () => {
  const small = calcResults(baseArgs());
  assert.equal(small.panels.mountingKits, Math.ceil(small.panels.count / 4));
  assert.equal(small.chargeControllerCount, 1);
  // A very large 12V array needs more than one 100A controller.
  const big = calcResults(baseArgs({
    appliances: [{ id: "ac_1_5hp", name: "AC", watts: 1300, hoursPerDay: 12, qty: 4 }],
    systemVoltage: 12,
    autonomyDays: 3,
  }));
  assert.ok(big.chargeControllerCount > 1, `expected >1 controller, got ${big.chargeControllerCount}`);
  assert.ok(big.chargeController <= 110, "per-controller amps stay within a 100A-class unit plus rounding");
  assert.ok(big.chargeControllerCount * big.chargeController >= big.chargeControllerTotalAmps - big.chargeControllerCount * 10);
});

test("calcResults reports estimated backup hours at peak load", () => {
  const r = calcResults(baseArgs());
  const usableWh = r.battery.totalAh * 24 * 0.5; // AGM DoD from fixture
  const expected = usableWh * INVERTER_EFFICIENCY / r.peakWatts;
  assert.ok(Math.abs(r.battery.backupHours - expected) < 0.6, `backupHours ${r.battery.backupHours} vs expected ${expected}`);
  const d3 = calcResults(baseArgs({ autonomyDays: 3 }));
  assert.ok(d3.battery.backupHours > r.battery.backupHours);
});

test("calcRoi computes generator fuel cost and payback", () => {
  const roi = calcRoi({ totalWh: 10000, backupSource: "petrol", backupPrice: 1000, systemCost: 3000000 });
  // 10 kWh/day × 30 × 0.6 L/kWh × ₦1000/L
  assert.equal(roi.monthlyCost, 180000);
  assert.equal(roi.paybackMonths, 16.7); // 3,000,000 / 180,000, rounded to 1dp
  const diesel = calcRoi({ totalWh: 10000, backupSource: "diesel", backupPrice: 1000, systemCost: 0 });
  assert.ok(diesel.monthlyCost < roi.monthlyCost, "diesel gensets burn less fuel per kWh");
  assert.equal(diesel.paybackMonths, null, "no system cost → no payback figure");
  const grid = calcRoi({ totalWh: 10000, backupSource: "grid", backupPrice: 200, systemCost: 1200000 });
  assert.equal(grid.monthlyCost, 60000); // 10 × 30 × ₦200/kWh
  assert.equal(grid.paybackMonths, 20);
  const zero = calcRoi({ totalWh: 0, backupSource: "petrol", backupPrice: 1000, systemCost: 100 });
  assert.equal(zero.monthlyCost, 0);
  assert.equal(zero.paybackMonths, null);
});

test("buildShareText includes key sections", () => {
  const r = calcResults(baseArgs());
  const text = buildShareText({
    results: r,
    appliances: [{ ...fridge, priority: "must" }, { id: "tv", name: "TV", watts: 60, hoursPerDay: 4, qty: 1, priority: "nice" }],
    sunHours: 4.5,
    confidenceWarnings: ["warning A"],
    quoteChecklist: ["checklist A"],
    maintenanceReminders: ["reminder A"],
  });
  assert.match(text, /SolarSizer recommendation/);
  assert.match(text, /4\.5 peak sun hrs\/day/);
  assert.match(text, /Must-run loads: 1x Refrigerator/);
  assert.match(text, /Nice-to-have loads: 1x TV/);
  assert.match(text, /- warning A/);
  assert.match(text, /- checklist A/);
  assert.match(text, /- reminder A/);
  assert.match(text, /Disclaimer/);
  assert.match(text, /Inverter: \d+W \(≈/);
  assert.match(text, /rack kit/);
});
