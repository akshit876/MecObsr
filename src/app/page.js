'use client';
import StyledTable from '@/comp/StyledTable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { useCsvData } from '../../hooks';
import { toast, ToastContainer } from 'react-toastify';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';
import { Calendar, CalendarIcon } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import PartNumberConfig from '@/components/PartNumberConfig';
import { useRouter } from 'next/navigation';

function AdminPanel() {
  const { csvData, loading } = useCsvData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { session, status } = useProtectedRoute();
  console.log({ startDate, endDate });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>
    );
  }

  // If no session, the hook will redirect, but we can return null while that happens
  if (!session) {
    router.push('/login');
    return null;
  }

  const handleDownloadExcel = async () => {
    console.log('Downloading Excel with date range:', startDate, endDate);

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsLoading(true); // Optional: manage loading state
    try {
      // Fetch data from the server
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();

      if (data.length === 0) {
        toast.error('No data found for the specified date range.');
        return;
      }

      // Format the data as per the requirements
      const formattedData = data.map((row) => ({
        SerialNumber: row.SerialNumber,
        Timestamp: format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss'), // Format date to dd/mm/yyyy hh:mm:ss
        MarkingData: row.MarkingData,
        ScannerData: row.ScannerData,
        Result: row.Result,
      }));

      // Create a worksheet from the formatted data
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Calculate and set column widths based on the content of each column
      const columnWidths = Object.keys(formattedData[0]).map((key) => ({
        wch: Math.max(
          key.length, // Column header width
          ...formattedData.map((row) => (row[key] ? row[key].toString().length : 10)), // Content width
        ),
      }));
      worksheet['!cols'] = columnWidths;

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      // Write the workbook to a binary string
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      // Create a Blob from the Excel binary and trigger download
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report_${format(startDate, 'yyyy-MM-dd')}_to_${format(
        endDate,
        'yyyy-MM-dd',
      )}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Error generating report: ' + error.message);
    } finally {
      setIsLoading(false); // Optional: manage loading state
    }
  };
  // console.log({ csvData });
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mb-6 flex items-center space-x-4">
        <DatePicker selected={startDate} onSelect={setStartDate} placeholder="Start Date" />
        <DatePicker selected={endDate} onSelect={setEndDate} placeholder="End Date" />
        <Button onClick={handleDownloadExcel}>Download CSV Report</Button>
      </div>
      <StyledTable data={csvData?.data} highlightNGRows />
    </div>
  );
}

export default AdminPanel;
