import { AfterViewInit, Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { VendorLibsService } from './shared/vendor-libs.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
})
export class App implements AfterViewInit {
  readonly showChrome = signal(true);

  constructor(
    private readonly vendorLibs: VendorLibsService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
  ) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      let route = this.activatedRoute;
      while (route.firstChild) {
        route = route.firstChild;
      }
      this.showChrome.set(!route.snapshot.data['hideChrome']);

      // The global `scroll-behavior: smooth` on :root (main.css) turns the router's
      // scroll-to-top into an animated scroll, which gets cancelled by layout shifts
      // from async content loading on these pages (e.g. isotope/diamond images) and
      // never actually reaches the top. Force it instant here instead.
      if (this.vendorLibs.isBrowser) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    });
  }

  ngAfterViewInit(): void {
    this.vendorLibs.initGlobalBehaviors();
  }
}
