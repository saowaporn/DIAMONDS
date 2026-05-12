function normalizeText(value) {
  return (value || '').toString().trim().toUpperCase();
}

function parseNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = value
    .toString()
    .trim()
    .replace(/,/g, '')
    .replace(/[^0-9.-]/g, '');

  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
    return null;
  }

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function isAllFilter(filter) {
  return filter === undefined
    || filter === null
    || filter === ''
    || (typeof filter === 'string' && normalizeText(filter) === 'ALL');
}

module.exports = {
  normalizeText,
  parseNumberOrNull,
  isAllFilter
};
