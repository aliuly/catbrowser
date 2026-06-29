import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ───────────────────────────────────

vi.mock('tabulator-tables');
vi.mock('tabulator-tables/dist/css/tabulator.min.css', () => ({}));
vi.mock('./App.css', () => ({}));

// Now safe to import App (mock is hoisted)
import App from './App';

/* ── Helpers ──────────────────────────────── */

function mockFetchResponse(
  ok: boolean,
  status: number,
  body: unknown,
) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

const sampleData = {
  columns: {
    id: 'ID',
    productId: 'Service ID',
    productName: 'Product Name',
  },
  services: ['compute'],
  count: 2,
  records: {
    compute: [
      { id: 'c1', productId: 'SVC-A', productName: 'VM Small' },
      { id: 'c2', productId: 'SVC-A', productName: 'VM Medium' },
    ],
  },
};

/* ── Tests ────────────────────────────────── */

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    // fetch never resolves → stays loading
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    render(<App />);
    expect(screen.getByText('Loading prices.json…')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    render(<App />);
    expect(await screen.findByText(/Failed to load/)).toBeInTheDocument();
  });

  it('shows error message on non-ok response', async () => {
    mockFetchResponse(false, 404, {});
    render(<App />);
    expect(await screen.findByText(/HTTP 404/)).toBeInTheDocument();
  });

  it('renders top bar after data loads', async () => {
    mockFetchResponse(true, 200, sampleData);
    render(<App />);

    // Wait for loading to finish
    await screen.findByText('Prices');
    expect(screen.getByText('Prices')).toBeInTheDocument();
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('renders the table container after load', async () => {
    mockFetchResponse(true, 200, sampleData);
    render(<App />);
    await screen.findByText('Prices');
    expect(document.querySelector('.table-container')).toBeInTheDocument();
  });

  it('Clear filters button is present', async () => {
    mockFetchResponse(true, 200, sampleData);
    render(<App />);
    await screen.findByText('Clear filters');
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });
});
