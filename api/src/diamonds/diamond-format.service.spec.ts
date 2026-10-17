import { DiamondFormatService } from './diamond-format.service';

describe('DiamondFormatService', () => {
  it('keeps the grading lab but excludes certificate links and numbers from the public response', () => {
    const formatted = new DiamondFormatService().formatRow({
      id: 'S0000001',
      image: 'https://example.com/diamond.jpg',
      lab: 'GIA',
      certificate: 'https://example.com/private-certificate',
      certificateNo: '1548671019',
    });

    expect(formatted).toEqual({
      id: 'S0000001',
      media: { image: 'https://example.com/diamond.jpg' },
      certificate: { lab: 'GIA' },
    });
  });
});
