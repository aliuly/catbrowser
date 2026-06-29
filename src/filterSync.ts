/* ── Cross-filter dropdown syncing ───────────
 *  Uses AG Grid's forEachNodeAfterFilter with temporary
 *  filter models to compute narrowed dropdown values.  */

import type { GridApi } from 'ag-grid-community';

export interface SyncHandle {
  cancel: () => void;
}

/**
 * For every column in `setFilterColumns`, compute the distinct values
 * that survive the **other** active filters.
 *
 * For each column we temporarily remove its own filter from the model,
 * ask AG Grid which rows pass, collect distinct values, then restore.
 * Columns are processed sequentially with yields so the UI stays alive.
 */
export function syncFilterValues(
  api: GridApi,
  setFilterColumns: string[],
  onColumnReady: (colId: string, values: string[]) => void,
  onComplete: () => void,
): SyncHandle {
  let cancelled = false;
  let timer: number | undefined;

  const originalModel = api.getFilterModel();

  /* Collect distinct values from whatever rows are currently visible
   * (after the temporary model has been applied). */
  function collectDistinct(colId: string): string[] {
    const seen = new Set<string>();
    api.forEachNodeAfterFilter((node) => {
      if (node.data) {
        seen.add(String(node.data[colId] ?? ''));
      }
    });
    seen.delete('');
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }

  let colIdx = 0;

  function processNextColumn() {
    if (cancelled) return;

    if (colIdx >= setFilterColumns.length) {
      /* Fire onComplete first so the caller can schedule a delayed
       * unguard.  Then restore — any filterChanged events from the
       * restore will still find the guard up. */
      console.log('[sync] all columns done, restoring model:', JSON.stringify(originalModel));
      onComplete();
      api.setFilterModel(originalModel);
      return;
    }

    const colId = setFilterColumns[colIdx];
    colIdx++;

    /* Build a temporary model that excludes this column's filter. */
    const others: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(originalModel)) {
      if (key !== colId && val != null && val !== '' && val !== false) {
        others[key] = val;
      }
    }

    /* Apply, collect, report. */
    console.log('[sync] setFilterModel for', colId, JSON.stringify(others));
    api.setFilterModel(others);

    /* Yield so AG Grid can process the model change before we iterate. */
    timer = window.setTimeout(() => {
      if (cancelled) { console.log('[sync] cancelled after yield for', colId); return; }
      const values = collectDistinct(colId);
      onColumnReady(colId, values);
      timer = window.setTimeout(processNextColumn, 0);
    }, 0);
  }

  timer = window.setTimeout(processNextColumn, 0);

  return {
    cancel() {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
      /* Restore on cancel too, so the grid isn't left in a weird state. */
      api.setFilterModel(originalModel);
    },
  };
}
