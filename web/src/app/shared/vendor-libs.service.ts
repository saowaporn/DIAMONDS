import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class VendorLibsService {
  private readonly platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  toggleScrolled(): void {
    if (!this.isBrowser) return;

    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectBody || !selectHeader) return;
    if (
      !selectHeader.classList.contains('scroll-up-sticky') &&
      !selectHeader.classList.contains('sticky-top') &&
      !selectHeader.classList.contains('fixed-top')
    ) {
      return;
    }

    if (window.scrollY > 100) {
      selectBody.classList.add('scrolled');
    } else {
      selectBody.classList.remove('scrolled');
    }
  }

  initGlobalBehaviors(): void {
    if (!this.isBrowser) return;

    document.addEventListener('scroll', () => this.toggleScrolled());
    this.toggleScrolled();

    const preloader = document.querySelector('#preloader');
    if (preloader) {
      preloader.remove();
    }

    const scrollTop = document.querySelector<HTMLElement>('.scroll-top');
    if (scrollTop) {
      const toggleScrollTop = () => {
        if (window.scrollY > 100) {
          scrollTop.classList.add('active');
        } else {
          scrollTop.classList.remove('active');
        }
      };

      scrollTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      document.addEventListener('scroll', toggleScrollTop);
      toggleScrollTop();
    }

    this.initAos();
  }

  initAos(): void {
    if (!this.isBrowser || !window.AOS) return;

    const runInit = () => {
      window.AOS?.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        mirror: false,
      });
    };

    // Matches the original main.js timing (bound to window 'load'): AOS needs final,
    // settled layout to correctly detect which elements already start in the viewport.
    if (document.readyState === 'complete') {
      runInit();
    } else {
      window.addEventListener('load', runInit, { once: true });
    }
  }

  initMobileNavigation(): void {
    if (!this.isBrowser) return;

    const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

    if (mobileNavToggleBtn) {
      const newBtn = mobileNavToggleBtn.cloneNode(true) as Element;
      mobileNavToggleBtn.parentNode?.replaceChild(newBtn, mobileNavToggleBtn);

      newBtn.addEventListener('click', () => {
        document.querySelector('body')?.classList.toggle('mobile-nav-active');
        newBtn.classList.toggle('bi-list');
        newBtn.classList.toggle('bi-x');
      });
    }

    document.querySelectorAll('#navmenu a').forEach((navItem) => {
      navItem.addEventListener('click', () => {
        if (document.querySelector('.mobile-nav-active')) {
          const mobileNavBtn = document.querySelector('.mobile-nav-toggle');
          document.querySelector('body')?.classList.remove('mobile-nav-active');
          mobileNavBtn?.classList.remove('bi-x');
          mobileNavBtn?.classList.add('bi-list');
        }
      });
    });

    document.querySelectorAll('.navmenu .toggle-dropdown').forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = (toggle as HTMLElement).parentNode as HTMLElement | null;
        parent?.classList.toggle('active');
        (parent?.nextElementSibling as HTMLElement | null)?.classList.toggle('dropdown-active');
        e.stopImmediatePropagation();
      });
    });
  }

  createSwiper(element: Element, config: Record<string, unknown>): void {
    if (!this.isBrowser || !window.Swiper) return;
    new window.Swiper(element, config);
  }

  createDrift(element: Element, options: Record<string, unknown>): void {
    if (!this.isBrowser || !window.Drift) return;
    new window.Drift(element, options);
  }

  initProductImageZoom(imageEl: HTMLImageElement): void {
    if (!this.isBrowser) return;

    this.createDrift(imageEl, {
      paneContainer: document.querySelector('.image-zoom-container'),
      inlinePane: window.innerWidth < 768,
      inlineOffsetY: -85,
      containInline: true,
      hoverBoundingBox: false,
      zoomFactor: 1.7,
      handleTouch: false,
    });
  }

  createIsotope(element: Element, options: Record<string, unknown>): IsotopeInstance | null {
    if (!this.isBrowser || !window.Isotope) return null;
    return new window.Isotope(element, options);
  }

  imagesLoaded(element: Element, onProgress: () => void): void {
    if (!this.isBrowser || !window.imagesLoaded) return;
    window.imagesLoaded(element).on('progress', onProgress);
  }
}
