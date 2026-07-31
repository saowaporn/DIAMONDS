/**
 * The legacy API accepts arbitrary, loosely-shaped filter payloads with no
 * request validation. These types exist for documentation/editor support only
 * — they are intentionally not decorated with class-validator and must not be
 * run through a strict/whitelisting ValidationPipe, or previously-accepted
 * payloads would start getting rejected.
 */
export type FilterValue = string | number;

export interface RangeOrDiscreteFilter {
  value?: FilterValue;
  values?: FilterValue[];
  min?: FilterValue;
  max?: FilterValue;
}

export type DiscreteFilterInput = FilterValue | FilterValue[] | RangeOrDiscreteFilter;
export type RangeFilterInput = FilterValue | RangeOrDiscreteFilter;

export interface DiamondFilters {
  shape?: DiscreteFilterInput;
  carat?: RangeFilterInput;
  price?: RangeFilterInput;
  certificate?: DiscreteFilterInput;
  clarity?: RangeFilterInput;
  cut?: RangeFilterInput;
  color?: RangeFilterInput;
  polish?: RangeFilterInput;
  symmetry?: RangeFilterInput;
  fluorescence?: RangeFilterInput;
  table?: RangeFilterInput;
  depth?: RangeFilterInput;
  lengthWidthRatio?: RangeFilterInput;
  length_width_ratio?: RangeFilterInput;
  lwRatio?: RangeFilterInput;
}
