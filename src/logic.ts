import type { ColumnDefinition } from 'tabulator-tables';

/* ── Types ────────────────────────────────── */

export interface PricesData {
  columns: Record<string, string>;
  services: string[];
  count: number;
  records: Record<string, Record<string, unknown>[]>;
}

/* ── Constants ────────────────────────────── */

export const THEMES = ['default', 'midnight', 'modern', 'simple', 'site'] as const;

export const THEME_LINK_ID = 'tabulator-theme-link';

export const NUMERIC_FIELDS = new Set([
  'priceAmount',
  'vCpu',
  'ram',
  'storageVolume',
  'fromOn',
  'upTo',
  'minAmount',
  'maxAmount',
  'R12',
  'R24',
  'R36',
  'RU12',
  'RU24',
  'RU36',
]);

export const INPUT_FILTER_FIELDS = new Set([
  'id',
  'productName',
  'description',
]);

export const SELECT_FILTER_FIELDS = new Set([
  'productId',
  'idGroupTiered',
  'opiFlavour',
  'osUnit',
  'unit',
  'additionalText',
  'storageType',
  'storageVolume',
  'vCpu',
  'ram',
  'serviceType',
  'productIdParameter',
  'productSection',
  'productType',
  'productCategory',
  'productFamily',
  'region',
  'currency',
]);

export const TABS = [{ id: 'prices', label: 'Prices' }];

export const STORAGE_KEY = 'catbrowser-theme';

/* ── Helpers ──────────────────────────────── */

/** Query the system colour-scheme preference. */
export function getSystemTheme(): string {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'midnight';
  }
  return 'default';
}

/**
 * Return the user-chosen theme, falling back to the system preference
 * ('midnight' for dark mode, 'default' for light).
 */
export function loadTheme(): string {
  return localStorage.getItem(STORAGE_KEY) || getSystemTheme();
}

/* ── Data transformation ──────────────────── */

/**
 * Flatten the nested `records` object into a single array,
 * adding a `service` field derived from the category key.
 */
export function flattenRecords(
  data: PricesData,
): Record<string, unknown>[] {
  return Object.entries(data.records).flatMap(([category, records]) =>
    records.map((r) => ({ ...r, service: category })),
  );
}

/**
 * Build the service column definition (rightmost column).
 */
export function buildServiceColumn(): ColumnDefinition {
  return {
    title: 'Service',
    field: 'service',
    minWidth: 100,
    headerFilter: 'input',
    headerFilterPlaceholder: 'Filter services…',
  };
}

/**
 * Build column definitions from the data's column map,
 * applying sorters, formatters, and header filters based
 * on the field constants.
 */
export function buildDataColumns(
  columns: Record<string, string>,
): ColumnDefinition[] {
  return Object.entries(columns).map(([field, title]) => {
    const col: ColumnDefinition = { title, field, minWidth: 100 };

    // Numeric sorter
    if (NUMERIC_FIELDS.has(field)) {
      col.sorter = 'number';
    }

    // Boolean formatter
    if (field === 'isMRC') {
      col.formatter = 'tickCross';
    }

    // Header filters
    if (INPUT_FILTER_FIELDS.has(field)) {
      col.headerFilter = 'input';
      col.headerFilterPlaceholder = 'Search…';
    }
    if (SELECT_FILTER_FIELDS.has(field)) {
      col.headerFilter = 'list';
      col.headerFilterParams = {
        placeholderEmpty: 'All',
        valuesLookup: function (cell: {
          getTable: () => { getData: (type: string) => Record<string, unknown>[] };
          getField: () => string;
        }) {
          const table = cell.getTable();
          const rows = table.getData('active');
          const values = new Set<string>();
          for (const row of rows) {
            const v = row[field];
            if (v !== undefined && v !== null && v !== '') {
              values.add(String(v));
            }
          }
          const collator = new Intl.Collator(undefined, { numeric: true });
          return [
            { label: 'All', value: '' },
            ...[...values].sort(collator.compare),
          ];
        },
      };
    }

    return col;
  });
}

/**
 * Reorder columns: productId frozen first, service last.
 */
export function orderColumns(
  dataCols: ColumnDefinition[],
  serviceCol: ColumnDefinition,
): ColumnDefinition[] {
  const productIdCol = dataCols.find((c) => c.field === 'productId');
  const restCols = dataCols.filter((c) => c.field !== 'productId');

  return [
    { ...productIdCol!, frozen: true },
    ...restCols,
    serviceCol,
  ];
}

/**
 * Build the complete ordered column list for Tabulator.
 */
export function buildColumns(
  dataColumns: Record<string, string>,
): ColumnDefinition[] {
  const dataCols = buildDataColumns(dataColumns);
  const serviceCol = buildServiceColumn();
  return orderColumns(dataCols, serviceCol);
}
