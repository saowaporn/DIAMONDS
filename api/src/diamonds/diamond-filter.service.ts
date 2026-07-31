import { Injectable } from '@nestjs/common';
import { FRONTEND_SCALE_MAP, SCALE } from './diamonds.config';
import { isAllFilter, normalizeText, parseNumberOrNull } from '../common/utils/normalizers';
import { DiamondRow } from './diamond-data.service';
import { DiamondFilters, RangeFilterInput, DiscreteFilterInput } from './dto/diamond-filter.dto';

interface NormalizedDiamond {
  shape: string;
  carat: number | null;
  price: number | null;
  certificate: string;
  clarity: string;
  cut: string;
  color: string;
  polish: string;
  symmetry: string;
  fluorescence: string;
  table: number | null;
  depth: number | null;
  lengthWidthRatio: number | null;
}

@Injectable()
export class DiamondFilterService {
  filterRows(rows: DiamondRow[], filters: DiamondFilters = {}): DiamondRow[] {
    return rows.filter((row) => {
      const normalized = this.normalizeDiamondForFiltering(row);

      return (
        this.matchesDiscreteFilter(normalized.shape, filters.shape) &&
        this.matchesRangeFilter(normalized.carat, filters.carat) &&
        this.matchesRangeFilter(normalized.price, filters.price) &&
        this.matchesDiscreteFilter(normalized.certificate, filters.certificate) &&
        this.matchesRangeFilter(normalized.clarity, filters.clarity, { scaleKey: 'clarity' }) &&
        this.matchesRangeFilter(normalized.cut, filters.cut, { scaleKey: 'cut' }) &&
        this.matchesRangeFilter(normalized.color, filters.color, { scaleKey: 'color' }) &&
        this.matchesRangeFilter(normalized.polish, filters.polish, { scaleKey: 'polish' }) &&
        this.matchesRangeFilter(normalized.symmetry, filters.symmetry, { scaleKey: 'symmetry' }) &&
        this.matchesRangeFilter(normalized.fluorescence, filters.fluorescence, { scaleKey: 'fluorescence' }) &&
        this.matchesRangeFilter(normalized.table, filters.table) &&
        this.matchesRangeFilter(normalized.depth, filters.depth) &&
        this.matchesRangeFilter(
          normalized.lengthWidthRatio,
          filters.lengthWidthRatio ?? filters.length_width_ratio ?? filters.lwRatio,
        )
      );
    });
  }

  private normalizeDiamondForFiltering(row: DiamondRow): NormalizedDiamond {
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
      lengthWidthRatio: parseNumberOrNull(row['l/w ratio']),
    };
  }

  private resolveScaleValue(value: unknown, scaleKey: string): number | null {
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

  private matchesDiscreteFilter(value: unknown, filter: DiscreteFilterInput | undefined): boolean {
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

  private matchesRangeFilter(
    value: unknown,
    filter: RangeFilterInput | undefined,
    options: { scaleKey?: string } = {},
  ): boolean {
    if (isAllFilter(filter)) return true;

    const { scaleKey } = options;

    if (scaleKey) {
      const actual = this.resolveScaleValue(value, scaleKey);
      if (actual === null) return false;

      if (typeof filter !== 'object' || Array.isArray(filter)) {
        const expected = this.resolveScaleValue(filter, scaleKey);
        return expected !== null && actual === expected;
      }

      if (Array.isArray(filter.values)) {
        return filter.values.some((item) => actual === this.resolveScaleValue(item, scaleKey));
      }

      if (filter.value !== undefined) {
        const expected = this.resolveScaleValue(filter.value, scaleKey);
        return expected !== null && actual === expected;
      }

      const min = filter.min !== undefined ? this.resolveScaleValue(filter.min, scaleKey) : null;
      const max = filter.max !== undefined ? this.resolveScaleValue(filter.max, scaleKey) : null;

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
}
