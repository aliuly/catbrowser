import { useEffect, useRef, useState, useMemo } from 'react';
import {
  TabulatorFull as Tabulator,
  EditModule,
  FilterModule,
  FormatModule,
  SortModule,
  GroupRowsModule,
  FrozenColumnsModule,
  ResizeColumnsModule,
  ResizeTableModule,
  MoveColumnsModule,
  MenuModule,
} from 'tabulator-tables';
import type { Options } from 'tabulator-tables';

import 'tabulator-tables/dist/css/tabulator.min.css';

import './App.css';

import {
  type PricesData,
  THEMES,
  THEME_LINK_ID,
  TABS,
  STORAGE_KEY,
  loadTheme,
  flattenRecords,
  buildColumns,
  getSystemTheme,
} from './logic';

/* ── Register Tabulator modules ──────────────
 * TabulatorFull in v6 no longer auto-registers modules;
 * we must import and register the ones we need.       */

Tabulator.registerModule([
  EditModule,
  FilterModule,
  FormatModule,
  SortModule,
  GroupRowsModule,
  FrozenColumnsModule,
  ResizeColumnsModule,
  ResizeTableModule,
  MoveColumnsModule,
  MenuModule,
]);

/* ── Component ────────────────────────────── */

function App() {
  const [data, setData] = useState<PricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [theme, setTheme] = useState(loadTheme);

  const tableRef = useRef<HTMLDivElement>(null);
  const tabulatorRef = useRef<Tabulator | null>(null);

  // ── Fetch data on mount ──────────────────

  useEffect(() => {
    fetch('./prices.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: PricesData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ── Flatten records (stable reference) ───

  const allRecords = useMemo(() => {
    if (!data) return [];
    return flattenRecords(data);
  }, [data]);

  // ── Build / rebuild Tabulator ────────────

  useEffect(() => {
    if (!data || !tableRef.current) return;

    // Only render the table for the Prices tab
    if (activeTab !== 'prices') return;

    const columns = buildColumns(data.columns);

    const options: Options = {
      data: allRecords,
      columns,
      layout: 'fitData',
      height: '100%',
      renderVertical: 'basic',
      groupBy: 'productId',
      groupStartOpen: false,
      groupHeader: (value: unknown, count: number) => `${value} (${count})`,
    };

    const table = new Tabulator(tableRef.current, options);
    tabulatorRef.current = table;

    // Show loading overlay during group expand / collapse
    const container = tableRef.current!;
    const showLoading = () => container.classList.add('table-loading');
    const hideLoading = () => container.classList.remove('table-loading');

    // Loading overlay on group toggle
    const onToggleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.tabulator-group-toggle')) {
        showLoading();
      }
    };
    container.addEventListener('click', onToggleClick, true);

    table.on('renderComplete', hideLoading);
    table.on('groupVisibilityChanged', hideLoading);

    return () => {
      container.removeEventListener('click', onToggleClick, true);
      table.destroy();
      tabulatorRef.current = null;
    };
  }, [data, activeTab, allRecords]);

  // ── Theme link management ─────────────────

  useEffect(() => {
    let link = document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;

    if (theme === 'default') {
      // Default theme is already provided by tabulator.min.css
      if (link) link.remove();
      return;
    }

    if (!link) {
      link = document.createElement('link');
      link.id = THEME_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    link.href = `./themes/tabulator_${theme}.min.css`;

    return () => {
      // Cleanup: remove the link when this effect re-runs or unmounts
      const el = document.getElementById(THEME_LINK_ID);
      if (el) el.remove();
    };
  }, [theme]);

  // ── React to system colour-scheme changes ─

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      // Only follow system if the user hasn't explicitly chosen a theme
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(getSystemTheme());
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // ── Theme handler ─────────────────────────

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const handleClearFilters = () => {
    tabulatorRef.current?.clearFilter(true);
  };

  // ── Render ────────────────────────────────

  if (loading) {
    return <div className="status">Loading prices.json…</div>;
  }

  if (error) {
    return <div className="status error">Failed to load: {error}</div>;
  }

  return (
    <div className="app">
      <div className="top-bar">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab${tab.id === activeTab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button className="clear-filters-btn" onClick={handleClearFilters}>
          Clear filters
        </button>

        <div className="theme-selector">
          <label htmlFor="theme-select">Theme:</label>
          <select
            id="theme-select"
            value={theme}
            onChange={handleThemeChange}
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={tableRef} className="table-container" />
    </div>
  );
}

export default App;
