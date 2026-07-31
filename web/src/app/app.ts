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
    });
  }

  ngAfterViewInit(): void {
    this.vendorLibs.initGlobalBehaviors();
  }
}
