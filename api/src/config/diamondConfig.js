const DIAMOND_COLUMN_MAP = Object.freeze([
  { columnIndex: 0, key: 'id' },
  { columnIndex: 3, key: 'video' },
  { columnIndex: 4, key: 'image' },
  { columnIndex: 5, key: 'certificate' },
  { columnIndex: 7, key: 'shape' },
  { columnIndex: 8, key: 'carat' },
  { columnIndex: 9, key: 'color' },
  { columnIndex: 10, key: 'clarity' },
  { columnIndex: 17, key: 'price' },
  { columnIndex: 18, key: 'cut' },
  { columnIndex: 19, key: 'polish' },
  { columnIndex: 20, key: 'symmetry' },
  { columnIndex: 21, key: 'fluorescence' },
  { columnIndex: 22, key: 'lab' },
  { columnIndex: 23, key: 'certificateNo' },
  { columnIndex: 24, key: 'table' },
  { columnIndex: 25, key: 'td' },
  { columnIndex: 26, key: 'measurement' },
  { columnIndex: 27, key: 'bit' },
  { columnIndex: 28, key: 'bc' },
  { columnIndex: 29, key: 'wt' },
  { columnIndex: 30, key: 'wc' },
  { columnIndex: 31, key: 'milky' },
  { columnIndex: 32, key: 'l/w ratio' },
  { columnIndex: 33, key: 'comment' }
]);

const DIAMOND_RESPONSE_GROUPS = Object.freeze({
  media: ['image', 'video'],
  certificate: ['certificate', 'lab', 'certificateNo'],
  quality: ['polish', 'symmetry', 'fluorescence', 'table', 'td', 'l/w ratio'],
  details: ['measurement', 'bit', 'bc', 'wt', 'wc', 'milky'],
  notes: ['comment']
});

const SCALE = Object.freeze({
  color: ['N','M','L','K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'],
  clarity: ['I2','I1', 'SI3','SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'],
  cut: ['F', 'G', 'VG', 'EX', 'IDEAL'],
  polish: ['G', 'VG', 'EX', 'IDEAL'],
  symmetry: ['G', 'VG', 'EX', 'IDEAL'],
  fluorescence: ['VS', 'ST', 'M', 'F', 'N']
});

const FRONTEND_SCALE_MAP = Object.freeze({
  cut: Object.freeze({
    FAIR: 'F',
    GOOD: 'G',
    'VERY GOOD': 'VG',
    EXCELLENT: 'EX',
    IDEAL: 'IDEAL'
  }),
  polish: Object.freeze({
    GOOD: 'G',
    'VERY GOOD': 'VG',
    EXCELLENT: 'EX',
    IDEAL: 'IDEAL'
  }),
  symmetry: Object.freeze({
    GOOD: 'G',
    'VERY GOOD': 'VG',
    EXCELLENT: 'EX',
    IDEAL: 'IDEAL'
  }),
  fluorescence: Object.freeze({
    'VERY STRONG': 'VS',
    STRONG: 'ST',
    MEDIUM: 'M',
    FAINT: 'F',
    NONE: 'N'
  })
});

module.exports = {
  DIAMOND_COLUMN_MAP,
  DIAMOND_RESPONSE_GROUPS,
  SCALE,
  FRONTEND_SCALE_MAP
};
