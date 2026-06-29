import { useEffect, useState, useMemo, useRef } from 'react';
import type { GridApi } from 'ag-grid-community';
import PriceTable from './PriceTable';
import { type PricesData, TABS, flattenRecords, buildColumns } from './logic';

/* ── Component ────────────────────────────── */

function App() {
  const [data, setData] = useState<PricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const gridRef = useRef<GridApi | null>(null);

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

  const allRecords = useMemo(() => {
    if (!data) return [];
    return flattenRecords(data);
  }, [data]);

  const columns = useMemo(() => {
    if (!data) return [];
    return buildColumns(data.columns);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-base text-gray-400">
        Loading prices.json…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-base text-red-700">
        Failed to load: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen font-sans text-sm text-gray-800 bg-white">
      <div className="flex items-center px-4 py-1.5 bg-gray-100 border-b border-magenta-500 shrink-0 gap-4">
        <div className="flex gap-0.5 self-end">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`px-5 py-1.5 border border-gray-400 rounded-t cursor-pointer text-xs font-medium transition-colors duration-150 ${
                tab.id === activeTab
                  ? 'bg-white text-magenta-700 border-magenta-500 border-b-white font-semibold'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          title="Clear all filters"
          className="ml-auto p-1 rounded hover:bg-magenta-100 text-gray-500 hover:text-magenta-700"
          onClick={() => gridRef.current?.setFilterModel({})}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            <line x1="4" y1="3" x2="20" y2="21" />
          </svg>
        </button>
        <div className="relative">
          <button
            title="More"
            className="p-1 rounded hover:bg-magenta-100 text-gray-500 hover:text-magenta-700"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-48">
                <button
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100"
                  onClick={() => {
                    setMenuOpen(false);
                    localStorage.removeItem('catbrowser-column-state');
                    localStorage.removeItem('catbrowser-filter-state');
                    window.location.reload();
                  }}
                >
                  Reset column layout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <PriceTable
        data={allRecords}
        columns={columns}
        onGridReady={(api) => { gridRef.current = api; }}
      />
    </div>
  );
}

export default App;
