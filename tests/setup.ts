import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia — provide a minimal stub so every
// test has access to it.  Individual tests can override with vi.spyOn.
window.matchMedia = vi.fn(
  (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as MediaQueryList,
);
