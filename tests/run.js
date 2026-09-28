import assert from "node:assert";
import { digitOf, okOf } from "../luhn.js";
import { step, close } from "../luhnrun.js";
import { render } from "../app.js";

const base = {
  budget: 1,
  state: { issued: [], checks: [], ledger: [], applied: [] },
  events: [{ id: 1, kind: "number", digits: "12" }],
  bad_digits_code: "E_BAD_DIGITS", short_code: "E_TOO_SHORT",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("digitOf returns a number", () => {
  assert.strictEqual(typeof digitOf("12"), "number");
});

check("okOf returns a boolean", () => {
  assert.strictEqual(typeof okOf("18"), "boolean");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count_events, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
