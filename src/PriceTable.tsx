import { type ColumnInfo } from './logic';

interface PriceTableProps {
  data: Record<string, unknown>[];
  columns: ColumnInfo[];
}

export default function PriceTable({ data, columns }: PriceTableProps) {
  return (
    <div className="flex-1 overflow-auto table-container">
      <table className="w-full border-collapse table-fixed">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.id}
                className="border-b border-gray-300 border-r border-gray-200 last:border-r-0 text-xs font-semibold text-gray-700 px-3 py-1.5 text-left truncate"
                style={{ width: col.size }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-100">
              {columns.map((col) => (
                <td
                  key={col.id}
                  className="text-xs px-3 py-1.5 overflow-hidden"
                  style={{ width: col.size }}
                >
                  {col.render
                    ? col.render(row[col.id])
                    : String(row[col.id] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
