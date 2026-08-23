import { AfterViewInit, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { VendorLibsService } from '../vendor-libs.service';
import { CartService } from '../cart.service';
import { FavoriteService } from '../favorite.service';
import { AuthService } from '../auth.service';
import { LoginModal } from '../login-modal/login-modal';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, LoginModal],
  templateUrl: './header.html',
})
export class Header implements AfterViewInit {
  private readonly announcementSlider = viewChild<ElementRef<HTMLElement>>('announcementSlider');

  readonly cart = inject(CartService);
  readonly favorites = inject(FavoriteService);
  readonly auth = inject(AuthService);
  readonly router = inject(Router);

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
