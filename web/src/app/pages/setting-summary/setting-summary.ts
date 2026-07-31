import { AfterViewInit, Component, ElementRef, Signal, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { PricingService } from '../../shared/pricing.service';
import { ProductSelectionService } from '../../shared/product-selection.service';
import { VendorLibsService } from '../../shared/vendor-libs.service';
import { RingThumbnail, buildRingImagePath, buildRingThumbnails } from '../../shared/ring-images';

const SHAPE_LIST = ['Cushion', 'Emerald', 'Marquise', 'Oval', 'Pear', 'Radiant', 'Round'];

@Component({
  selector: 'app-setting-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './setting-summary.html',
})
export class SettingSummary implements AfterViewInit {
  private readonly productSelection = inject(ProductSelectionService);
  private readonly pricing = inject(PricingService);
  private readonly vendorLibs = inject(VendorLibsService);
  private readonly router = inject(Router);

  private readonly mainImage = viewChild<ElementRef<HTMLImageElement>>('mainImage');
  private readonly thumbSwiper = viewChild<ElementRef<HTMLElement>>('thumbSwiper');

  private readonly selectedProduct = this.productSelection.getSelectedProduct();
  private readonly selectedRing = this.productSelection.getSelectedRing();

  readonly basePrice = signal(this.pricing.resolveBasePriceStrict(this.selectedProduct));
  readonly gemstonePrice = signal(this.pricing.resolveGemstonePrice(this.selectedRing));
  readonly bespokePrice = signal(this.pricing.resolveBespokePrice(this.selectedRing));
  readonly totalPrice = computed(() => this.basePrice() + this.gemstonePrice() + this.bespokePrice());

  readonly settingName = computed(() => this.selectedProduct?.name || '-');

  readonly metalType = computed(() => {
    const color = this.selectedRing.color || this.selectedProduct?.color || 'Yellow';
    return `${color} Gold`;
  });

  readonly metalKarat = computed(() => this.selectedRing.metal || '-');
  readonly ringSize = computed(() => (this.selectedRing.ringsize ? `${this.selectedRing.ringsize} mm` : '-'));

  readonly bespokeOptions = computed(() => {
    const bespoke = this.selectedRing.bespoke;
    if (!bespoke) return 'None';
    const namePart = bespoke.split(' ')[0] || '';
    return namePart.replace(/_/g, ' ');
  });

  private readonly gemstoneParts = computed(() => this.selectedRing.gemstone?.split(' ') ?? null);
  readonly gemstoneName = computed(() => (this.gemstoneParts() ? 'Lab Grown Diamond ' : '-'));
  readonly gemstoneCarat = computed(() => {
    const parts = this.gemstoneParts();
    return parts ? `${parts[0]} ct` : '-';
  });
  readonly gemstoneType = computed(() => (this.gemstoneParts() ? 'CVD' : '-'));
  readonly gemstoneClarity = computed(() => (this.gemstoneParts() ? 'VS1' : '-'));

  readonly gemstoneShape = computed(() => {
    const name = this.selectedProduct?.name;
    if (!name) return '-';
    return SHAPE_LIST.find((shape) => name.includes(shape)) || '-';
  });

  readonly activeThumbImage = signal<string | null>(null);
  readonly thumbnails: Signal<RingThumbnail[]> = computed(() =>
    this.selectedProduct?.folder ? buildRingThumbnails(this.selectedProduct.folder) : [],
  );

  ngAfterViewInit(): void {
    if (!this.selectedProduct?.folder) return;

    const color = this.selectedRing.color || this.selectedProduct.color || 'Yellow';
    this.updateMainImage(color, 'Top');

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
    const src = buildRingImagePath(this.selectedProduct?.folder, color, position);
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

  goTo(path: string): void {
    this.router.navigateByUrl(path);
  }
}
