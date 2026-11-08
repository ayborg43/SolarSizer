import test from "node:test";
import assert from "node:assert/strict";
import {
  WIZARD_STORAGE_KEY,
  parseWizardState,
  serializeWizardState,
  loadWizardState,
  saveWizardState,
  clearWizardState,
} from "./statePersistence.js";

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    map,
  };
}

const validState = {
  step: 2,
  sunHours: 5.8,
  appliances: [
    { id: "fridge", name: "Refrigerator", icon: "🧊", watts: 150, hoursPerDay: 10, qty: 2, priority: "must" },
    { id: "custom_123", name: "CCTV Camera", icon: "🔌", watts: 30, hoursPerDay: 24, qty: 1, priority: "nice" },
  ],
  backupTarget: "generator",
  propertyType: "duplex",
  installerPreference: "diy",
  fridgeOvernight: true,
  acDaily: false,
  autonomyDays: 3,
  batteryType: "lithium",
  systemVoltage: 48,
  expandedBattery: "lithium",
  activeProfile: null,
  darkMode: true,
  showStepHelp: false,
  voltageManuallySet: true,
  backupSource: "diesel",
  backupPrice: 1200,
  systemCost: 2500000,
};

test("wizard state round-trips through storage", () => {
  const storage = fakeStorage();
  saveWizardState(storage, validState);
  assert.ok(storage.map.has(WIZARD_STORAGE_KEY));
  assert.deepEqual(loadWizardState(storage), parseWizardState(serializeWizardState(validState)));
  const loaded = loadWizardState(storage);
  assert.equal(loaded.sunHours, 5.8);
  assert.equal(loaded.appliances.length, 2);
  assert.equal(loaded.appliances[1].name, "CCTV Camera");
  assert.equal(loaded.backupSource, "diesel");
  assert.equal(loaded.backupPrice, 1200);
  assert.equal(loaded.systemCost, 2500000);
  clearWizardState(storage);
  assert.equal(loadWizardState(storage), null);
});

test("parseWizardState returns null for corrupt or non-object input", () => {
  assert.equal(parseWizardState("not json{"), null);
  assert.equal(parseWizardState("42"), null);
  assert.equal(parseWizardState(null), null);
  assert.equal(loadWizardState(fakeStorage()), null);
});

test("parseWizardState sanitizes unknown values and clamps numbers", () => {
  const parsed = parseWizardState(JSON.stringify({
    step: 99,
    sunHours: 99,
    appliances: [
      { id: "does_not_exist", watts: 100, hoursPerDay: 5, qty: 1 },
      { id: "fridge", watts: 99999, hoursPerDay: 99, qty: 500, priority: "bogus" },
    ],
    backupTarget: "bogus",
    propertyType: "bogus",
    installerPreference: "bogus",
    autonomyDays: 99,
    batteryType: "bogus",
    systemVoltage: 13,
    darkMode: "yes",
  }));
  assert.equal(parsed.step, 4);
  assert.equal(parsed.sunHours, 10);
  assert.equal("country" in parsed, false);
  assert.equal(parsed.appliances.length, 1);
  assert.equal(parsed.appliances[0].watts, 10000);
  assert.equal(parsed.appliances[0].hoursPerDay, 24);
  assert.equal(parsed.appliances[0].qty, 50);
  assert.equal(parsed.appliances[0].priority, "must");
  assert.equal(parsed.backupTarget, "overnight");
  assert.equal(parsed.autonomyDays, 6);
  assert.equal(parsed.backupSource, "petrol");
  assert.equal(parsed.backupPrice, 1000);
  assert.equal(parsed.systemCost, 0);
  assert.equal(parsed.batteryType, "agm");
  assert.equal(parsed.systemVoltage, 24);
  assert.equal(parsed.darkMode, false);
});
