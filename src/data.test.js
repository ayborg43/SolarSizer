import test from "node:test";
import assert from "node:assert/strict";
import { APPLIANCES } from "./data.js";
import { SURGE_MULTIPLIERS } from "./solarCalculations.js";

test("every appliance has realistic preset watts and default hours", () => {
  assert.ok(APPLIANCES.length >= 24);
  for (const a of APPLIANCES) {
    assert.ok(a.watts > 0 && a.watts <= 10000, `${a.id} watts`);
    assert.ok(a.defaultHours > 0 && a.defaultHours <= 24, `${a.id} defaultHours ${a.defaultHours}`);
  }
});

test("catalogue includes water heater and home theatre copied from competitor review", () => {
  const ids = APPLIANCES.map((a) => a.id);
  assert.ok(ids.includes("water_heater"));
  assert.ok(ids.includes("home_theatre"));
});

test("every surge-multiplier id exists in the catalogue", () => {
  const ids = new Set(APPLIANCES.map((a) => a.id));
  for (const id of Object.keys(SURGE_MULTIPLIERS)) {
    assert.ok(ids.has(id), `surge id ${id} missing from catalogue`);
  }
});
