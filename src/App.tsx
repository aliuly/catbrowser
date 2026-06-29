import { useEffect, useState, useMemo } from 'react';
import PriceTable from './PriceTable';
import { type PricesData, TABS, flattenRecords, buildColumns } from './logic';

/* ── Component ────────────────────────────── */

function App() {
  const [data, setData] = useState<PricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TABS[0].id);

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
      <div className="flex items-center px-4 py-1.5 bg-gray-100 border-b border-gray-300 shrink-0 gap-4">
        <div className="flex gap-0.5 self-end">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`px-5 py-1.5 border border-gray-400 rounded-t cursor-pointer text-xs font-medium transition-colors duration-150 ${
                tab.id === activeTab
                  ? 'bg-white text-gray-900 border-b-white font-semibold'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <PriceTable data={allRecords} columns={columns} />
    </div>
  );
}

export default App;
