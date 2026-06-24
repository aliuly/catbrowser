/* Mock for tabulator-tables — the real library requires a full DOM
 * and does heavy layout work incompatible with jsdom. */

export const EditModule = {};
export const FilterModule = {};
export const FormatModule = {};
export const SortModule = {};
export const GroupRowsModule = {};
export const FrozenColumnsModule = {};
export const ResizeColumnsModule = {};
export const ResizeTableModule = {};
export const MoveColumnsModule = {};
export const MenuModule = {};

export class TabulatorFull {
  static registerModule(_modules: object[]): void {}
  private _events: Record<string, Array<(...args: unknown[]) => void>> = {};

  constructor(_element: HTMLElement | string, _options?: Record<string, unknown>) {}
  destroy(): void {}
  on(event: string, callback: (...args: unknown[]) => void): void {
    (this._events[event] ??= []).push(callback);
  }
  off(event: string, callback: (...args: unknown[]) => void): void {
    const list = this._events[event];
    if (list) this._events[event] = list.filter((cb) => cb !== callback);
  }
  setSort(_sorters: unknown): void {}
  setFilter(..._args: unknown[]): void {}
  clearFilter(_all?: boolean): void {}
  setGroupBy(_groups: unknown): void {}
  redraw(_force?: boolean): void {}
  getColumns(): { reloadHeaderFilter?: () => void; [key: string]: unknown }[] {
    return [];
  }
}
