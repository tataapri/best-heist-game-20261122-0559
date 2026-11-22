// A tiny seeded random generator (mulberry32) so a screenshot run with a
// fixed seed stages the same room every time. Nothing here touches the
// network or the DOM; it is pure arithmetic.

export function makeSeededRandom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(random, list) {
  return list[Math.floor(random() * list.length)];
}

export function jitter(random, amount) {
  return (random() * 2 - 1) * amount;
}
