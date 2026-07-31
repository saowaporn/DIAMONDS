export interface NumberRange {
  min: number;
  max: number;
}

export interface ScaleValuesFilter {
  values: string[];
}

export interface DiamondFilters {
  carat?: NumberRange;
  price?: NumberRange;
  color?: ScaleValuesFilter;
  clarity?: 'ALL' | ScaleValuesFilter;
  cut?: 'ALL' | ScaleValuesFilter;
  polish?: 'ALL' | ScaleValuesFilter;
  symmetry?: 'ALL' | ScaleValuesFilter;
  fluorescence?: 'ALL' | ScaleValuesFilter;
  certificate?: 'ALL' | string;
  table?: NumberRange;
  depth?: NumberRange;
  lwRatio?: NumberRange;
}
