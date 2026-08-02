import { AfterViewInit, Component, ElementRef, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DiamondApiService, DiamondApiResponse } from '../../shared/diamond-api.service';
import { ProductSelectionService } from '../../shared/product-selection.service';
import { SettingSelectionService } from '../../shared/setting-selection.service';
import { VendorLibsService } from '../../shared/vendor-libs.service';
import { DiamondFilters, NumberRange } from '../../shared/diamond-filters.model';
import {
  CARAT_CONFIG,
  DEPTH_CONFIG,
  DIAMOND_CLARITY_SCALE,
  DIAMOND_COLOR_SCALE,
  DIAMOND_CUT_SCALE,
  DIAMOND_FLUORESCENCE_SCALE,
  DIAMOND_POLISH_SCALE,
  DIAMOND_SYMMETRY_SCALE,
  LW_RATIO_CONFIG,
  PRICE_CONFIG,
  RangeConfig,
  TABLE_CONFIG,
} from '../../shared/diamond-scales';

interface OrdinalRange {
  min: number;
  max: number;
}

const PRODUCT_BATCH_SIZE = 20;
const API_PAGE_SIZE = 50;

function formatPrice(price: number): string {
  return Number(price).toLocaleString('en-US');
}

function parsePriceNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function parseInputNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

@Component({
  selector: 'app-engagement-ring',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './engagement-ring.html',
})
export class EngagementRing implements AfterViewInit, OnDestroy {
  private selectedShape = '*';
  private selectedColorRange: OrdinalRange = { min: 0, max: DIAMOND_COLOR_SCALE.length - 1 };
  private selectedClarityRange: OrdinalRange = { min: 0, max: DIAMOND_CLARITY_SCALE.length - 1 };
  private selectedCutRange: OrdinalRange = { min: 0, max: DIAMOND_CUT_SCALE.length - 1 };
  private selectedPolishRange: OrdinalRange = { min: 0, max: DIAMOND_POLISH_SCALE.length - 1 };
  private selectedSymmetryRange: OrdinalRange = { min: 0, max: DIAMOND_SYMMETRY_SCALE.length - 1 };
  private selectedFluorescenceRange: OrdinalRange = { min: 0, max: DIAMOND_FLUORESCENCE_SCALE.length - 1 };
  private selectedCertificate = 'ANY';

  private isotope: ReturnType<VendorLibsService['createIsotope']> = null;
  private filterApplyTimer: ReturnType<typeof setTimeout> | null = null;
  private activeFilterAbortController: AbortController | null = null;
  private isInitializingFilters = true;
  private filteredProducts: Record<string, unknown>[] = [];
  private renderedProductCount = 0;
  private autoLoadObserver: IntersectionObserver | null = null;
  private autoLoadInProgress = false;
  private backendPage = 0;
  private backendTotalPages = 0;
  private backendTotalCount = 0;
  private backendHasNextPage = false;
  private currentFilterRequestBody: DiamondFilters = {};
  private loadingNextServerPage = false;
  private activeRequestToken = 0;

  readonly shapeLocked = signal(false);

  lockedShapeLabel(): string {
    const shape = this.selectedShape;
    return shape && shape !== '*' ? shape.charAt(0).toUpperCase() + shape.slice(1).toLowerCase() : '';
  }

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly diamondApi: DiamondApiService,
    private readonly productSelection: ProductSelectionService,
    private readonly settingSelection: SettingSelectionService,
    private readonly vendorLibs: VendorLibsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (!this.vendorLibs.isBrowser) return;

    const routeWantsLock = Boolean(this.route.snapshot.data['shapeLocked']);
    const selectedSetting = this.settingSelection.getSelectedSetting();

    if (routeWantsLock && selectedSetting?.shape) {
      this.shapeLocked.set(true);
      this.selectedShape = selectedSetting.shape;
    }

    await this.loadProductData(this.buildFilterRequestBody());

    const container = this.query<HTMLElement>('.product-container');
    if (!container) return;

    this.isotope = this.vendorLibs.createIsotope(container, {
      itemSelector: '.product-item',
      layoutMode: 'fitRows',
      filter: '*',
    });
    this.isotope?.layout();

    this.vendorLibs.imagesLoaded(container, () => this.isotope?.layout());

    this.addFilterEvents();
    this.setupLoadMoreButton();
    this.setupAutoLoadObserver();
  }

  ngOnDestroy(): void {
    this.autoLoadObserver?.disconnect();
    if (this.filterApplyTimer) clearTimeout(this.filterApplyTimer);
    this.activeFilterAbortController?.abort();
  }

  private query<T extends Element>(selector: string): T | null {
    return this.host.nativeElement.querySelector<T>(selector);
  }

  private queryAll<T extends Element>(selector: string): T[] {
    return Array.from(this.host.nativeElement.querySelectorAll<T>(selector));
  }

  private createProductItem(product: Record<string, unknown>): HTMLElement {
    const diamondId = String(product['id'] || '').trim();
    const productName = `${product['carat']} ct - ${product['shape']}`;
    const productPriceNumber = parsePriceNumber(product['price']);
    const media = product['media'] as { image?: string } | undefined;
    const primaryImage = media?.image ?? '';

    const productItem = document.createElement('div');
    productItem.className = 'col-md-6 col-lg-3 product-item isotope-item';
    productItem.innerHTML = `
      <div class="product-card">
        <div class="product-image" data-name="${productName}" data-id="${diamondId}">
          <img src="${primaryImage}" alt="Diamond ${productName} ct" class="img-fluid main-img" loading="lazy" decoding="async">
        </div>
        <div class="product-info">
          <h5 class="product-title">
            <a href="#" class="go-detail" data-name="${productName}" data-id="${diamondId}">${productName}</a>
          </h5>
          <div class="product-price">
            <span class="tm-text-gray-light">THB ${formatPrice(productPriceNumber)}</span>
          </div>
          <div class="small text-muted">Color: ${product['color'] || '-'} | Clarity: ${product['clarity'] || '-'} | Cut: ${product['cut'] || '-'}</div>
        </div>
      </div>
    `;

    productItem.querySelectorAll('.go-detail, .product-image').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.productSelection.setSelectedProduct({
          name: productName,
          id: diamondId,
          price: productPriceNumber,
          image: primaryImage,
          source: 'engagement-diamond-api',
          fullData: product,
        });

        this.router.navigate(['/jewelry/diamond-detail'], {
          queryParams: this.shapeLocked() ? { flow: 'engagement' } : {},
        });
      });
    });

    return productItem;
  }

  private renderNextProductBatch(productContainer: HTMLElement): number {
    if (this.renderedProductCount >= this.filteredProducts.length) return 0;

    const nextItems = this.filteredProducts.slice(
      this.renderedProductCount,
      this.renderedProductCount + PRODUCT_BATCH_SIZE,
    );
    if (!nextItems.length) return 0;

    const fragment = document.createDocumentFragment();
    nextItems.forEach((product) => fragment.appendChild(this.createProductItem(product)));
    productContainer.appendChild(fragment);

    this.renderedProductCount += nextItems.length;

    if (this.isotope) {
      this.isotope.reloadItems();
      this.isotope.arrange({ filter: '*' });
      this.isotope.layout();
    }

    this.updateLoadMoreUi();
    return nextItems.length;
  }

  private resetPaginationState(): void {
    this.filteredProducts = [];
    this.renderedProductCount = 0;
    this.autoLoadInProgress = false;
    this.backendPage = 0;
    this.backendTotalPages = 0;
    this.backendTotalCount = 0;
    this.backendHasNextPage = false;
    this.loadingNextServerPage = false;
  }

  private async fetchDiamondPage(page: number, signal?: AbortSignal, requestToken = this.activeRequestToken): Promise<DiamondApiResponse> {
    const response = await this.diamondApi.fetchDiamondsByShape(this.getShapeRouteParam(), this.currentFilterRequestBody, {
      page,
      limit: API_PAGE_SIZE,
      signal,
    });

    if (requestToken !== this.activeRequestToken) return response;

    this.backendPage = response.page;
    this.backendTotalPages = response.totalPages;
    this.backendTotalCount = response.total;
    this.backendHasNextPage = response.hasNextPage;

    if (Array.isArray(response.data) && response.data.length) {
      this.filteredProducts = this.filteredProducts.concat(response.data);
    }

    return response;
  }

  private async loadMoreProducts(): Promise<void> {
    const productContainer = this.query<HTMLElement>('.product-container');
    if (!productContainer) return;

    if (this.renderedProductCount < this.filteredProducts.length) {
      this.renderNextProductBatch(productContainer);
      return;
    }

    if (!this.backendHasNextPage || this.loadingNextServerPage) {
      this.updateLoadMoreUi();
      return;
    }

    this.loadingNextServerPage = true;
    this.updateLoadMoreUi();

    try {
      await this.fetchDiamondPage(this.backendPage + 1, undefined, this.activeRequestToken);
      this.renderNextProductBatch(productContainer);
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.error('Error loading next page:', err);
      }
    } finally {
      this.loadingNextServerPage = false;
      this.updateLoadMoreUi();
    }
  }

  private setupAutoLoadObserver(): void {
    this.autoLoadObserver?.disconnect();
    this.autoLoadObserver = null;

    const triggerEl = this.query<HTMLElement>('#load_more_meta');
    if (!triggerEl) return;

    this.autoLoadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || this.autoLoadInProgress) return;
          if (this.renderedProductCount >= this.filteredProducts.length && !this.backendHasNextPage) return;

          this.autoLoadInProgress = true;
          this.loadMoreProducts();

          setTimeout(() => {
            this.autoLoadInProgress = false;
          }, 120);
        });
      },
      { root: null, rootMargin: '900px 0px', threshold: 0 },
    );

    this.autoLoadObserver.observe(triggerEl);
  }

  private updateLoadMoreUi(): void {
    const loadMoreBtn = this.query<HTMLButtonElement>('#load_more_btn');
    const loadMoreMeta = this.query<HTMLElement>('#load_more_meta');
    const resultCountText = this.query<HTMLElement>('#result_count_text');
    const knownTotal = this.backendTotalCount || this.filteredProducts.length;

    if (resultCountText) {
      resultCountText.textContent = `found ${knownTotal} diamonds`;
    }

    if (loadMoreMeta) {
      if (knownTotal > 0) {
        const loadingText = this.loadingNextServerPage ? ' (loading next page...)' : '';
        loadMoreMeta.textContent = `${this.renderedProductCount} / ${knownTotal} diamonds loaded (auto-load on scroll)${loadingText}`;
      } else {
        loadMoreMeta.textContent = '0 diamonds';
      }
    }
    if (!loadMoreBtn) return;

    const hasMore = this.renderedProductCount < this.filteredProducts.length || this.backendHasNextPage;
    loadMoreBtn.hidden = !hasMore;
    loadMoreBtn.disabled = !hasMore || this.loadingNextServerPage;
  }

  private setupLoadMoreButton(): void {
    const loadMoreBtn = this.query<HTMLButtonElement>('#load_more_btn');
    loadMoreBtn?.addEventListener('click', () => this.loadMoreProducts());
  }

  private buildScaleLabels(containerId: string, values: string[]): void {
    const container = this.query<HTMLElement>(`#${containerId}`);
    if (!container) return;

    container.innerHTML = '';
    values.forEach((value, index) => {
      const label = document.createElement('span');
      label.textContent = value;
      const percent = values.length > 1 ? (index / (values.length - 1)) * 100 : 0;
      label.style.left = `${percent}%`;
      container.appendChild(label);
    });
  }

  private setupOrdinalRangeSlider(prefix: string, values: string[], defaultState: OrdinalRange): void {
    const minRange = this.query<HTMLInputElement>(`#${prefix}_min_range`);
    const maxRange = this.query<HTMLInputElement>(`#${prefix}_max_range`);
    const fill = this.query<HTMLElement>(`#${prefix}_slider_fill`);

    if (!minRange || !maxRange || !fill || !values.length) return;

    const sync = () => {
      let minValue = Math.max(0, Math.min(Number(minRange.value), values.length - 1));
      let maxValue = Math.max(0, Math.min(Number(maxRange.value), values.length - 1));

      if (minValue > maxValue) {
        if (document.activeElement === minRange) {
          maxValue = minValue;
          maxRange.value = String(maxValue);
        } else {
          minValue = maxValue;
          minRange.value = String(minValue);
        }
      }

      const startPercent = values.length > 1 ? (minValue / (values.length - 1)) * 100 : 0;
      const endPercent = values.length > 1 ? (maxValue / (values.length - 1)) * 100 : 100;
      fill.style.left = `${startPercent}%`;
      fill.style.width = `${endPercent - startPercent}%`;

      defaultState.min = minValue;
      defaultState.max = maxValue;
      this.applyCombinedFilter();
    };

    minRange.max = String(values.length - 1);
    maxRange.max = String(values.length - 1);
    minRange.step = '1';
    maxRange.step = '1';
    minRange.value = String(defaultState.min);
    maxRange.value = String(defaultState.max);

    minRange.addEventListener('input', sync);
    maxRange.addEventListener('input', sync);
    sync();
  }

  private setupNumericRangeFilter(prefix: string, config: RangeConfig, decimals: number): void {
    const [minLimit, maxLimit] = config.range;
    const step = config.step;

    const minRange = this.query<HTMLInputElement>(`#${prefix}_min_range`);
    const maxRange = this.query<HTMLInputElement>(`#${prefix}_max_range`);
    const minInput = this.query<HTMLInputElement>(`#${prefix}_min`);
    const maxInput = this.query<HTMLInputElement>(`#${prefix}_max`);
    const fill = this.query<HTMLElement>(`#${prefix}_slider_fill`);
    const minBubble = this.query<HTMLElement>(`#${prefix}_min_bubble`);
    const maxBubble = this.query<HTMLElement>(`#${prefix}_max_bubble`);

    if (!minRange || !maxRange || !minInput || !maxInput || !fill) return;

    const formatValue = (value: number) => Number(value).toFixed(decimals);
    const suffix = prefix === 'table' || prefix === 'depth' ? '%' : '';

    const updateUi = () => {
      const minValue = Number(minRange.value);
      const maxValue = Number(maxRange.value);
      const startPercent = ((minValue - minLimit) / (maxLimit - minLimit)) * 100;
      const endPercent = ((maxValue - minLimit) / (maxLimit - minLimit)) * 100;

      fill.style.left = `${startPercent}%`;
      fill.style.width = `${endPercent - startPercent}%`;

      if (document.activeElement !== minInput) minInput.value = formatValue(minValue);
      if (document.activeElement !== maxInput) maxInput.value = formatValue(maxValue);

      if (minBubble) {
        minBubble.style.left = `${startPercent}%`;
        minBubble.textContent = `${formatValue(minValue)}${suffix}`;
      }
      if (maxBubble) {
        maxBubble.style.left = `${endPercent}%`;
        maxBubble.textContent = `${formatValue(maxValue)}${suffix}`;
      }
    };

    const syncFromRange = () => {
      let minValue = clampValue(Number(minRange.value), minLimit, maxLimit);
      let maxValue = clampValue(Number(maxRange.value), minLimit, maxLimit);

      if (minValue > maxValue) {
        if (document.activeElement === minRange) {
          maxValue = minValue;
          maxRange.value = formatValue(maxValue);
        } else {
          minValue = maxValue;
          minRange.value = formatValue(minValue);
        }
      }

      updateUi();
      this.applyCombinedFilter();
    };

    const syncFromInput = (source: 'min' | 'max', commit: boolean) => {
      let minValue = parseInputNumber(minInput.value);
      let maxValue = parseInputNumber(maxInput.value);

      if (!commit) {
        if (minValue === null || maxValue === null) return;
        if (minValue < minLimit || minValue > maxLimit) return;
        if (maxValue < minLimit || maxValue > maxLimit) return;
      }

      minValue = minValue === null ? minLimit : clampValue(minValue, minLimit, maxLimit);
      maxValue = maxValue === null ? maxLimit : clampValue(maxValue, minLimit, maxLimit);

      if (minValue > maxValue) {
        if (source === 'min') maxValue = minValue;
        else minValue = maxValue;
      }

      minRange.value = formatValue(minValue);
      maxRange.value = formatValue(maxValue);
      updateUi();
      this.applyCombinedFilter();
    };

    minRange.min = String(minLimit);
    minRange.max = String(maxLimit);
    minRange.step = String(step);
    maxRange.min = String(minLimit);
    maxRange.max = String(maxLimit);
    maxRange.step = String(step);
    minInput.min = String(minLimit);
    minInput.max = String(maxLimit);
    minInput.step = String(step);
    maxInput.min = String(minLimit);
    maxInput.max = String(maxLimit);
    maxInput.step = String(step);

    minRange.value = formatValue(minLimit);
    maxRange.value = formatValue(maxLimit);
    minInput.value = formatValue(minLimit);
    maxInput.value = formatValue(maxLimit);

    minRange.addEventListener('input', syncFromRange);
    maxRange.addEventListener('input', syncFromRange);
    minInput.addEventListener('input', () => syncFromInput('min', false));
    maxInput.addEventListener('input', () => syncFromInput('max', false));
    minInput.addEventListener('blur', () => syncFromInput('min', true));
    maxInput.addEventListener('blur', () => syncFromInput('max', true));

    updateUi();
  }

  private getScaleValuesFromRange(scale: string[], selectedRange: OrdinalRange): string[] {
    const start = Math.max(0, Math.min(selectedRange.min, selectedRange.max));
    const end = Math.min(scale.length - 1, Math.max(selectedRange.min, selectedRange.max));
    return scale.slice(start, end + 1);
  }

  private toAllOrValues(scale: string[], selectedRange: OrdinalRange): 'ALL' | { values: string[] } {
    const values = this.getScaleValuesFromRange(scale, selectedRange);
    return values.length === scale.length ? 'ALL' : { values };
  }

  private getShapeRouteParam(): string {
    if (this.selectedShape === '*') return 'ROUND';
    return String(this.selectedShape || 'ROUND').trim().toUpperCase();
  }

  private readNumberPair(prefix: string, fallbackRange: [number, number]): NumberRange {
    const min = parseInputNumber(this.query<HTMLInputElement>(`#${prefix}_min`)?.value) ?? fallbackRange[0];
    const max = parseInputNumber(this.query<HTMLInputElement>(`#${prefix}_max`)?.value) ?? fallbackRange[1];
    return { min: Number(min), max: Number(max) };
  }

  private buildFilterRequestBody(): DiamondFilters {
    return {
      carat: this.readNumberPair('carat', CARAT_CONFIG.range),
      price: this.readNumberPair('price', PRICE_CONFIG.range),
      color: { values: this.getScaleValuesFromRange(DIAMOND_COLOR_SCALE, this.selectedColorRange) },
      clarity: this.toAllOrValues(DIAMOND_CLARITY_SCALE, this.selectedClarityRange),
      cut: this.toAllOrValues(DIAMOND_CUT_SCALE, this.selectedCutRange),
      polish: this.toAllOrValues(DIAMOND_POLISH_SCALE, this.selectedPolishRange),
      symmetry: this.toAllOrValues(DIAMOND_SYMMETRY_SCALE, this.selectedSymmetryRange),
      fluorescence: this.toAllOrValues(DIAMOND_FLUORESCENCE_SCALE, this.selectedFluorescenceRange),
      certificate: this.selectedCertificate === 'ANY' ? 'ALL' : this.selectedCertificate,
      table: this.readNumberPair('table', TABLE_CONFIG.range),
      depth: this.readNumberPair('depth', DEPTH_CONFIG.range),
      lwRatio: this.readNumberPair('lw_ratio', LW_RATIO_CONFIG.range),
    };
  }

  private async loadProductData(requestBody: DiamondFilters, signal?: AbortSignal): Promise<void> {
    try {
      const productContainer = this.query<HTMLElement>('.product-container');
      if (!productContainer) return;

      const requestToken = this.activeRequestToken + 1;
      this.activeRequestToken = requestToken;
      this.currentFilterRequestBody = requestBody;
      productContainer.innerHTML = '';
      this.resetPaginationState();
      await this.fetchDiamondPage(1, signal, requestToken);

      if (requestToken !== this.activeRequestToken) return;

      if (!this.filteredProducts.length) {
        productContainer.innerHTML =
          '<div class="col-12"><div class="alert alert-light border text-center mb-0">No diamonds found for current filters.</div></div>';
        this.updateLoadMoreUi();
        return;
      }

      this.renderNextProductBatch(productContainer);
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.error('Error loading product data:', err);
      }
    }
  }

  private addFilterEvents(): void {
    this.queryAll<HTMLElement>('#shape_filter .shape-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.query('#shape_filter .shape-option.active')?.classList.remove('active');
        btn.classList.add('active');
        this.selectedShape = btn.getAttribute('data-shape') || '*';
        this.applyCombinedFilter();
      });
    });

    this.setupNumericRangeFilter('carat', CARAT_CONFIG, 2);
    this.setupNumericRangeFilter('price', PRICE_CONFIG, 0);

    this.buildScaleLabels('color_scale_labels', DIAMOND_COLOR_SCALE);
    this.buildScaleLabels('clarity_scale_labels', DIAMOND_CLARITY_SCALE);
    this.buildScaleLabels('cut_scale_labels', DIAMOND_CUT_SCALE);
    this.buildScaleLabels('polish_scale_labels', DIAMOND_POLISH_SCALE);
    this.buildScaleLabels('symmetry_scale_labels', DIAMOND_SYMMETRY_SCALE);
    this.buildScaleLabels('fluorescence_scale_labels', DIAMOND_FLUORESCENCE_SCALE);

    this.setupOrdinalRangeSlider('color', DIAMOND_COLOR_SCALE, this.selectedColorRange);
    this.setupOrdinalRangeSlider('clarity', DIAMOND_CLARITY_SCALE, this.selectedClarityRange);
    this.setupOrdinalRangeSlider('cut', DIAMOND_CUT_SCALE, this.selectedCutRange);
    this.setupOrdinalRangeSlider('polish', DIAMOND_POLISH_SCALE, this.selectedPolishRange);
    this.setupOrdinalRangeSlider('symmetry', DIAMOND_SYMMETRY_SCALE, this.selectedSymmetryRange);
    this.setupOrdinalRangeSlider('fluorescence', DIAMOND_FLUORESCENCE_SCALE, this.selectedFluorescenceRange);

    this.setupNumericRangeFilter('table', TABLE_CONFIG, 0);
    this.setupNumericRangeFilter('depth', DEPTH_CONFIG, 0);
    this.setupNumericRangeFilter('lw_ratio', LW_RATIO_CONFIG, 2);

    this.queryAll<HTMLElement>('.cert-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.queryAll('.cert-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCertificate = btn.getAttribute('data-value') || 'ANY';
        this.applyCombinedFilter();
      });
    });

    const detailToggleBtn = this.query<HTMLButtonElement>('#more_detail_btn');
    const advancedFilters = this.query<HTMLElement>('#advanced_filters');
    const detailToggleText = this.query<HTMLElement>('#more_detail_text');
    if (detailToggleBtn && advancedFilters && detailToggleText) {
      detailToggleBtn.addEventListener('click', () => {
        const isOpen = advancedFilters.classList.toggle('is-open');
        detailToggleBtn.classList.toggle('is-open', isOpen);
        detailToggleBtn.setAttribute('aria-expanded', String(isOpen));
        detailToggleText.textContent = isOpen ? 'Less Detail' : 'More Detail';
      });
    }

    this.isInitializingFilters = false;
  }

  private applyCombinedFilter(): void {
    if (this.isInitializingFilters) return;

    if (this.filterApplyTimer) clearTimeout(this.filterApplyTimer);

    this.filterApplyTimer = setTimeout(async () => {
      const requestBody = this.buildFilterRequestBody();

      this.activeFilterAbortController?.abort();
      this.activeFilterAbortController = new AbortController();
      await this.loadProductData(requestBody, this.activeFilterAbortController.signal);
    }, 220);
  }
}
