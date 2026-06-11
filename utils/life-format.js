// utils/life-format.js

function cleanYearText(value) {
  return String(value || '').trim();
}

function isNegativeYearText(value) {
  return /^-\d+/.test(cleanYearText(value));
}

function formatLifeRange(bYear, dYear, options = {}) {
  const b = cleanYearText(bYear);
  const d = cleanYearText(dYear);
  if (!b && !d) return '';

  const dash = options.dash || '-';
  const birthFallback = options.birthFallback !== undefined ? options.birthFallback : '?';
  const deathFallback = options.deathFallback !== undefined ? options.deathFallback : '?';
  const left = b || birthFallback;
  const right = d || deathFallback;
  const needsSpacing = isNegativeYearText(left) || isNegativeYearText(right);
  let separator = dash;
  if (needsSpacing) {
    const hasLeft = left !== '';
    const hasRight = right !== '';
    if (hasLeft && hasRight) separator = ` ${dash} `;
    else if (hasLeft) separator = ` ${dash}`;
    else if (hasRight) separator = `${dash} `;
  }
  return `${left}${separator}${right}`;
}

module.exports = { formatLifeRange };
