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
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-gray-700"
        onClick={() => column.toggleSorting()}
      >
        Serial Number
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
    size: 150,
  }),
  columnHelper.accessor('MarkingData', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-gray-700"
        onClick={() => column.toggleSorting()}
      >
        Marking Data
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: (info) => (
      <div className="font-semibold text-gray-900 truncate" title={info.getValue()}>
        {info.getValue()}
      </div>
    ),
    size: 200,
  }),
  columnHelper.accessor('ScannerData', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-gray-700"
        onClick={() => column.toggleSorting()}
      >
        Scanner Data
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: (info) => (
      <div className="font-semibold text-gray-900 truncate" title={info.getValue()}>
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
          ? 'bg-green-600 text-white font-bold px-3 py-1 rounded-full border-2 border-green-700 shadow-sm'
          : result === 'NG'
            ? 'bg-red-600 text-white font-bold px-4 py-1.5 rounded-full border-2 border-red-700 shadow-md'
            : '';
      return <span className={styles}>{result}</span>;
    },
    size: 100,
  }),
  columnHelper.accessor('User', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-gray-700"
        onClick={() => column.toggleSorting()}
      >
        User
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: (info) => <div className="font-medium text-gray-700">{info.getValue()}</div>,
    size: 150,
  }),
  columnHelper.accessor('Timestamp', {
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-gray-700"
        onClick={() => column.toggleSorting()}
      >
        Timestamp
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: (info) => (
      <div className="text-gray-600">{new Date(info.getValue()).toLocaleString()}</div>
    ),
    size: 150,
  }),
];

const StyledTable = ({ data }) => {
  const [sorting, setSorting] = useState([]);

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
    <div className="w-full border border-gray-900">
      <div className="w-full">
        <table className="w-full table-fixed border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="bg-white text-left text-sm font-semibold text-gray-900 p-3 border border-gray-900"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        </table>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-16rem)]">
        <table className="w-full table-fixed border-collapse">
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isNG = row.original.Result === 'NG';
              const isOK = row.original.Result === 'OK';
              const rowBackgroundColor = isNG
                ? 'bg-red-100'
                : isOK
                  ? 'bg-green-100'
                  : row.index % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-50';

              return (
                <tr key={row.id} className={rowBackgroundColor}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={`p-3 border border-gray-900 text-sm ${isNG ? 'text-red-900' : ''}`}
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
