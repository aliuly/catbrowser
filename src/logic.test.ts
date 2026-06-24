import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type PricesData,
  NUMERIC_FIELDS,
  INPUT_FILTER_FIELDS,
  SELECT_FILTER_FIELDS,
  loadTheme,
  getSystemTheme,
  flattenRecords,
  buildServiceColumn,
  buildDataColumns,
  orderColumns,
  buildColumns,
  STORAGE_KEY,
} from './logic';

/* ── Sample data ──────────────────────────── */

const sampleData: PricesData = {
  columns: {
    id: 'ID',
    productId: 'Service ID',
    priceAmount: 'Price Amount',
    isMRC: 'isMRC',
    productName: 'Product Name',
    currency: 'Currency',
    region: 'Region',
  },
  services: ['compute', 'storage'],
  count: 5,
  records: {
    compute: [
      { id: 'c1', productId: 'SVC-A', priceAmount: 10, isMRC: true, productName: 'VM Small', currency: 'EUR', region: 'eu-de' },
      { id: 'c2', productId: 'SVC-A', priceAmount: 20, isMRC: false, productName: 'VM Medium', currency: 'USD', region: 'eu-nl' },
      { id: 'c3', productId: 'SVC-B', priceAmount: 30, isMRC: true, productName: 'VM Large', currency: 'EUR', region: 'eu-de' },
    ],
    storage: [
      { id: 's1', productId: 'SVC-C', priceAmount: 5, isMRC: true, productName: 'Block 100GB', currency: 'EUR', region: 'eu-de' },
      { id: 's2', productId: 'SVC-C', priceAmount: 8, isMRC: false, productName: 'Block 200GB', currency: 'USD', region: 'eu-nl' },
    ],
  },
};

/* ── Tests ────────────────────────────────── */

describe('flattenRecords', () => {
  it('flattens all category records and adds service field', () => {
    const result = flattenRecords(sampleData);
    expect(result).toHaveLength(5);
    // Each record should have a service property matching its category key
    expect(result[0]).toMatchObject({ id: 'c1', service: 'compute' });
    expect(result[3]).toMatchObject({ id: 's1', service: 'storage' });
  });

  it('returns empty array for data with no records', () => {
    const empty: PricesData = { columns: {}, services: [], count: 0, records: {} };
    expect(flattenRecords(empty)).toEqual([]);
  });
});

describe('buildServiceColumn', () => {
  it('returns the service column definition', () => {
    const col = buildServiceColumn();
    expect(col.title).toBe('Service');
    expect(col.field).toBe('service');
    expect(col.minWidth).toBe(100);
    expect(col.headerFilter).toBe('input');
    expect(col.headerFilterPlaceholder).toBe('Filter services…');
  });
});

describe('buildDataColumns', () => {
  it('returns a column for each entry in the columns map', () => {
    const cols = buildDataColumns(sampleData.columns);
    expect(cols).toHaveLength(7);
  });

  it('sets numeric sorter on priceAmount', () => {
    const cols = buildDataColumns(sampleData.columns);
    const priceCol = cols.find((c) => c.field === 'priceAmount');
    expect(priceCol?.sorter).toBe('number');
  });

  it('sets tickCross formatter on isMRC', () => {
    const cols = buildDataColumns(sampleData.columns);
    const mrcCol = cols.find((c) => c.field === 'isMRC');
    expect(mrcCol?.formatter).toBe('tickCross');
  });

  it('sets input headerFilter on productName', () => {
    const cols = buildDataColumns(sampleData.columns);
    const nameCol = cols.find((c) => c.field === 'productName');
    expect(nameCol?.headerFilter).toBe('input');
    expect(nameCol?.headerFilterPlaceholder).toBe('Search…');
  });

  it('sets list headerFilter on productId (a SELECT_FILTER_FIELDS entry)', () => {
    const cols = buildDataColumns(sampleData.columns);
    const svcCol = cols.find((c) => c.field === 'productId');
    expect(svcCol?.headerFilter).toBe('list');
    expect(svcCol?.headerFilterParams).toBeDefined();
  });

  it('does not set headerFilter on fields not in INPUT or SELECT sets', () => {
    const cols = buildDataColumns(sampleData.columns);
    const idCol = cols.find((c) => c.field === 'id');
    // 'id' is in INPUT_FILTER_FIELDS
    expect(idCol?.headerFilter).toBe('input');
    // 'isMRC' is in neither set (should have no headerFilter)
    const mrcCol = cols.find((c) => c.field === 'isMRC');
    expect(mrcCol?.headerFilter).toBeUndefined();
  });
});

describe('orderColumns', () => {
  it('places productId first with frozen=true, service last', () => {
    const dataCols = buildDataColumns(sampleData.columns);
    const serviceCol = buildServiceColumn();
    const ordered = orderColumns(dataCols, serviceCol);

    // First column should be productId, frozen
    expect(ordered[0].field).toBe('productId');
    expect(ordered[0].frozen).toBe(true);

    // Last column should be service
    expect(ordered[ordered.length - 1].field).toBe('service');

    // All non-productId data columns should be in the middle
    expect(ordered).toHaveLength(dataCols.length + 1); // +1 for service
  });
});

describe('buildColumns', () => {
  it('returns the full ordered column list', () => {
    const result = buildColumns(sampleData.columns);
    expect(result[0].field).toBe('productId');
    expect(result[0].frozen).toBe(true);
    expect(result[result.length - 1].field).toBe('service');
  });
});

describe('getSystemTheme', () => {
  it("returns 'midnight' when system prefers dark", () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) =>
      ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
    );
    expect(getSystemTheme()).toBe('midnight');
  });

  it("returns 'default' when system prefers light", () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() =>
      ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
    );
    expect(getSystemTheme()).toBe('default');
  });
});

describe('loadTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    // Default to light so the fallback is predictable
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList);
  });

  it('falls back to system theme (default/light) when nothing is stored', () => {
    expect(loadTheme()).toBe('default');
  });

  it('returns the stored theme value', () => {
    localStorage.setItem(STORAGE_KEY, 'midnight');
    expect(loadTheme()).toBe('midnight');
  });

  it('ignores system theme when a stored preference exists', () => {
    localStorage.setItem(STORAGE_KEY, 'modern');
    // Even though matchMedia says light, stored wins
    expect(loadTheme()).toBe('modern');
  });
});

describe('NUMERIC_FIELDS', () => {
  it('contains expected numeric fields', () => {
    expect(NUMERIC_FIELDS.has('priceAmount')).toBe(true);
    expect(NUMERIC_FIELDS.has('vCpu')).toBe(true);
    expect(NUMERIC_FIELDS.has('ram')).toBe(true);
    expect(NUMERIC_FIELDS.has('R12')).toBe(true);
    expect(NUMERIC_FIELDS.has('RU36')).toBe(true);
  });

  it('does not contain non-numeric fields', () => {
    expect(NUMERIC_FIELDS.has('productId')).toBe(false);
    expect(NUMERIC_FIELDS.has('productName')).toBe(false);
  });
});

describe('INPUT_FILTER_FIELDS', () => {
  it('contains expected text-search fields', () => {
    expect(INPUT_FILTER_FIELDS.has('id')).toBe(true);
    expect(INPUT_FILTER_FIELDS.has('productName')).toBe(true);
    expect(INPUT_FILTER_FIELDS.has('description')).toBe(true);
  });
});

describe('SELECT_FILTER_FIELDS', () => {
  it('contains expected dropdown fields', () => {
    expect(SELECT_FILTER_FIELDS.has('productId')).toBe(true);
    expect(SELECT_FILTER_FIELDS.has('currency')).toBe(true);
    expect(SELECT_FILTER_FIELDS.has('region')).toBe(true);
    expect(SELECT_FILTER_FIELDS.has('vCpu')).toBe(true);
    expect(SELECT_FILTER_FIELDS.has('productCategory')).toBe(true);
  });
});
