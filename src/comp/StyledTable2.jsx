/* eslint-disable react/prop-types */
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
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
      return <div className="font-medium text-center">{pieceNumber}</div>;
    },
    size: 50,
  }),

  columnHelper.accessor('MarkingData', {
    header: 'Serial No/Model No',
    cell: (info) => {
      const serialNumber = info.row.original.SerialNumber;
      const modelNumber = info.row.original.ModelNumber || 'N/A';
      return (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-blue-900 bg-gradient-to-r from-blue-50 to-blue-100 px-2 py-1 rounded-md border border-blue-200/50 truncate">
            {serialNumber}
          </div>
          <div className="text-xs font-medium text-emerald-800 bg-gradient-to-r from-emerald-50 to-emerald-100 px-2 py-1 rounded-md border border-emerald-200/50 truncate">
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
        className="font-bold text-gray-700 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
        title={info.getValue()}
      >
        {info.getValue()}
      </div>
    ),
    size: 220,
    id: 'markingDataContent',
  }),

  columnHelper.accessor('ScannerData', {
    header: 'Scanner Data',
    cell: (info) => (
      <div
        className="font-bold text-gray-700 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
        title={info.getValue()}
      >
        {info.getValue()}
      </div>
    ),
    size: 220,
  }),

  columnHelper.accessor('Result', {
    header: 'Result',
    cell: (info) => {
      const result = info.getValue();
      const styles =
        result === 'OK'
          ? 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-extrabold'
          : result === 'NG'
            ? 'bg-red-600 text-white text-xs px-3 py-1 rounded-full font-extrabold shadow-sm'
            : '';
      return <span className={styles}>{result}</span>;
    },
    size: 70,
  }),

  columnHelper.accessor('Timestamp', {
    header: 'Created At',
    cell: (info) => (
      <div className="text-gray-600 text-xs leading-tight whitespace-nowrap">
        {new Date(info.getValue()).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}
      </div>
    ),
    size: 100,
  }),
];

const StyledTable = ({ data = [] }) => {
  const [sorting, setSorting] = useState([]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        No data available
      </div>
    );
  }

  const table = useReactTable({
    data,
    columns: createColumns(data),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      <div className="w-full overflow-x-hidden overflow-y-auto max-h-[calc(100vh-16rem)]">
        <table className="w-full border-collapse relative min-w-full table-fixed">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-white border-b border-gray-200 shadow-sm">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-left text-sm font-medium text-gray-600 p-2 bg-white"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const result = row.original.Result;
              const rowClassName = `
                border-b border-gray-200 last:border-0
                ${
                  result === 'NG'
                    ? 'bg-red-50 hover:bg-red-100'
                    : result === 'OK'
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'hover:bg-gray-50'
                }
              `;

              return (
                <tr key={row.id} className={rowClassName}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={`p-2 text-sm ${
                        result === 'NG'
                          ? 'text-red-900 font-medium'
                          : result === 'OK'
                            ? 'text-green-900'
                            : ''
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
    </div>
  );
};

export default StyledTable;
