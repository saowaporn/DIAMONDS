import { AfterViewInit, Component, ElementRef, Signal, computed, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink, Router } from '@angular/router';
import { PricingService } from '../../shared/pricing.service';
import { ProductSelectionService } from '../../shared/product-selection.service';
import { VendorLibsService } from '../../shared/vendor-libs.service';
import { RingThumbnail, buildRingImagePath, buildRingThumbnails } from '../../shared/ring-images';

interface GemstoneOption {
  value: string;
  label: string;
}

const GEMSTONE_OPTIONS: GemstoneOption[] = [
  { value: '0.50 18500', label: '0.50 ct | 18,500.00 B' },
  { value: '1.00 23900', label: '1.00 ct | 23,900.00 B' },
  { value: '1.25 25900', label: '1.25 ct | 25,900.00 B' },
  { value: '1.50 32500', label: '1.50 ct | 32,500.00 B' },
  { value: '1.80 34900', label: '1.80 ct | 34,900.00 B' },
  { value: '2.00 39900', label: '2.00 ct | 39,900.00 B' },
  { value: '2.50 47900', label: '2.50 ct | 47,900.00 B' },
  { value: '3.00 57900', label: '3.00 ct | 57,900.00 B' },
  { value: '4.00 75900', label: '4.00 ct | 75,900.00 B' },
  { value: '5.00 102500', label: '5.00 ct | 102,500.00 B' },
];

const INFO_CONTENT: Record<string, { title: string; body: string }> = {
  metal: {
    title: 'Metal Karat Information',
    body: `
      <div class="info-option-detail">
        <h4>9 Karat Gold</h4>
        <p>9K gold contains 37.5% pure gold, making it the most affordable option. It's durable and suitable for everyday wear, though it may tarnish slightly over time. Perfect for those looking for gold jewelry on a budget.</p>
      </div>
      <div class="info-option-detail">
        <h4>14 Karat Gold</h4>
        <p>14K gold contains 58.3% pure gold, offering a perfect balance between durability and purity. It's resistant to tarnishing and scratching, making it ideal for engagement rings and daily wear jewelry. Most popular choice for fine jewelry.</p>
      </div>
      <div class="info-option-detail">
        <h4>18 Karat Gold</h4>
        <p>18K gold contains 75% pure gold, providing the richest color and highest purity suitable for jewelry. It's softer than lower karat gold but offers superior quality and appearance. Preferred for luxury and heirloom pieces.</p>
      </div>
    `,
  },
  ringsize: {
    title: 'Ring Size Guide',
    body: `
      <div class="info-option-detail">
        <h4>How to Measure Your Ring Size</h4>
        <p>The most accurate way to determine your ring size is to visit a jeweler for professional measurement. Alternatively, you can measure an existing ring or use our ring size guide.</p>
      </div>
      <div class="info-option-detail">
        <h4>Size Chart (Thai/Asian Sizes)</h4>
        <p><strong>Size 47:</strong> Circumference 47mm (US size 4)<br>
        <strong>Size 48:</strong> Circumference 48mm (US size 4.5)<br>
        <strong>Size 49:</strong> Circumference 49mm (US size 5)<br>
        <strong>Size 50:</strong> Circumference 50mm (US size 5.5)<br>
        <strong>Size 51:</strong> Circumference 51mm (US size 6)<br>
        <strong>Size 52:</strong> Circumference 52mm (US size 6.5)<br>
        <strong>Size 53:</strong> Circumference 53mm (US size 7)<br>
        <strong>Size 54:</strong> Circumference 54mm (US size 7.5)</p>
      </div>
      <div class="info-option-detail">
        <h4>Important Tips</h4>
        <p>Ring size can vary slightly throughout the day due to temperature and humidity. For the most accurate measurement, measure your finger at room temperature in the evening. Consider the width of the band - wider rings typically need a slightly larger size.</p>
      </div>
    `,
  },
  gemstone: {
    title: 'Gemstone Information',
    body: `
      <div class="info-option-detail">
        <h4>Diamond Quality & Pricing</h4>
        <p>Our diamonds are carefully selected for their exceptional quality. Each diamond is graded based on the 4Cs: Cut, Color, Clarity, and Carat weight. All prices include certification and premium setting.</p>
      </div>
      <div class="info-option-detail">
        <h4>Carat Weight Guide</h4>
        <p><strong>0.50 ct:</strong> Perfect for delicate, elegant settings<br>
        <strong>1.00 ct:</strong> Classic size, most popular choice<br>
        <strong>1.25-1.50 ct:</strong> Statement piece with excellent presence<br>
        <strong>1.80-2.00 ct:</strong> Luxury size for special occasions<br>
        <strong>2.50+ ct:</strong> Exceptional rare diamonds for collectors</p>
      </div>
      <div class="info-option-detail">
        <h4>Price Variations</h4>
        <p>Diamond prices increase exponentially with carat weight due to rarity. Each size represents carefully selected diamonds with excellent cut quality to maximize brilliance and fire. Prices include professional setting and certification.</p>
      </div>
    `,
  },
};

@Component({
  selector: 'app-setting-custom',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './setting-custom.html',
})
export class SettingCustom implements AfterViewInit {
  private readonly productSelection = inject(ProductSelectionService);
  private readonly pricing = inject(PricingService);
  private readonly vendorLibs = inject(VendorLibsService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly mainImage = viewChild<ElementRef<HTMLImageElement>>('mainImage');
  private readonly thumbSwiper = viewChild<ElementRef<HTMLElement>>('thumbSwiper');

  readonly karatOptions = ['9 K', '14 K', '18 K'];
  readonly ringSizeOptions = ['47', '48', '49', '50', '51', '52', '53', '54'];
  readonly gemstoneOptions = GEMSTONE_OPTIONS;

  private readonly selected = this.productSelection.getSelectedProduct();

  readonly productName = signal(this.selected?.name || '');
  private readonly basePrice = signal(this.pricing.resolveBasePriceWithFallback(this.selected));

  readonly currentColor = signal(this.resolveInitialColor());
  readonly karat = signal<string | null>(null);
  readonly ringSize = signal<string | null>(null);
  readonly gemstoneValue = signal<string | null>(null);
  readonly gemstoneLabel = computed(
    () => this.gemstoneOptions.find((o) => o.value === this.gemstoneValue())?.label ?? null,
  );

  readonly openDropdown = signal<string | null>(null);
  readonly infoModal = signal<{ title: string; body: SafeHtml } | null>(null);

  readonly activeThumbImage = signal<string | null>(null);
  readonly thumbnails: Signal<RingThumbnail[]> = computed(() =>
    this.selected?.folder ? buildRingThumbnails(this.selected.folder) : [],
  );

  private readonly gemstonePrice = computed(() => {
    const value = this.gemstoneValue();
    return value ? this.pricing.resolveGemstonePrice({ gemstone: value }) : 0;
  });

  readonly priceDisplay = computed(() => `${(this.basePrice() + this.gemstonePrice()).toLocaleString('th-TH')} B`);

  constructor() {
    // Every visit resets prior dropdown selections, keeping only color — matches Setting_Custom.html's behavior.
    this.productSelection.setSelectedRing({ color: this.currentColor() });
  }

  private resolveInitialColor(): string {
    return this.selected?.color || this.productSelection.getSelectedRing().color || 'Yellow';
  }

  ngAfterViewInit(): void {
    this.updateMainImage(this.currentColor(), 'Top');

    const swiperEl = this.thumbSwiper()?.nativeElement;
    if (swiperEl) {
      this.vendorLibs.createSwiper(swiperEl, {
        loop: false,
        speed: 400,
        slidesPerView: 4,
        spaceBetween: 10,
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: { 320: { slidesPerView: 3 }, 576: { slidesPerView: 4 } },
      });
    }
  }

  private updateMainImage(color: string, position: string): void {
    const src = buildRingImagePath(this.selected?.folder, color, position);
    this.activeThumbImage.set(src);

    const img = this.mainImage()?.nativeElement;
    if (img) {
      img.src = src;
      img.setAttribute('data-zoom', src);
      this.vendorLibs.initProductImageZoom(img);
    }
  }

  onThumbnailClick(thumb: RingThumbnail): void {
    this.updateMainImage(thumb.color, thumb.position);
  }

  selectColor(color: string): void {
    this.currentColor.set(color);
    this.productSelection.patchSelectedRing({ color });
    this.updateMainImage(color, 'Top');
  }

  toggleDropdown(id: string): void {
    this.openDropdown.set(this.openDropdown() === id ? null : id);
  }

  selectKarat(value: string): void {
    this.karat.set(value);
    this.productSelection.patchSelectedRing({ metal: value });
    this.openDropdown.set(null);
  }

  selectRingSize(value: string): void {
    this.ringSize.set(value);
    this.productSelection.patchSelectedRing({ ringsize: value });
    this.openDropdown.set(null);
  }

  selectGemstone(option: GemstoneOption): void {
    this.gemstoneValue.set(option.value);
    this.productSelection.patchSelectedRing({ gemstone: option.value });
    this.openDropdown.set(null);
  }

  showInfo(key: string): void {
    const content = INFO_CONTENT[key];
    if (!content) return;
    this.infoModal.set({ title: content.title, body: this.sanitizer.bypassSecurityTrustHtml(content.body) });
  }

  closeInfo(): void {
    this.infoModal.set(null);
  }

  onNext(): void {
    const missing: string[] = [];
    if (!this.karat()) missing.push('Metal Karat');
    if (!this.ringSize()) missing.push('Ring Size');
    if (!this.gemstoneValue()) missing.push('Gemstone');
    if (!this.currentColor()) missing.push('Precious Metal Type');

    if (missing.length) {
      const message =
        'Please complete all selections before proceeding to the next step:\n\n' +
        missing.map((item) => `• ${item}\n`).join('') +
        '\nKindly review and select the missing options above.';
      alert(message);
      return;
    }

    this.router.navigateByUrl('/setting/bespoke');
  }
}
