import { useMemo, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';
import type { ColDef, GridApi, ColumnState } from 'ag-grid-community';

import { type ColumnInfo, DROPDOWN_FILTER_FIELDS } from './logic';
import DropdownFilter from './DropdownFilter';
import { syncFilterValues, type SyncHandle } from './filterSync';

/* ── Column state persistence ──────────────── */

const COL_STATE_KEY = 'catbrowser-column-state';
const FILTER_STATE_KEY = 'catbrowser-filter-state';

function loadColumnState(): ColumnState[] | null {
  try {
    const raw = localStorage.getItem(COL_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadFilterModel() {
  try {
    const raw = localStorage.getItem(FILTER_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

let saveTimer: number | undefined;
let filterSaveTimer: number | undefined;

function scheduleSave(api: GridApi) {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    localStorage.setItem(COL_STATE_KEY, JSON.stringify(api.getColumnState()));
  }, 300);
}

function scheduleFilterSave(api: GridApi) {
  window.clearTimeout(filterSaveTimer);
  filterSaveTimer = window.setTimeout(() => {
    const model = api.getFilterModel();
    if (Object.keys(model).length === 0) {
      localStorage.removeItem(FILTER_STATE_KEY);
    } else {
      localStorage.setItem(FILTER_STATE_KEY, JSON.stringify(model));
    }
  }, 800);
}

/* ── AG Grid filter mapping ──────────────── */

const FILTER_MAP: Record<string, string> = {
  text: 'agTextColumnFilter',
  number: 'agNumberColumnFilter',
  boolean: 'agTextColumnFilter',
  dropdown: 'DropdownFilter',
};

/* ── Column builder → AG Grid ColDef[] ───── */

function toColDefs(
  columns: ColumnInfo[],
  dropdownValues: Record<string, string[]>,
  getNarrowed: (colId: string) => string[],
  savedState: ColumnState[] | null,
): ColDef[] {
  const stateMap = new Map(savedState?.map((s) => [s.colId, s]) ?? []);

  const defs = columns.map<ColDef>((col) => {
    const saved = stateMap.get(col.id);
    const def: ColDef = {
      field: col.id,
      headerName: col.header,
      width: saved?.width ?? col.size,
      minWidth: 80,
      resizable: true,
      sortable: true,
      hide: col.hide ?? false,
    };

    if (col.filter === 'dropdown') {
      def.filter = 'DropdownFilter';
      def.filterParams = {
        getValues: () => getNarrowed(col.id) ?? dropdownValues[col.id] ?? [],
      };
      def.floatingFilter = false;
    } else {
      def.filter =
        FILTER_MAP[col.filter ?? 'text'] ?? 'agTextColumnFilter';
    }

    /* ── Pin Service ID to the left ── */
    if (col.id === 'productId') {
      def.pinned = 'left';
    }

    /* ── Boolean pretty-print ── */
    if (col.id === 'isMRC') {
      def.valueFormatter = (p) => (p.value ? '✓' : '✗');
      def.maxWidth = 80;
    }

    /* ── Render override ── */
    if (col.render) {
      def.valueFormatter = (p) => col.render!(p.value);
    }

    return def;
  });

  /* Reorder columns to match saved state (if available),
   * otherwise apply default ordering. */
  if (savedState) {
    const orderMap = new Map(savedState.map((s, i) => [s.colId, i]));
    defs.sort((a, b) => {
      const ai = orderMap.get(a.field!) ?? 999;
      const bi = orderMap.get(b.field!) ?? 999;
      return ai - bi;
    });
  } else {
    /* Move the pinned Service ID column to the front. */
    const pinnedIdx = defs.findIndex((d) => d.field === 'productId');
    if (pinnedIdx > 0) {
      const [pinned] = defs.splice(pinnedIdx, 1);
      defs.unshift(pinned);
    }
  }

  return defs;
}

/* ── Component ───────────────────────────── */

interface PriceTableProps {
  data: Record<string, unknown>[];
  columns: ColumnInfo[];
  onGridReady?: (api: GridApi) => void;
}

export default function PriceTable({ data, columns, onGridReady }: PriceTableProps) {
  const dropdownValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const colId of DROPDOWN_FILTER_FIELDS) {
      const vals = new Set(data.map((r) => String(r[colId] ?? '')));
      vals.delete('');
      map[colId] = [...vals].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
    }
    return map;
  }, [data]);

  /* ── Saved column state (for columnDefs) ──── */
  const savedState = useMemo(() => loadColumnState(), []);
  const savedFilterModel = useMemo(() => loadFilterModel(), []);

  /* ── Narrowed dropdown cache ─────────────── */
  const narrowedRef = useRef<Record<string, string[]>>({});

  const getNarrowed = (colId: string): string[] =>
    narrowedRef.current[colId] ?? dropdownValues[colId] ?? [];

  const columnDefs = useMemo(
    () => toColDefs(columns, dropdownValues, getNarrowed, savedState),
    [columns, dropdownValues, savedState],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
    }),
    [],
  );

  const components = useMemo(() => ({ DropdownFilter }), []);

  /* ── Save column state on user changes ───── */
  const startingRef = useRef(true);

  /* ── Cross‑filter sync ──────────────────── */
  const syncRef = useRef<SyncHandle | null>(null);
  const syncingRef = useRef(false);            // guard against re-entry
  const lastModelRef = useRef('');             // skip duplicate model events
  const dropdownCols = useMemo(() => [...DROPDOWN_FILTER_FIELDS], []);

  useEffect(() => {
    return () => syncRef.current?.cancel();
  }, []);

  return (
    <div className="ag-theme-quartz flex-1">
      <AgGridReact
        modules={[AllCommunityModule]}
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        components={components}
        pagination={true}
        paginationPageSize={100}
        onGridReady={(event) => { onGridReady?.(event.api); }}
        onFirstDataRendered={(event) => {
          startingRef.current = false;
          /* Restore saved filter model after grid is settled. */
          if (savedFilterModel && Object.keys(savedFilterModel).length > 0) {
            event.api.setFilterModel(savedFilterModel);
          }
        }}
        onColumnMoved={(event) => {
          if (startingRef.current) return;
          scheduleSave(event.api);
        }}
        onColumnResized={(event) => {
          if (!event.finished || startingRef.current) return;
          scheduleSave(event.api);
        }}
        onFilterChanged={(event) => {
          if (syncingRef.current) {
            console.log('[guard] blocked filterChanged, model:', JSON.stringify(event.api.getFilterModel()));
            return;
          }

          const currentModel = JSON.stringify(event.api.getFilterModel());

          /* All filters cleared — reset narrowed cache. */
          if (currentModel === '{}') narrowedRef.current = {};

          /* AG Grid fires filterChanged asynchronously multiple times
           * after setFilterModel.  If the model hasn't changed since
           * the last sync we completed, this is a stale duplicate. */
          if (currentModel === lastModelRef.current) {
            console.log('[guard] duplicate model, skipping');
            return;
          }

          console.log('[sync] START, model:', currentModel);
          lastModelRef.current = currentModel;
          /* Persist filter model (debounced).  Only reaches here for
           * genuine user changes — sync-triggered events are guarded. */
          scheduleFilterSave(event.api);
          syncRef.current?.cancel();
          syncingRef.current = true;

          syncRef.current = syncFilterValues(
            event.api,
            dropdownCols,
            (colId, values) => {
              /* Skip columns that currently have an active filter —
               * their popup may still be open and we don't want to
               * change options underneath the user. */
              const activeCols = Object.keys(JSON.parse(currentModel));
              if (!activeCols.includes(colId)) {
                narrowedRef.current[colId] = values;
              }
              console.log('[sync] narrowed', colId, values.length, 'values',
                activeCols.includes(colId) ? '(skipped — active filter)' : '');
            },
            () => {
              console.log('[sync] COMPLETE — scheduling unguard');
              setTimeout(() => {
                console.log('[sync] UNGUARD');
                syncingRef.current = false;
                syncRef.current = null;
              }, 0);
            },
          );
        }}
      />
    </div>
  );
}
