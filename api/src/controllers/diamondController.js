const { loadDiamondRows, clearDiamondRowsCache } = require('../services/diamondDataService');
const { filterDiamondRows } = require('../services/diamondFilterService');
const { formatDiamondRow } = require('../services/diamondFormatService');
const { normalizeText } = require('../utils/normalizers');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function resolveRequiredDiamondShape(req) {
  const shape = normalizeText(req.params?.shape);
  const bodyShape = normalizeText(req.body?.shape);

  if (!shape || shape === 'ALL' || shape === 'ANY' || shape === '*') {
    return null;
  }

  if (bodyShape) {
    return { error: 'Do not send shape in body. Shape must be provided in URL path only.' };
  }

  return { shape };
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function resolvePagination(query = {}) {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  const requestedLimit = parsePositiveInt(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
}

async function handleDiamondRequest(req, res, filters) {
  try {
    const shapeState = resolveRequiredDiamondShape(req);
    if (!shapeState) {
      return res.status(400).json({
        status: 'error',
        message: 'Shape is required in URL path. Example: /api/products/diamonds/ROUND'
      });
    }

    if (shapeState.error) {
      return res.status(400).json({
        status: 'error',
        message: shapeState.error
      });
    }

    const { page, limit, offset } = resolvePagination(req.query);
    const diamonds = await loadDiamondRows();
    const filtered = filterDiamondRows(diamonds, {
      ...(filters || {}),
      shape: shapeState.shape
    });

    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const pageData = filtered.slice(offset, offset + limit);

    return res.json({
      status: 'success',
      count: pageData.length,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      data: pageData.map(formatDiamondRow)
    });
  } catch (error) {
    const googleErrorMessage = error.response?.data?.error?.message;
    console.error('Error reading diamond products:', googleErrorMessage || error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to load diamond data from Google Sheet'
    });
  }
}

async function getDiamondsByShape(req, res) {
  return handleDiamondRequest(req, res, {});
}

async function filterDiamondsByShape(req, res) {
  return handleDiamondRequest(req, res, req.body || {});
}

async function clearDiamondCache(req, res) {
  clearDiamondRowsCache();

  return res.json({
    status: 'success',
    message: 'Diamond cache cleared'
  });
}

module.exports = {
  getDiamondsByShape,
  filterDiamondsByShape,
  clearDiamondCache
};
