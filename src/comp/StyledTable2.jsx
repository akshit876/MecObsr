/* eslint-disable react/prop-types */
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import React from 'react';

const columnHelper = createColumnHelper();

// Helper function to calculate piece number based on timestamp
const calculatePieceNumber = (timestamp, data, index) => {
  const recordDate = new Date(timestamp);
  const startOfDay = new Date(recordDate);
  startOfDay.setHours(6, 0, 0, 0); // Start counting from 6 AM

  // If the record is before 6 AM, consider it part of previous day
  if (recordDate.getHours() < 6) {
    startOfDay.setDate(startOfDay.getDate() - 1);
  }

  // Filter records from the same day (from 6 AM onwards)
  const sameDayRecords = data.filter((record) => {
    const recordTimestamp = new Date(record.Timestamp);
    const recordStartOfDay = new Date(recordTimestamp);
    recordStartOfDay.setHours(6, 0, 0, 0);

    if (recordTimestamp.getHours() < 6) {
      recordStartOfDay.setDate(recordStartOfDay.getDate() - 1);
    }

    return recordStartOfDay.getTime() === startOfDay.getTime() && recordTimestamp >= startOfDay;
  });

  // Sort by timestamp and find the position
  sameDayRecords.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
  const pieceIndex = sameDayRecords.findIndex((record) => record.Timestamp === timestamp);

  return pieceIndex + 1;
};

const createColumns = (data) => [
  columnHelper.accessor('SerialNumber', {
    header: 'Piece #',
    cell: (info) => {
      const pieceNumber = calculatePieceNumber(info.row.original.Timestamp, data, info.row.index);
      return <div className="font-medium text-center text-xs">{pieceNumber}</div>;
    },
    size: 60,
  }),

  columnHelper.accessor('MarkingData', {
    header: 'Serial No/Model No',
    cell: (info) => {
      const serialNumber = info.row.original.SerialNumber;
      const modelNumber = info.row.original.ModelNumber || 'N/A';
      return (
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-blue-900 bg-gradient-to-r from-blue-50 to-blue-100 px-1.5 py-0.5 rounded border border-blue-200/50 truncate">
            {serialNumber}
          </div>
          <div className="text-[10px] font-medium text-emerald-800 bg-gradient-to-r from-emerald-50 to-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200/50 truncate">
            {modelNumber}
          </div>
        </div>
      );
    },
    size: 100,
  }),

  columnHelper.accessor('MarkingData', {
    header: 'Marking Data',
    cell: (info) => (
      <div
        className="font-bold text-gray-700 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis"
        title={info.getValue()}
      >
        {info.getValue()}
      </div>
    ),
    size: 200,
    id: 'markingDataContent',
  }),

  columnHelper.accessor('ScannerData', {
    header: 'Scanner Data',
    cell: (info) => (
      <div
        className="font-bold text-gray-700 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis"
        title={info.getValue()}
      >
        {info.getValue()}
      </div>
    ),
    size: 200,
  }),

  columnHelper.accessor('Result', {
    header: 'Result',
    cell: (info) => {
      const result = info.getValue();
      const styles =
        result === 'OK'
          ? 'bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold'
          : result === 'NG'
            ? 'bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold shadow-sm'
            : '';
      return <span className={styles}>{result}</span>;
    },
    size: 60,
  }),

  columnHelper.accessor('Timestamp', {
    header: 'Created At',
    cell: (info) => (
      <div className="text-gray-600 text-[10px] leading-tight whitespace-nowrap">
        {new Date(info.getValue()).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}
      </div>
    ),
    size: 90,
  }),
];

const StyledTable = ({ data = [] }) => {
  const [sorting, setSorting] = useState([]);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => createColumns(data), [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        No data available
      </div>
    );
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      {/* Header with scroll info */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-semibold text-gray-700">Production Records</h3>
          <div className="text-xs text-gray-500">
            Showing {data.length.toLocaleString()} records
          </div>
        </div>
      </div>

      {/* Optimized scrollable table with fixed height for large datasets */}
      <div
        className="w-full overflow-auto"
        style={{ height: 'calc(100vh - 22rem)', minHeight: '400px', maxHeight: '70vh' }}
      >
        <table className="w-full border-collapse relative min-w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-white shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-white border-b border-gray-200">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-left text-[11px] font-medium text-gray-600 p-2 bg-white border-r border-gray-100 last:border-r-0"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => {
              const result = row.original.Result;
              const rowClassName = `
                border-b border-gray-100 last:border-0 h-10
                ${
                  result === 'NG'
                    ? 'bg-red-50 hover:bg-red-100'
                    : result === 'OK'
                      ? 'bg-green-50 hover:bg-green-100'
                      : index % 2 === 0
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-25 hover:bg-gray-50'
                }
                transition-colors duration-150
              `;

              return (
                <tr key={row.id} className={rowClassName}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={`p-1.5 text-xs border-r border-gray-100 last:border-r-0 ${
                        result === 'NG'
                          ? 'text-red-900 font-medium'
                          : result === 'OK'
                            ? 'text-green-900'
                            : 'text-gray-800'
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with record count */}
      <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
        <div className="text-xs text-gray-600 text-center">
          {data.length >= 5000 ? 'Showing latest 5,000 records' : `Total ${data.length} records`}
        </div>
      </div>
    </div>
  );
};

export default StyledTable;
