import { digitOf, okOf } from "./luhn.js";

const DIGITS_RE = /^[0-9]+$/;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// 先结构、再数字串、最后长度；任一不合法立即抛带码异常。
function validate(spec) {
  const ev = spec.event;
  if (!ev || typeof ev !== "object" || Array.isArray(ev)
      || (ev.kind !== "number" && ev.kind !== "check")) {
    throw fail(spec.event_error_code || "E_BAD_EVENT", "event must be {kind, digits}");
  }
  if (typeof ev.digits !== "string" || !DIGITS_RE.test(ev.digits)) {
    throw fail(spec.bad_digits_code || "E_BAD_DIGITS", "digits must be a non-empty numeric string");
  }
  if (ev.kind === "check" && ev.digits.length < 2) {
    throw fail(spec.short_code || "E_TOO_SHORT", "check digits must have at least 2 chars");
  }
}

function cloneState(state) {
  const src = state || {};
  return {
    issued: (src.issued || []).map(function (row) { return [row[0], row[1]]; }),
    checks: (src.checks || []).map(function (row) { return [row[0], row[1]]; }),
    ledger: (src.ledger || []).map(function (row) { return [row[0], row[1]]; }),
    applied: (src.applied || []).slice()
  };
}

function key(kind, digits) {
  return kind + ":" + digits;
}

function applyOne(state, kind, digits) {
  if (kind === "number") {
    state.issued.push([digits, digitOf(digits)]);
  } else {
    state.checks.push([digits, okOf(digits) ? 1 : 0]);
  }
  state.applied.push(key(kind, digits));
}

// 每条事件花一次共用预算；预算用尽后剩余事件连着载压账。
export function step(spec) {
  const events = spec.events || [];
  const state = cloneState(spec.state);
  let remaining = Number.isInteger(spec.budget) ? spec.budget : Math.floor(Number(spec.budget) || 0);
  let served = 0;
  let judged = 0;

  events.forEach(function (event) {
    validate({ event: event,
      event_error_code: spec.event_error_code,
      bad_digits_code: spec.bad_digits_code,
      short_code: spec.short_code });
    const kind = event.kind;
    const digits = event.digits;
    // 重放已处理事件：不新增、不花预算。
    if (state.applied.indexOf(key(kind, digits)) !== -1) {
      return;
    }
    judged += 1;
    if (remaining > 0) {
      remaining -= 1;
      served += 1;
      applyOne(state, kind, digits);
    } else {
      state.ledger.push([kind, digits]);
    }
  });

  return {
    state: state,
    served: served,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map(function (row) { return [row[0], row[1]]; }),
    judged: judged,
    judged_bound: events.length
  };
}

// 不限预算，按顺序把账做完，返回补齐条数。
export function close(spec) {
  const state = cloneState(spec.state);
  let catchup = 0;
  while (state.ledger.length > 0) {
    const row = state.ledger.shift();
    applyOne(state, row[0], row[1]);
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
