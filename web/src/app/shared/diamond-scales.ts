export const DIAMOND_COLOR_SCALE = ['N', 'M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'];
export const DIAMOND_CLARITY_SCALE = ['I2', 'I1', 'SI3', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'];
export const DIAMOND_CUT_SCALE = ['FAIR', 'GOOD', 'VERY GOOD', 'EXCELLENT', 'IDEAL'];
export const DIAMOND_POLISH_SCALE = ['GOOD', 'VERY GOOD', 'EXCELLENT'];
export const DIAMOND_SYMMETRY_SCALE = ['GOOD', 'VERY GOOD', 'EXCELLENT'];
export const DIAMOND_FLUORESCENCE_SCALE = ['VERY STRONG', 'STRONG', 'MEDIUM', 'FAINT', 'NONE'];

export interface RangeConfig {
  range: [number, number];
  step: number;
}

export const CARAT_CONFIG: RangeConfig = { range: [0, 12], step: 0.01 };
export const PRICE_CONFIG: RangeConfig = { range: [0, 2000000], step: 1 };
export const TABLE_CONFIG: RangeConfig = { range: [50, 90], step: 1 };
export const DEPTH_CONFIG: RangeConfig = { range: [40, 90], step: 1 };
export const LW_RATIO_CONFIG: RangeConfig = { range: [0.8, 2.2], step: 0.01 };

export const DIAMOND_SHAPES = ['Round', 'Oval', 'Pear', 'Emerald', 'Marquise', 'Radiant', 'Cushion'] as const;
