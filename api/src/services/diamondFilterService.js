const { SCALE, FRONTEND_SCALE_MAP } = require('../config/diamondConfig');
const { normalizeText, parseNumberOrNull, isAllFilter } = require('../utils/normalizers');

function normalizeDiamondForFiltering(row) {
  return {
    ...row,
    shape: normalizeText(row.shape),
    carat: parseNumberOrNull(row.carat),
    price: parseNumberOrNull(row.price),
    certificate: normalizeText(row.lab),
    clarity: normalizeText(row.clarity),
    cut: normalizeText(row.cut),
    color: normalizeText(row.color),
    polish: normalizeText(row.polish),
    symmetry: normalizeText(row.symmetry),
    fluorescence: normalizeText(row.fluorescence),
    table: parseNumberOrNull(row.table),
    depth: parseNumberOrNull(row.td),
    lengthWidthRatio: parseNumberOrNull(row['l/w ratio'])
  };
}

function resolveScaleValue(value, scaleKey) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numeric = parseNumberOrNull(value);
  if (numeric !== null) {
    return numeric;
  }

  const token = normalizeText(value);
  const mappedToken = FRONTEND_SCALE_MAP[scaleKey]?.[token] || token;
  const scale = SCALE[scaleKey] || [];
  const index = scale.indexOf(mappedToken);
  return index === -1 ? null : index;
}

function matchesDiscreteFilter(value, filter) {
  if (isAllFilter(filter)) return true;

  const actual = normalizeText(value);

  if (Array.isArray(filter)) {
    return filter.some((item) => normalizeText(item) === actual);
  }

  if (typeof filter !== 'object') {
    return actual === normalizeText(filter);
  }

  if (Array.isArray(filter.values)) {
    return filter.values.some((item) => normalizeText(item) === actual);
  }

  if (filter.value !== undefined) {
    return actual === normalizeText(filter.value);
  }

  return true;
}

function matchesRangeFilter(value, filter, options = {}) {
  if (isAllFilter(filter)) return true;

  const { scaleKey } = options;

  if (scaleKey) {
    const actual = resolveScaleValue(value, scaleKey);
    if (actual === null) return false;

    if (typeof filter !== 'object' || Array.isArray(filter)) {
      const expected = resolveScaleValue(filter, scaleKey);
      return expected !== null && actual === expected;
    }

    if (Array.isArray(filter.values)) {
      return filter.values.some((item) => actual === resolveScaleValue(item, scaleKey));
    }

    if (filter.value !== undefined) {
      const expected = resolveScaleValue(filter.value, scaleKey);
      return expected !== null && actual === expected;
    }

    const min = filter.min !== undefined ? resolveScaleValue(filter.min, scaleKey) : null;
    const max = filter.max !== undefined ? resolveScaleValue(filter.max, scaleKey) : null;

    if (min === null && max === null) return true;
    if ((filter.min !== undefined && min === null) || (filter.max !== undefined && max === null)) return false;

    const lower = min === null ? null : Math.min(min, max === null ? min : max);
    const upper = max === null ? null : Math.max(max, min === null ? max : min);
    return (lower === null || actual >= lower) && (upper === null || actual <= upper);
  }

  const actual = parseNumberOrNull(value);
  if (actual === null) return false;

  if (typeof filter !== 'object' || Array.isArray(filter)) {
    const expected = parseNumberOrNull(filter);
    return expected !== null && actual === expected;
  }

  if (Array.isArray(filter.values)) {
    return filter.values.some((item) => actual === parseNumberOrNull(item));
  }

  if (filter.value !== undefined) {
    const expected = parseNumberOrNull(filter.value);
    return expected !== null && actual === expected;
  }

  const min = filter.min !== undefined ? parseNumberOrNull(filter.min) : null;
  const max = filter.max !== undefined ? parseNumberOrNull(filter.max) : null;
  if (min === null && max === null) return true;
  if ((filter.min !== undefined && min === null) || (filter.max !== undefined && max === null)) return false;

  const lower = min === null ? null : Math.min(min, max === null ? min : max);
  const upper = max === null ? null : Math.max(max, min === null ? max : min);
  return (lower === null || actual >= lower) && (upper === null || actual <= upper);
}

function filterDiamondRows(rows, filters = {}) {
  return rows.filter((row) => {
    const normalized = normalizeDiamondForFiltering(row);

    return matchesDiscreteFilter(normalized.shape, filters.shape)
      && matchesRangeFilter(normalized.carat, filters.carat)
      && matchesRangeFilter(normalized.price, filters.price)
      && matchesDiscreteFilter(normalized.certificate, filters.certificate)
      && matchesRangeFilter(normalized.clarity, filters.clarity, { scaleKey: 'clarity' })
      && matchesRangeFilter(normalized.cut, filters.cut, { scaleKey: 'cut' })
      && matchesRangeFilter(normalized.color, filters.color, { scaleKey: 'color' })
      && matchesRangeFilter(normalized.polish, filters.polish, { scaleKey: 'polish' })
      && matchesRangeFilter(normalized.symmetry, filters.symmetry, { scaleKey: 'symmetry' })
      && matchesRangeFilter(normalized.fluorescence, filters.fluorescence, { scaleKey: 'fluorescence' })
      && matchesRangeFilter(normalized.table, filters.table)
      && matchesRangeFilter(normalized.depth, filters.depth)
      && matchesRangeFilter(normalized.lengthWidthRatio, filters.lengthWidthRatio ?? filters.length_width_ratio ?? filters.lwRatio);
  });
}

module.exports = {
  filterDiamondRows
};
