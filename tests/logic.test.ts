import { describe, it, expect } from 'vitest';
import { type PricesData, flattenRecords, buildColumns } from '../src/logic';

const sampleData: PricesData = {
  columns: {
    id: 'ID',
    productId: 'Service ID',
    priceAmount: 'Price Amount',
    isMRC: 'isMRC',
    productName: 'Product Name',
  },
  services: ['compute', 'storage'],
  count: 5,
  records: {
    compute: [
      { id: 'c1', productId: 'SVC-A', priceAmount: 10, isMRC: true, productName: 'VM Small' },
      { id: 'c2', productId: 'SVC-A', priceAmount: 20, isMRC: false, productName: 'VM Medium' },
    ],
    storage: [
      { id: 's1', productId: 'SVC-C', priceAmount: 5, isMRC: true, productName: 'Block 100GB' },
    ],
  },
};

describe('flattenRecords', () => {
  it('flattens all category records and adds service field', () => {
    const result = flattenRecords(sampleData);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ id: 'c1', service: 'compute' });
    expect(result[2]).toMatchObject({ id: 's1', service: 'storage' });
  });

  it('returns empty array for data with no records', () => {
    const empty: PricesData = { columns: {}, services: [], count: 0, records: {} };
    expect(flattenRecords(empty)).toEqual([]);
  });
});

describe('buildColumns', () => {
  it('returns a column for each data column plus service', () => {
    const cols = buildColumns(sampleData.columns);
    // 5 data columns + 1 service column
    expect(cols).toHaveLength(6);
  });

  it('last column is the service column', () => {
    const cols = buildColumns(sampleData.columns);
    const last = cols[cols.length - 1];
    expect(last.id).toBe('service');
    expect(last.header).toBe('Service');
    expect(last.size).toBe(150);
  });

  it('sets tick/cross renderer on isMRC', () => {
    const cols = buildColumns(sampleData.columns);
    const mrc = cols.find((c) => c.id === 'isMRC');
    expect(mrc?.render).toBeTypeOf('function');
    expect(mrc!.render!(true)).toBe('✓');
    expect(mrc!.render!(false)).toBe('✗');
  });

  it('does not set renderer on other fields', () => {
    const cols = buildColumns(sampleData.columns);
    const idCol = cols.find((c) => c.id === 'id');
    expect(idCol?.render).toBeUndefined();
  });

  it('uses header title from the columns map', () => {
    const cols = buildColumns(sampleData.columns);
    const priceCol = cols.find((c) => c.id === 'priceAmount');
    expect(priceCol?.header).toBe('Price Amount');
  });
});
