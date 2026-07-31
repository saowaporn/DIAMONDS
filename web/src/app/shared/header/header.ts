import { AfterViewInit, Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VendorLibsService } from '../vendor-libs.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
})
export class Header implements AfterViewInit {
  private readonly announcementSlider = viewChild<ElementRef<HTMLElement>>('announcementSlider');

  constructor(private readonly vendorLibs: VendorLibsService) {}

  ngAfterViewInit(): void {
    const sliderEl = this.announcementSlider()?.nativeElement;
    if (sliderEl) {
      this.vendorLibs.createSwiper(sliderEl, {
        loop: true,
        speed: 600,
        autoplay: { delay: 5000 },
        slidesPerView: 1,
        direction: 'vertical',
        effect: 'slide',
      });
    }

    this.vendorLibs.initMobileNavigation();
  }
}
