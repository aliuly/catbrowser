/* ── Types ────────────────────────────────── */

export interface PricesData {
  columns: Record<string, string>;
  services: string[];
  count: number;
  records: Record<string, Record<string, unknown>[]>;
}

export type FilterType = 'text' | 'number' | 'dropdown' | 'boolean';

export interface ColumnInfo {
  id: string;
  header: string;
  size: number;
  filter?: FilterType;
  render?: (value: unknown) => string;
  hide?: boolean;
}

/* ── Constants ────────────────────────────── */

export const TABS = [{ id: 'prices', label: 'Prices' }];

/** Fields that should use a numeric filter. */
const NUMERIC_FIELDS = new Set([
  'fromOn',
  'upTo',
  'minAmount',
  'maxAmount',
]);

/** Fields that should use a boolean / set filter. */
const BOOLEAN_FIELDS = new Set(['isMRC']);

/** Fields that should use a dropdown filter. */
export const DROPDOWN_FILTER_FIELDS = new Set([
  'productId',
  'region',
  'currency',
  'osUnit',
  'unit',
  'serviceType',
  'productFamily',
  'productCategory',
  'productSection',
  'productType',
  'storageType',
  'opiFlavour',
]);

/** Fields to hide from the initial column set. */
const HIDDEN_FIELDS = new Set<string>([]);

/* ── Data transformation ──────────────────── */

export function flattenRecords(
  data: PricesData,
): Record<string, unknown>[] {
  return Object.entries(data.records).flatMap(([category, records]) =>
    records.map((r) => ({ ...r, service: category })),
  );
}

/* ── Column builder ───────────────────────── */

export function buildColumns(
  dataColumns: Record<string, string>,
): ColumnInfo[] {
  const columns: ColumnInfo[] = Object.entries(dataColumns).map(
    ([field, title]) => ({
      id: field,
      header: title,
      size: 160,
      filter: NUMERIC_FIELDS.has(field)
        ? 'number'
        : BOOLEAN_FIELDS.has(field)
          ? 'boolean'
          : DROPDOWN_FILTER_FIELDS.has(field)
            ? 'dropdown'
            : 'text',
      render:
        field === 'isMRC'
          ? (v: unknown) => (v ? '✓' : '✗')
          : undefined,
      hide: HIDDEN_FIELDS.has(field),
    }),
  );

  /* Append the synthetic "service" column (internal grouping key). */
  columns.push({
    id: 'service',
    header: 'Service',
    size: 120,
    filter: 'text',
    hide: true,
  });

  return columns;
}
