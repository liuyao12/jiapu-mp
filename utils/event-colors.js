const FIXED_EVENT_TONES = Object.freeze({
  '\u7687\u5e1d': 'imperial',
  '\u592a\u5b50': 'crown-prince',
  '\u7687\u540e': 'empress',
  '\u8d35\u5983': 'noble-consort',
  '\u4e34\u671d\u79f0\u5236': 2
});

function eventNameOf(event) {
  if (typeof event === 'string') return event;
  if (!event || typeof event !== 'object') return '';
  return event.name || event.label || event.title || '';
}

function normalizeTone(tone, paletteSize) {
  const size = Math.max(1, Number(paletteSize) || 3);
  const value = Number(tone);
  if (!Number.isFinite(value)) return null;
  return ((Math.trunc(value) % size) + size) % size;
}

function getFixedEventTone(name, paletteSize = 3) {
  const key = String(name || '').trim();
  if (!Object.prototype.hasOwnProperty.call(FIXED_EVENT_TONES, key)) return null;
  const tone = FIXED_EVENT_TONES[key];
  if (typeof tone === 'string') return tone;
  return normalizeTone(tone, paletteSize);
}

function hashEventName(name, paletteSize = 3) {
  const size = Math.max(1, Number(paletteSize) || 3);
  const text = String(name || '').trim();
  let hash = 2166136261;
  Array.from(text).forEach(char => {
    hash ^= char.codePointAt(0) || 0;
    hash = Math.imul(hash, 16777619);
  });
  return normalizeTone(hash, size);
}

function getEventTone(name, paletteSize = 3) {
  const fixedTone = getFixedEventTone(name, paletteSize);
  if (fixedTone !== null) return fixedTone;
  return hashEventName(name, paletteSize);
}

function resolveEventTone(event, paletteSize = 3) {
  const fixedTone = getFixedEventTone(eventNameOf(event), paletteSize);
  if (fixedTone !== null) return fixedTone;
  const explicitTone = normalizeTone(event && event.tone, paletteSize);
  if (explicitTone !== null) return explicitTone;
  return hashEventName(eventNameOf(event), paletteSize);
}

function makeEventTonePicker(events = [], paletteSize = 3) {
  const size = Math.max(1, Number(paletteSize) || 3);
  const names = Array.from(new Set((Array.isArray(events) ? events : [])
    .map(eventNameOf)
    .map(name => String(name || '').trim())
    .filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const assigned = new Map();
  const usedNumericTones = new Set();

  names.forEach(name => {
    const fixedTone = getFixedEventTone(name, size);
    if (fixedTone === null) return;
    assigned.set(name, fixedTone);
    if (typeof fixedTone !== 'string') usedNumericTones.add(fixedTone);
  });

  names.forEach(name => {
    if (assigned.has(name)) return;
    const preferredTone = hashEventName(name, size);
    let tone = preferredTone;
    for (let offset = 0; offset < size; offset += 1) {
      const candidate = (preferredTone + offset) % size;
      if (!usedNumericTones.has(candidate)) {
        tone = candidate;
        break;
      }
    }
    assigned.set(name, tone);
    usedNumericTones.add(tone);
  });

  return function pickEventTone(name) {
    const key = String(name || '').trim();
    if (assigned.has(key)) return assigned.get(key);
    return getEventTone(name, size);
  };
}

module.exports = {
  getFixedEventTone,
  getEventTone,
  resolveEventTone,
  makeEventTonePicker
};
