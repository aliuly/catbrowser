/* ── Types ────────────────────────────────── */

export interface PricesData {
  columns: Record<string, string>;
  services: string[];
  count: number;
  records: Record<string, Record<string, unknown>[]>;
}

export interface ColumnInfo {
  id: string;
  header: string;
  size: number;
  render?: (value: unknown) => string;
}

/* ── Constants ────────────────────────────── */

export const TABS = [{ id: 'prices', label: 'Prices' }];

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
      size: 150,
      render:
        field === 'isMRC'
          ? (v: unknown) => (v ? '✓' : '✗')
          : undefined,
    }),
  );

  columns.push({ id: 'service', header: 'Service', size: 150 });

  return columns;
}
