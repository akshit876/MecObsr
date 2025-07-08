/* eslint-disable react/prop-types */
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import React from 'react';

const columnHelper = createColumnHelper();

// Helper function to calculate piece number based on timestamp
const calculatePieceNumber = (timestamp, data) => {
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
  columnHelper.accessor('Timestamp', {
    header: 'Piece #',
    cell: (info) => {
      const pieceNumber = calculatePieceNumber(info.row.original.Timestamp, data);
      return <div className="font-medium text-center text-xs">{pieceNumber}</div>;
    },
    size: 60,
  }),
  // columnHelper.accessor('MarkingData', {
  //   header: 'Serial No',
  //   cell: (info) => {
  //     const serialNumber = info.row.original.SerialNumber;
  //     return (
  //       <div className="font-bold text-gray-700 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
  //         {serialNumber}
  //       </div>
  //     );
  //   },
  //   size: 100,
  // }),

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
    size: 200,
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
    size: 200,
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

const StyledTable = ({
  data = [],
  hasMore = false,
  onLoadMore,
  onRefresh,
  isLoading = false,
  totalRecords = 0,
}) => {
  const [sorting, setSorting] = useState([]);
  const scrollRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => createColumns(data), [data]);

  // Infinite scroll implementation with throttling
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isLoadingMore || !hasMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when user scrolls to 85% of current content
    if (scrollPercentage > 0.85) {
      setIsLoadingMore(true);

      // Call the load more function with a small delay for smooth UX
      setTimeout(() => {
        if (onLoadMore) {
          onLoadMore();
        }
        setIsLoadingMore(false);
      }, 200);
    }
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  // Throttled scroll handler for better performance
  const throttledHandleScroll = useMemo(() => {
    let timeoutId;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100); // Throttle to 100ms
    };
  }, [handleScroll]);

  // Attach scroll listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', throttledHandleScroll, { passive: true });
      return () => scrollElement.removeEventListener('scroll', throttledHandleScroll);
    }
  }, [throttledHandleScroll]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        {isLoading ? 'Loading data...' : 'No data available'}
      </div>
    );
  }

  const table = useReactTable({
    data, // Use all data (no client-side slicing)
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    // No pagination - using server-side pagination via socket
    manualPagination: false,
    enablePagination: false,
  });

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-semibold text-gray-700">Production Records</h3>
          <div className="flex items-center gap-2">
            {isLoadingMore && <span className="text-xs text-blue-600">Loading more...</span>}
            {isLoading && <span className="text-xs text-blue-600">Loading...</span>}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                🔄 Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable table with server-side pagination */}
      <div ref={scrollRef} className="w-full overflow-auto flex-1" style={{ minHeight: '300px' }}>
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

        {/* Loading indicator at bottom */}
        {(isLoadingMore || isLoading) && (
          <div className="flex justify-center items-center py-4 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              {isLoading ? 'Loading records...' : 'Loading more records...'}
            </div>
          </div>
        )}

        {/* End indicator when no more data */}
        {!hasMore && !isLoading && data.length > 0 && (
          <div className="flex justify-center items-center py-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              All {totalRecords.toLocaleString()} records loaded
            </div>
          </div>
        )}
      </div>

      {/* Footer with record count */}
      <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
        <div className="text-xs text-gray-600 text-center">
          {hasMore && !isLoading
            ? `Loaded ${data.length.toLocaleString()} of ${totalRecords.toLocaleString()} records - scroll for more`
            : data.length > 0
              ? `All ${totalRecords.toLocaleString()} records loaded`
              : 'No records to display'}
        </div>
      </div>
    </div>
  );
};

export default StyledTable;
