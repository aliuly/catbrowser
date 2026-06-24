/// <reference types="vite/client" />

declare module 'tabulator-tables' {
  interface ColumnDefinition {
    title?: string;
    field?: string;
    frozen?: boolean;
    minWidth?: number;
    sorter?: string;
    formatter?: string;
    headerFilter?: string | boolean;
    headerFilterPlaceholder?: string;
    headerFilterParams?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface Options {
    data?: Record<string, unknown>[];
    columns?: ColumnDefinition[];
    layout?: string;
    height?: string | number;
    groupBy?: string | string[];
    groupStartOpen?: boolean;
    groupHeader?: (
      value: unknown,
      count: number,
      data: unknown[],
      group: unknown,
    ) => string;
    cssClass?: string;
    selectable?: boolean;
    [key: string]: unknown;
  }

  class TabulatorFull {
    static registerModule(modules: object[]): void;
    constructor(element: HTMLElement | string, options?: Options);
    destroy(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    setSort(sorters: unknown): void;
    setFilter(...args: unknown[]): void;
    clearFilter(all?: boolean): void;
    setGroupBy(groups: unknown): void;
    redraw(force?: boolean): void;
    getColumns(): { reloadHeaderFilter?: () => void; [key: string]: unknown }[];
  }

  // Module exports
  export const EditModule: object;
  export const FilterModule: object;
  export const FormatModule: object;
  export const SortModule: object;
  export const GroupRowsModule: object;
  export const FrozenColumnsModule: object;
  export const ResizeColumnsModule: object;
  export const ResizeTableModule: object;
  export const MoveColumnsModule: object;
  export const MenuModule: object;
}

