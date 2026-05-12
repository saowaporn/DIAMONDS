const { DIAMOND_COLUMN_MAP } = require('../config/diamondConfig');
const { getGoogleSheetsClient } = require('./googleSheetsService');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง
let cache = null;
let cacheExpiresAt = 0;

function toA1ColumnLabel(index) {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  let n = safeIndex + 1;
  let label = '';

  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }

  return label;
}

function buildObjectRowsFromColumnValueRanges(valueRanges, columnMap) {
  const columns = (valueRanges || []).map((range) => range.values || []);
  const maxRows = columns.reduce((max, col) => Math.max(max, col.length), 0);

  return Array.from({ length: Math.max(0, maxRows - 1) }, (_, rowIdx) => {
    const dataRowIdx = rowIdx + 1;
    const row = {};
    columnMap.forEach((entry, colIdx) => {
      row[entry.key] = (columns[colIdx]?.[dataRowIdx]?.[0] || '').toString().trim();
    });
    return row;
  }).filter((row) => Object.values(row).some((value) => value !== ''));
}

async function fetchFromSheets() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.DIAMOND_SHEET_NAME;

  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
  }

  if (!sheetName) {
    throw new Error('Missing DIAMOND_SHEET_NAME in environment variables');
  }

  const sheets = await getGoogleSheetsClient();
  const ranges = DIAMOND_COLUMN_MAP.map(({ columnIndex }) => {
    const col = toA1ColumnLabel(columnIndex);
    return `${sheetName}!${col}:${col}`;
  });

  const response = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });
  return buildObjectRowsFromColumnValueRanges(response.data.valueRanges || [], DIAMOND_COLUMN_MAP);
}

async function loadDiamondRows() {
  const now = Date.now();
  if (cache && now < cacheExpiresAt) {
    return cache;
  }

  const rows = await fetchFromSheets();
  cache = rows;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return rows;
}

function clearDiamondRowsCache() {
  cache = null;
  cacheExpiresAt = 0;
}

module.exports = {
  loadDiamondRows,
  clearDiamondRowsCache
};
