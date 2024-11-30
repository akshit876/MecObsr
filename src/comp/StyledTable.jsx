/* eslint-disable react/prop-types */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledTable = ({ data, highlightNGRows = false }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  const headers = [
    { key: 'SerialNumber', label: 'Serial Number', width: '12%' },
    { key: 'MarkingData', label: 'Marking Data', width: '25%' },
    { key: 'ScannerData', label: 'Scanner Data', width: '25%' },
    { key: 'Grade', label: 'Grade', width: '8%' },
    { key: 'Result', label: 'Result', width: '8%' },
    { key: 'User', label: 'User', width: '10%' },
    { key: 'Timestamp', label: 'Timestamp', width: '12%' },
  ];

  const getResultStyles = (result) => {
    switch (result) {
      case 'OK':
        return 'bg-green-600 text-white font-bold px-3 py-1 rounded-full border-2 border-green-700 shadow-sm';
      case 'NG':
        return 'bg-red-600 text-white font-bold px-4 py-1.5 rounded-full border-2 border-red-700 shadow-md';
      default:
        return '';
    }
  };

  const getCellStyles = (header, isNG) => {
    let baseStyles = 'p-3 border border-gray-900 text-sm';

    // Add bold styling for Marking and Scanner data
    if (header.key === 'MarkingData' || header.key === 'ScannerData') {
      baseStyles += ' font-semibold text-gray-900';
    }

    // Add User styling
    if (header.key === 'User') {
      baseStyles += ' font-medium text-gray-700';
    }

    // Add NG text color if applicable
    if (isNG) {
      baseStyles += ' text-red-900';
    }

    return baseStyles;
  };

  return (
    <div className="w-full border border-gray-900">
      <table className="w-full table-fixed border-collapse">
        {/* Header */}
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                style={{ width: header.width }}
                className="bg-white text-left text-sm font-semibold text-gray-900 p-3 border border-gray-900"
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      {/* Scrollable Body */}
      <div className="overflow-auto max-h-[calc(100vh-16rem)]">
        <table className="w-full table-fixed border-collapse">
          <tbody>
            {data.map((row, rowIndex) => {
              const isNG = row['Result'] === 'NG';
              const isOK = row['Result'] === 'OK';
              const rowBackgroundColor = isNG
                ? 'bg-red-100'
                : isOK
                  ? 'bg-green-100'
                  : rowIndex % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-50';

              return (
                <tr key={rowIndex} className={`${rowBackgroundColor}`}>
                  {headers.map((header) => (
                    <td
                      key={header.key}
                      style={{ width: header.width }}
                      className={getCellStyles(header, isNG)}
                    >
                      {header.key === 'Result' ? (
                        <span className={getResultStyles(row[header.key])}>{row[header.key]}</span>
                      ) : header.key === 'Timestamp' ? (
                        new Date(row[header.key]).toLocaleString()
                      ) : header.key === 'ScannerData' ? (
                        <div
                          className="truncate font-semibold text-gray-900"
                          title={`${row[header.key]} (Grade: ${row['Grade']})`}
                        >
                          {row[header.key]} (Grade: {row['Grade']})
                        </div>
                      ) : (
                        <div
                          className={`truncate ${
                            header.key === 'MarkingData' ? 'font-semibold text-gray-900' : ''
                          }`}
                          title={row[header.key]}
                        >
                          {row[header.key]}
                        </div>
                      )}
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
