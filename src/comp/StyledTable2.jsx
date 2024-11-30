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

const columns = [
  columnHelper.accessor('SerialNumber', {
    header: 'SNO',
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
    size: 150,
  }),

  columnHelper.accessor('MarkingData', {
    header: 'Marking Data',
    cell: (info) => <div className="font-medium text-gray-600">{info.getValue()}</div>,
    size: 200,
  }),

  columnHelper.accessor('ScannerData', {
    header: 'Scanner Data',
    cell: (info) => <div className="font-medium text-gray-600">{info.getValue()}</div>,
    size: 200,
  }),

  columnHelper.accessor('Result', {
    header: 'Result',
    cell: (info) => {
      const result = info.getValue();
      const styles =
        result === 'OK'
          ? 'bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold'
          : result === 'NG'
            ? 'bg-red-600 text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-sm'
            : '';
      return <span className={styles}>{result}</span>;
    },
    size: 100,
  }),

  columnHelper.accessor('User', {
    header: 'User',
    cell: (info) => <div className="font-medium text-gray-600">{info.getValue()}</div>,
    size: 150,
  }),

  columnHelper.accessor('Grade', {
    header: ({ column }) => {
      return (
        <div className="flex items-center cursor-pointer">
          Grade
        </div>
      );
    },
    cell: (info) => {
      const grade = info.getValue();
      const gradeStyles = {
        'A': 'bg-emerald-100 text-emerald-800',
        'B': 'bg-blue-100 text-blue-800',
        'C': 'bg-amber-100 text-amber-800',
        'D': 'bg-red-100 text-red-800'
      };
      
      const baseStyles = 'text-xs px-3 py-1 rounded-full font-semibold';
      const colorStyles = gradeStyles[grade] || 'bg-gray-100 text-gray-800';
      
      return <span className={`${baseStyles} ${colorStyles}`}>{grade}</span>;
    },
    size: 100,
  }),

  columnHelper.accessor('Timestamp', {
    header: 'Created At',
    cell: (info) => (
      <div className="text-gray-600">
        {new Date(info.getValue()).toLocaleString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}
      </div>
    ),
    size: 200,
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
      <div className="w-full overflow-auto max-h-[calc(100vh-16rem)]">
        <table className="w-full border-collapse relative">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-white border-b border-gray-200 shadow-sm">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-left text-sm font-medium text-gray-600 p-3 bg-white"
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
                      className={`p-3 text-sm ${
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
