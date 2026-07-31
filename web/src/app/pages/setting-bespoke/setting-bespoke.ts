import { AfterViewInit, Component, ElementRef, Signal, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { PricingService } from '../../shared/pricing.service';
import { ProductSelectionService } from '../../shared/product-selection.service';
import { VendorLibsService } from '../../shared/vendor-libs.service';
import { RingThumbnail, buildRingImagePath, buildRingThumbnails } from '../../shared/ring-images';

interface BespokeOption {
  value: string;
  label: string;
  name: string;
  image: string;
}

const BESPOKE_OPTIONS: BespokeOption[] = [
  { value: 'Pavé_Bridge 8500', label: 'Pavé Bridge - 8,500 B', name: 'Pavé Bridge', image: '/assets/img/product/bespoke/Pave_Bridge.avif' },
  { value: 'Pavé_Band 9500', label: 'Pavé Band - 9,500 B', name: 'Pavé Band', image: '/assets/img/product/bespoke/Pave_Band.avif' },
  { value: 'Hidden_Halo 9500', label: 'Hidden Halo - 9,500 B', name: 'Hidden_Halo', image: '/assets/img/product/bespoke/Hidden_Halo.avif' },
];

const INFO_OPTIONS = [
  { key: 'Pavé_Bridge', title: 'Pavé Bridge (+8,500 ฿)', body: 'การตกแต่งแบบ Pavé Bridge เป็นการฝังเพชรเล็กๆ หลายเม็ดบนตัวแหวนอย่างต่อเนื่อง ทำให้แหวนดูมีความหรูหราและส่องแสงระยิบระยับ เหมาะสำหรับผู้ที่ต้องการความโดดเด่นและความสวยงามที่ละเอียดอ่อน' },
  { key: 'Secret_Halo', title: 'Secret Halo (+7,500 ฿)', body: 'การออกแบบ Secret Halo คือการฝังเพชรเล็กๆ รอบๆ เพชรเม็ดหลักในตำแหน่งที่ซ่อนอยู่ ทำให้เพชรเม็ดหลักดูใหญ่ขึ้นและมีความระยิบระยับมากยิ่งขึ้น โดยไม่ทำให้ดีไซน์ดูซับซ้อนเกินไป' },
  { key: 'Prong_Setting', title: 'Prong Setting (+6,000 ฿)', body: 'การยึดเพชรแบบ Prong Setting เป็นการใช้ตัวยึดโลหะเล็กๆ (Prong) ในการยึดเพชร ทำให้แสงสามารถเข้าถึงเพชรได้มากที่สุด เพชรจึงส่องแสงได้อย่างเต็มที่ และดูสวยงามแบบคลาสสิค' },
  { key: 'Gallery_Wire', title: 'Gallery Wire (+5,500 ฿)', body: 'การตกแต่ง Gallery Wire เป็นการใช้ลวดโลหะที่ประณีตในการสร้างลวดลายที่ละเอียดอ่อนรอบๆ แหวน ให้ความรู้สึกที่คลาสสิคและมีเอกลักษณ์ เหมาะสำหรับผู้ที่ชื่นชอบรายละเอียดที่ซับซ้อน' },
  { key: 'Engraving', title: 'Engraving (+3,000 ฿)', body: 'การแกะสลักข้อความ (Engraving) เป็นการเพิ่มความหมายพิเศษให้กับแหวน สามารถแกะสลักชื่อ วันที่สำคัญ หรือข้อความที่มีความหมายได้ ทำให้แหวนมีเอกลักษณ์และความหมายเฉพาะตัว' },
];

@Component({
  selector: 'app-setting-bespoke',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './setting-bespoke.html',
})
export class SettingBespoke implements AfterViewInit {
  private readonly productSelection = inject(ProductSelectionService);
  private readonly pricing = inject(PricingService);
  private readonly vendorLibs = inject(VendorLibsService);
  private readonly router = inject(Router);

  private readonly mainImage = viewChild<ElementRef<HTMLImageElement>>('mainImage');
  private readonly thumbSwiper = viewChild<ElementRef<HTMLElement>>('thumbSwiper');

  readonly bespokeOptions = BESPOKE_OPTIONS;
  readonly infoOptions = INFO_OPTIONS;

  private readonly selected = this.productSelection.getSelectedProduct();
  private readonly savedRing = this.productSelection.getSelectedRing();

  readonly productName = signal(this.selected?.name || '');
  private readonly basePrice = signal(this.pricing.resolveBasePriceWithFallback(this.selected));
  private readonly gemstonePrice = signal(this.pricing.resolveGemstonePrice(this.savedRing));

  readonly bespokeValue = signal<string | null>(this.savedRing.bespoke || null);
  private readonly bespokePrice = computed(() => {
    const value = this.bespokeValue();
    return value ? this.pricing.resolveBespokePrice({ bespoke: value }) : 0;
  });

  readonly priceDisplay = computed(
    () => `${(this.basePrice() + this.gemstonePrice() + this.bespokePrice()).toLocaleString('th-TH')} B`,
  );

  private readonly currentColor = this.savedRing.color || this.selected?.color || 'Yellow';
  readonly activeThumbImage = signal<string | null>(null);
  readonly thumbnails: Signal<RingThumbnail[]> = computed(() =>
    this.selected?.folder ? buildRingThumbnails(this.selected.folder) : [],
  );

  readonly showModal = signal(false);
  readonly selectedInfoKey = computed(() => this.bespokeValue()?.split(' ')[0] ?? null);

  ngAfterViewInit(): void {
    this.updateMainImage(this.currentColor, 'Top');

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

  selectBespoke(value: string): void {
    this.bespokeValue.set(value);
    this.productSelection.patchSelectedRing({ bespoke: value });
  }

  removeSelection(): void {
    this.bespokeValue.set(null);
    const ring = this.productSelection.getSelectedRing();
    delete ring.bespoke;
    this.productSelection.setSelectedRing(ring);
  }

  showBespokeInfo(): void {
    this.showModal.set(true);
  }

  closeBespokeInfo(): void {
    this.showModal.set(false);
  }

  goTo(path: string): void {
    this.router.navigateByUrl(path);
  }

  onNext(): void {
    this.router.navigateByUrl('/setting/summary');
  }
}
