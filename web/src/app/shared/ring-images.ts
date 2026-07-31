const FOLDER_MAPPING: Record<string, string> = {
  'Cushion Cut Diamond Solitaire Ring_19000_New': 'Cushion Cut Diamond Solitaire Ring_19000_Cushion',
  'Marquise with Pear Diamonds Trilogy Ring_29000_Pre Order': 'Marquise with Pear Diamonds Trilogy Ring_29000_Marquise',
  'Oval Cut Diamond Solitaire Ring_19000': 'Oval Cut Diamond Solitaire Ring_19000_Oval',
  'Pear Curved Solitaire Ring_19000': 'Pear Curved Solitaire Ring_19000_Pear',
  'Round Diamond Trilogy Ring_29000': 'Round Diamond Trilogy Ring_29000_Round',
};

export const RING_COLORS = ['Yellow', 'White', 'Rose'];
export const RING_POSITIONS = ['Top', 'Front'];

export function findMatchingFolder(bestSellerFolder: string | undefined): string {
  return FOLDER_MAPPING[bestSellerFolder || ''] || bestSellerFolder || '';
}

export function buildRingImagePath(folder: string | undefined, color: string, position = 'Top'): string {
  const actualFolder = findMatchingFolder(folder);
  return `/assets/img/product/Jewelry/Women_s Rings/${actualFolder}/${position}_${color}.webp`;
}

export interface RingThumbnail {
  image: string;
  color: string;
  position: string;
}

export function buildRingThumbnails(folder: string | undefined): RingThumbnail[] {
  const thumbnails: RingThumbnail[] = [];
  RING_POSITIONS.forEach((position) => {
    RING_COLORS.forEach((color) => {
      thumbnails.push({ image: buildRingImagePath(folder, color, position), color, position });
    });
  });
  return thumbnails;
}
