import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    expect(screen.getByLabelText('Theme:')).toBeInTheDocument();
  });

  it('renders the table container after load', async () => {
    mockFetchResponse(true, 200, sampleData);
    render(<App />);
    await screen.findByText('Prices');
    expect(document.querySelector('.table-container')).toBeInTheDocument();
  });

  it('theme dropdown shows all themes', async () => {
    mockFetchResponse(true, 200, sampleData);
    render(<App />);
    await screen.findByText('Prices');

    const select = screen.getByLabelText('Theme:') as HTMLSelectElement;
    expect(select.value).toBe('default');

    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['default', 'midnight', 'modern', 'simple', 'site']);
  });

  it('changing theme persists to localStorage', async () => {
    mockFetchResponse(true, 200, sampleData);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Prices');

    const select = screen.getByLabelText('Theme:');
    await user.selectOptions(select, 'midnight');

    expect(localStorage.getItem('catbrowser-theme')).toBe('midnight');
  });

  it('Clear filters button is present', async () => {
    mockFetchResponse(true, 200, sampleData);
    render(<App />);
    await screen.findByText('Clear filters');
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });
});
