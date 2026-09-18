import React from 'react';

const Table = ({ columns, data, emptyMessage = 'No records found.' }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3.5 font-semibold ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-slate-900/40">
          {data && data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-800/40 transition">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
