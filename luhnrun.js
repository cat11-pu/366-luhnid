// luhnrun.js：按处理预算处理并留账，收尾不限预算清账
import { digitOf, okOf } from "./luhn.js";

function errorWith(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isDigits(digits) {
  return typeof digits === "string" && digits.length > 0 && /^[0-9]+$/.test(digits);
}

// 先结构、再数字串、再长度，全部事件先校验再处理。
function validate(event, codes) {
  if (!event || typeof event !== "object"
      || (event.kind !== "number" && event.kind !== "check")) {
    throw errorWith(codes.event, "事件不合法");
  }
  if (!isDigits(event.digits)) {
    throw errorWith(codes.digits, "数字串不合法");
  }
  if (event.kind === "check" && event.digits.length < 2) {
    throw errorWith(codes.short, "校验串不足两位");
  }
}

function codesOf(spec) {
  return {
    digits: spec.bad_digits_code || "E_BAD_DIGITS",
    short: spec.short_code || "E_TOO_SHORT",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function applyOne(event, state) {
  if (event.kind === "number") {
    state.issued.push([event.digits, digitOf(event.digits)]);
  } else {
    state.checks.push([event.digits, okOf(event.digits) ? 1 : 0]);
  }
  state.applied.push([event.kind, event.digits]);
}

function appliedKey(event) {
  return event.kind + "\u0000" + event.digits;
}

function cloneState(state) {
  return {
    issued: state.issued.map((row) => [row[0], row[1]]),
    checks: state.checks.map((row) => [row[0], row[1]]),
    ledger: state.ledger.map((row) => [row[0], row[1]]),
    applied: state.applied.map((row) => [row[0], row[1]])
  };
}

export function step(spec) {
  const codes = codesOf(spec);
  const events = Array.isArray(spec.events) ? spec.events : [];
  for (const event of events) {
    validate(event, codes);
  }

  const state = cloneState(spec.state || { issued: [], checks: [], ledger: [], applied: [] });
  const seen = new Set(state.applied.map((row) => row[0] + "\u0000" + row[1]));
  let budget = Number.isFinite(spec.budget) ? Math.max(0, Math.trunc(spec.budget)) : 0;

  let served = 0;
  for (const event of events) {
    if (seen.has(appliedKey(event))) {
      continue;
    }
    if (budget > 0) {
      applyOne(event, state);
      seen.add(appliedKey(event));
      budget -= 1;
      served += 1;
    } else {
      state.ledger.push([event.kind, event.digits]);
    }
  }

  return {
    state,
    served,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map((row) => [row[0], row[1]]),
    judged: served,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = cloneState(spec.state || { issued: [], checks: [], ledger: [], applied: [] });
  const pending = state.ledger;
  state.ledger = [];
  let catchup = 0;
  while (pending.length > 0) {
    const row = pending.shift();
    applyOne({ kind: row[0], digits: row[1] }, state);
    catchup += 1;
  }
  return { state, catchup };
}
