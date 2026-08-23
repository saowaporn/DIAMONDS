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

export interface GuideEntry {
  key: string;
  label: string;
  description: string;
}

export const DIAMOND_SHAPE_GUIDE: GuideEntry[] = [
  { key: 'Round', label: 'Round', description: 'The most common diamond shape, generally associated with maximizing brilliance and sparkle.' },
  { key: 'Oval', label: 'Oval', description: 'An elongated round shape that can appear larger than its carat weight suggests.' },
  { key: 'Pear', label: 'Pear', description: 'A teardrop outline combining a rounded end with a pointed end.' },
  { key: 'Emerald', label: 'Emerald', description: 'A rectangular step-cut shape with a distinctive hall-of-mirrors look rather than intense sparkle.' },
  { key: 'Marquise', label: 'Marquise', description: 'An elongated shape with pointed ends, often chosen to maximize apparent size.' },
  { key: 'Radiant', label: 'Radiant', description: 'A rectangular or square shape with cropped corners and brilliant-style facets.' },
  { key: 'Cushion', label: 'Cushion', description: 'A square or rectangular shape with rounded corners, resembling a pillow.' },
  { key: 'Asscher', label: 'Asscher', description: 'A square step-cut shape similar to an emerald cut, with a vintage look.' },
  { key: 'Heart', label: 'Heart', description: 'A heart-shaped outline that relies on precise symmetry.' },
  { key: 'Princess', label: 'Princess', description: 'A square shape with sharp corners and brilliant-style facets.' },
];

export const DIAMOND_CERTIFICATE_GUIDE: GuideEntry[] = [
  { key: 'GIA', label: 'GIA', description: 'Gemological Institute of America — an independent grading laboratory widely used internationally.' },
  { key: 'IGI', label: 'IGI', description: 'International Gemological Institute — an independent grading laboratory used internationally.' },
  { key: 'HRD', label: 'HRD', description: 'A grading laboratory based in Antwerp, Belgium, part of the Antwerp World Diamond Centre.' },
];

export const DIAMOND_CLARITY_GUIDE: GuideEntry[] = [
  { key: 'I2', label: 'I2', description: 'Inclusions are typically visible to the naked eye.' },
  { key: 'I1', label: 'I1', description: 'Inclusions are often visible to the naked eye.' },
  { key: 'SI3', label: 'SI3', description: 'Inclusions are usually visible under magnification, and sometimes without it.' },
  { key: 'SI2', label: 'SI2', description: 'Inclusions are visible under magnification and may be visible without it in some diamonds.' },
  { key: 'SI1', label: 'SI1', description: 'Inclusions are visible under magnification, generally not visible without it.' },
  { key: 'VS2', label: 'VS2', description: 'Inclusions are minor and difficult to see under magnification.' },
  { key: 'VS1', label: 'VS1', description: 'Inclusions are minor and difficult to see under magnification.' },
  { key: 'VVS2', label: 'VVS2', description: 'Inclusions are very difficult to see, even under magnification.' },
  { key: 'VVS1', label: 'VVS1', description: 'Inclusions are very difficult to see, even under magnification.' },
  { key: 'IF', label: 'IF', description: 'No inclusions visible under magnification; only minor surface characteristics, if any.' },
  { key: 'FL', label: 'FL', description: 'No inclusions or surface characteristics visible under magnification.' },
];

export const DIAMOND_CUT_GUIDE: GuideEntry[] = [
  { key: 'FAIR', label: 'Fair', description: "Facet proportions fall outside typical ranges and may noticeably reduce brilliance." },
  { key: 'GOOD', label: 'Good', description: 'Facet proportions are within a reasonable range for solid light performance.' },
  { key: 'VERY GOOD', label: 'Very Good', description: 'Facet proportions reflect most light that enters, offering strong brilliance.' },
  { key: 'EXCELLENT', label: 'Excellent', description: "Facet proportions are optimized for light performance under most labs' criteria." },
  { key: 'IDEAL', label: 'Ideal', description: 'A premium tier some labs use for especially precisely proportioned diamonds; not every lab uses this grade, and criteria can vary by lab and shape.' },
];

export const DIAMOND_COLOR_GUIDE: GuideEntry[] = [
  { key: 'D', label: 'D', description: 'Completely colorless — the highest grade on this scale.' },
  { key: 'E', label: 'E', description: 'Colorless; differences from D are typically only detectable by a gemologist.' },
  { key: 'F', label: 'F', description: 'Colorless; any trace of color is extremely difficult to detect.' },
  { key: 'G', label: 'G', description: 'Near colorless; color is difficult to notice unless compared side-by-side with a higher grade.' },
  { key: 'H', label: 'H', description: 'Near colorless; slight warmth may only be visible in side-by-side comparison.' },
  { key: 'I', label: 'I', description: 'Near colorless; slight warmth can be visible in some settings or lighting.' },
  { key: 'J', label: 'J', description: 'Near colorless with a hint of warmth that may be visible on close inspection.' },
  { key: 'K', label: 'K', description: 'A faint warm tint that is more noticeable, especially in larger diamonds.' },
  { key: 'L', label: 'L', description: 'A noticeable warm tint.' },
  { key: 'M', label: 'M', description: 'A noticeable warm tint, more pronounced than higher grades on this scale.' },
  { key: 'N', label: 'N', description: 'A light yellow or brown tint, the most noticeable on this scale.' },
];

export const DIAMOND_POLISH_GUIDE: GuideEntry[] = [
  { key: 'GOOD', label: 'Good', description: 'Minor surface characteristics from polishing are present but generally not visible without magnification.' },
  { key: 'VERY GOOD', label: 'Very Good', description: 'Only minor, difficult-to-see polish characteristics remain.' },
  { key: 'EXCELLENT', label: 'Excellent', description: 'Facet surfaces show no polish characteristics visible under magnification.' },
];

export const DIAMOND_SYMMETRY_GUIDE: GuideEntry[] = [
  { key: 'GOOD', label: 'Good', description: 'Facets are reasonably well-aligned, with some deviation from ideal placement.' },
  { key: 'VERY GOOD', label: 'Very Good', description: 'Facets are well-aligned with only minor deviations.' },
  { key: 'EXCELLENT', label: 'Excellent', description: 'Facets are precisely aligned with minimal to no deviation.' },
];

export const DIAMOND_FLUORESCENCE_GUIDE: GuideEntry[] = [
  { key: 'VERY STRONG', label: 'Very Strong', description: 'A strong, clearly visible glow under ultraviolet light.' },
  { key: 'STRONG', label: 'Strong', description: 'A noticeable glow under ultraviolet light.' },
  { key: 'MEDIUM', label: 'Medium', description: 'A moderate glow under ultraviolet light, often not noticeable in normal lighting.' },
  { key: 'FAINT', label: 'Faint', description: 'A slight glow under ultraviolet light, not noticeable in normal lighting.' },
  { key: 'NONE', label: 'None', description: 'No noticeable reaction under ultraviolet light.' },
];
