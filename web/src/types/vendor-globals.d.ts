export {};

declare global {
  interface Window {
    AOS?: {
      init: (options?: Record<string, unknown>) => void;
      refresh: () => void;
      refreshHard: () => void;
    };
    Swiper?: new (el: string | Element, config?: Record<string, unknown>) => unknown;
    Drift?: new (el: Element, options?: Record<string, unknown>) => unknown;
    Bootstrap?: unknown;
    Isotope?: new (el: Element, options?: Record<string, unknown>) => IsotopeInstance;
    imagesLoaded?: (el: Element, callback?: () => void) => { on: (event: string, cb: () => void) => void };
  }

  interface IsotopeInstance {
    arrange: (options: { filter?: string }) => void;
    layout: () => void;
    reloadItems: () => void;
  }
}
